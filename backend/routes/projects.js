const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(authenticateToken);

// Get all projects for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const [projects] = await db.pool.query(
      'SELECT id, name, description, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Get a single project
router.get('/:id', async (req, res, next) => {
  try {
    const [projects] = await db.pool.query(
      'SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project: projects[0] });
  } catch (error) {
    next(error);
  }
});

// Create a new project
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const [result] = await db.pool.query(
      'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
      [req.user.userId, name, description || null]
    );

    const [projects] = await db.pool.query(
      'SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: projects[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update a project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Verify project belongs to user
    const [existingProjects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await db.pool.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, description || null, req.params.id, req.user.userId]
    );

    const [projects] = await db.pool.query(
      'SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'Project updated successfully',
      project: projects[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete a project
router.delete('/:id', async (req, res, next) => {
  try {
    // Verify project belongs to user
    const [existingProjects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await db.pool.query(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
