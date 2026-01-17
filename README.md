# Chatbot Platform

A full-stack chatbot platform that allows users to create AI-powered agents/projects with customizable prompts, chat interfaces, and file upload capabilities.

## Features

- ✅ **User Authentication**: JWT-based authentication with registration and login
- ✅ **Project Management**: Create, update, and delete projects/agents
- ✅ **Prompt Management**: Store and manage system prompts for each project
- ✅ **Chat Interface**: Real-time chat interface with AI agents using OpenAI or OpenRouter APIs
- ✅ **File Uploads**: Upload files to projects using OpenAI Files API
- ✅ **Chat History**: Persistent chat history for each project
- ✅ **Responsive Design**: Modern, mobile-friendly UI

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **OpenAI API** / **OpenRouter API** for LLM integration

### Frontend
- **React.js** with React Router
- **Axios** for API calls
- **CSS3** for styling

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MySQL (v5.7 or higher)
- OpenAI API key (or OpenRouter API key)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Yellow ai"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chatbot_platform
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OpenAI Configuration (Optional - use either OpenAI or OpenRouter)
OPENAI_API_KEY=your_openai_api_key_here

# OpenRouter Configuration (Optional - alternative to OpenAI)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Database Setup

1. Start your MySQL server
2. The database and tables will be automatically created when you start the backend server for the first time

## Running the Application

### Development Mode

1. **Start the Backend Server**:

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**:

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the Frontend**:

```bash
cd frontend
npm run build
```

2. **Start the Backend** (with production environment):

```bash
cd backend
NODE_ENV=production npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Projects
- `GET /api/projects` - Get all user projects (protected)
- `GET /api/projects/:id` - Get a single project (protected)
- `POST /api/projects` - Create a new project (protected)
- `PUT /api/projects/:id` - Update a project (protected)
- `DELETE /api/projects/:id` - Delete a project (protected)

### Prompts
- `GET /api/prompts/project/:projectId` - Get all prompts for a project (protected)
- `GET /api/prompts/:id` - Get a single prompt (protected)
- `POST /api/prompts` - Create a new prompt (protected)
- `PUT /api/prompts/:id` - Update a prompt (protected)
- `DELETE /api/prompts/:id` - Delete a prompt (protected)

### Chat
- `POST /api/chat/:projectId` - Send a chat message (protected)
- `GET /api/chat/:projectId/history` - Get chat history (protected)

### Files
- `POST /api/files/:projectId/upload` - Upload a file (protected)
- `GET /api/files/:projectId` - Get all files for a project (protected)
- `DELETE /api/files/:projectId/:fileId` - Delete a file (protected)

## Project Structure

```
Yellow ai/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration and schema
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── projects.js           # Project management routes
│   │   ├── prompts.js            # Prompt management routes
│   │   ├── chat.js               # Chat API routes
│   │   └── files.js              # File upload routes
│   ├── uploads/                  # Temporary file uploads directory
│   ├── server.js                 # Express server setup
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js          # Navigation component
    │   │   └── PrivateRoute.js    # Protected route component
    │   ├── context/
    │   │   └── AuthContext.js     # Authentication context
    │   ├── pages/
    │   │   ├── Login.js           # Login page
    │   │   ├── Register.js        # Registration page
    │   │   ├── Dashboard.js       # Projects dashboard
    │   │   └── ProjectDetail.js   # Project detail with chat
    │   ├── App.js                 # Main app component
    │   └── index.js               # Entry point
    └── package.json
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Project**: Click "Create New Project" to create a new agent/project
3. **Add Prompts**: In the project detail page, add system prompts to customize your agent's behavior
4. **Upload Files** (Optional): Upload files that can be used by the AI agent
5. **Start Chatting**: Use the chat interface to interact with your AI agent

## Environment Variables

See `backend/.env.example` for all required environment variables.

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected API routes
- SQL injection prevention with parameterized queries
- CORS configuration
- Input validation

## Error Handling

The application includes comprehensive error handling:
- API error responses with appropriate status codes
- User-friendly error messages in the frontend
- Graceful error handling for external API calls

## Performance Considerations

- Database connection pooling
- Efficient database queries with indexes
- Optimized React rendering
- Chat history pagination support

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Verify database credentials in `.env`
- Check if the database exists or allow auto-creation

### API Key Issues
- Ensure you have a valid OpenAI API key or OpenRouter API key
- Check that the key is correctly set in the `.env` file
- Verify API key permissions

### Port Conflicts
- Change the PORT in backend `.env` if 5000 is in use
- Update frontend `package.json` proxy if backend port changes

## Future Enhancements

- Analytics dashboard
- Multiple LLM provider support
- Real-time chat with WebSockets
- Export chat history
- Team collaboration features
- API rate limiting
- Advanced file processing

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the repository.
