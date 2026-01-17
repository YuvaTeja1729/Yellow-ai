const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// All routes require authentication
router.use(authenticateToken);

// Send a chat message
router.post('/:projectId', async (req, res, next) => {
  try {
    const { message } = req.body; // FORCE OpenRouter
    const projectId = req.params.projectId;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Verify project belongs to user
    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get latest system prompt
    const [prompts] = await db.pool.query(
      'SELECT content FROM prompts WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );

    // Get last 10 chat messages
    const [history] = await db.pool.query(
      `SELECT role, content FROM chat_messages
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [projectId]
    );

    // Build messages
    const messages = [];

    if (prompts.length > 0) {
      messages.push({
        role: 'system',
        content: prompts[0].content
      });
    }

    history.reverse().forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    messages.push({
      role: 'user',
      content: message
    });

    // Save user message
    await db.pool.query(
      'INSERT INTO chat_messages (project_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [projectId, req.user.userId, 'user', message]
    );

    // ===== OPENROUTER CALL (FREE MODEL) =====
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'meta-llama/llama-3-8b-instruct',
        messages
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistantResponse =
      response.data.choices[0].message.content;

    // Save assistant response
    await db.pool.query(
      'INSERT INTO chat_messages (project_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [projectId, req.user.userId, 'assistant', assistantResponse]
    );

    res.json({
      message: assistantResponse,
      role: 'assistant'
    });

  } catch (error) {
    console.error(
      'LLM API Error:',
      JSON.stringify(error.response?.data || error.message, null, 2)
    );
    next(error);
  }
});

// Get chat history
router.get('/:projectId/history', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const limit = parseInt(req.query.limit) || 50;

    const [projects] = await db.pool.query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [messages] = await db.pool.query(
      `SELECT id, role, content, created_at
       FROM chat_messages
       WHERE project_id = ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [projectId, limit]
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
