const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

/**
 * Load environment variables
 * - Local development: loads from .env
 * - Production (Render): uses Render Environment Variables
 */
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

/**
 * Validate required environment variables
 */
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not set');
  console.error('➡️ Set JWT_SECRET in Render Environment Variables');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/files', require('./routes/files'));

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chatbot Platform API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/**
 * Initialize Database & Start Server
 */
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;
