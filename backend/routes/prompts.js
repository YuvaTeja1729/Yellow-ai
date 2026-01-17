const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(authenticateToken);

// Get all prompts for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [prompts] = await db.pool.query(
      'SELECT id, name, content, created_at, updated_at FROM prompts WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.projectId]
    );

    res.json({ prompts });
  } catch (error) {
    next(error);
  }
});

// Get a single prompt
router.get('/:id', async (req, res, next) => {
  try {
    const [prompts] = await db.pool.query(
      `SELECT p.id, p.name, p.content, p.project_id, p.created_at, p.updated_at 
       FROM prompts p 
       INNER JOIN projects pr ON p.project_id = pr.id 
       WHERE p.id = ? AND pr.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (prompts.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    res.json({ prompt: prompts[0] });
  } catch (error) {
    next(error);
  }
});

// Create a new prompt
router.post('/', async (req, res, next) => {
  try {
    const { project_id, name, content } = req.body;

    if (!project_id || !name || !content) {
      return res.status(400).json({ message: 'Project ID, name, and content are required' });
    }

    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [project_id, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [result] = await db.pool.query(
      'INSERT INTO prompts (project_id, name, content) VALUES (?, ?, ?)',
      [project_id, name, content]
    );

    const [prompts] = await db.pool.query(
      'SELECT id, name, content, project_id, created_at, updated_at FROM prompts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Prompt created successfully',
      prompt: prompts[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update a prompt
router.put('/:id', async (req, res, next) => {
  try {
    const { name, content } = req.body;

    // Verify prompt belongs to user's project
    const [existingPrompts] = await db.pool.query(
      `SELECT p.id FROM prompts p 
       INNER JOIN projects pr ON p.project_id = pr.id 
       WHERE p.id = ? AND pr.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (existingPrompts.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    await db.pool.query(
      'UPDATE prompts SET name = ?, content = ? WHERE id = ?',
      [name, content, req.params.id]
    );

    const [prompts] = await db.pool.query(
      'SELECT id, name, content, project_id, created_at, updated_at FROM prompts WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Prompt updated successfully',
      prompt: prompts[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete a prompt
router.delete('/:id', async (req, res, next) => {
  try {
    // Verify prompt belongs to user's project
    const [existingPrompts] = await db.pool.query(
      `SELECT p.id FROM prompts p 
       INNER JOIN projects pr ON p.project_id = pr.id 
       WHERE p.id = ? AND pr.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (existingPrompts.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }

    await db.pool.query('DELETE FROM prompts WHERE id = ?', [req.params.id]);

    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
