const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database');

// Load environment variables - explicitly specify path
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  console.error('Make sure .env file exists in the backend directory');
  process.exit(1);
}

// Validate required environment variables AFTER loading .env
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables');
  console.error('Please set JWT_SECRET in your .env file');
  console.error('You can run: node setup-env.js to generate a .env file');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/files', require('./routes/files'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chatbot Platform API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;
