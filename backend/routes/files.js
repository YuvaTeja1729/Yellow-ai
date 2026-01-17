const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(authenticateToken);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload file to OpenAI and associate with project
router.post('/:projectId/upload', upload.single('file'), async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );

    if (projects.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    try {
      // Upload file to OpenAI
      const formData = new FormData();
      formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);
      formData.append('purpose', 'assistants');

      const response = await axios.post(
        'https://api.openai.com/v1/files',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders()
          }
        }
      );

      const fileData = response.data;

      // Save file reference to database
      await db.pool.query(
        'INSERT INTO project_files (project_id, file_id, file_name, file_size) VALUES (?, ?, ?, ?)',
        [projectId, fileData.id, req.file.originalname, req.file.size]
      );

      // Clean up local file
      fs.unlinkSync(req.file.path);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: fileData.id,
          name: req.file.originalname,
          size: req.file.size,
          purpose: fileData.purpose
        }
      });
    } catch (apiError) {
      // Clean up local file
      fs.unlinkSync(req.file.path);
      console.error('OpenAI API Error:', apiError.response?.data || apiError.message);
      return res.status(500).json({
        message: 'Failed to upload file to OpenAI',
        error: apiError.response?.data || apiError.message
      });
    }
  } catch (error) {
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Get all files for a project
router.get('/:projectId', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [files] = await db.pool.query(
      'SELECT id, file_id, file_name, file_size, uploaded_at FROM project_files WHERE project_id = ? ORDER BY uploaded_at DESC',
      [projectId]
    );

    res.json({ files });
  } catch (error) {
    next(error);
  }
});

// Delete a file
router.delete('/:projectId/:fileId', async (req, res, next) => {
  try {
    const { projectId, fileId } = req.params;

    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get file info
    const [files] = await db.pool.query(
      'SELECT file_id FROM project_files WHERE id = ? AND project_id = ?',
      [fileId, projectId]
    );

    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        await axios.delete(
          `https://api.openai.com/v1/files/${files[0].file_id}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
          }
        );
      } catch (apiError) {
        console.error('Error deleting file from OpenAI:', apiError.response?.data || apiError.message);
        // Continue with database deletion even if OpenAI deletion fails
      }
    }

    // Delete from database
    await db.pool.query(
      'DELETE FROM project_files WHERE id = ? AND project_id = ?',
      [fileId, projectId]
    );

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
