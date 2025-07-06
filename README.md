# AI Developer Platform

A comprehensive web-based development environment that combines real-time collaboration, AI-assisted coding, and integrated code execution capabilities. Built with modern web technologies to provide a seamless development experience.

## Overview

AI Developer Platform is a full-stack web application that enables developers to write, edit, and execute code directly in the browser. The platform features an intelligent AI assistant powered by Google Gemini, real-time collaboration tools, and a secure authentication system.

## Key Features

### Core Functionality

- **Integrated Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **AI-Powered Assistance**: Google Gemini integration for code suggestions and explanations
- **Real-Time Collaboration**: Live chat and file sharing capabilities
- **Code Execution**: Built-in runtime environment for Node.js applications
- **File Management**: Dynamic file tree with real-time updates

### Technical Capabilities

- **Express Server Support**: Execute and test Express.js applications
- **Port Management**: Automatic port conflict resolution
- **Error Handling**: Comprehensive error reporting and debugging
- **Session Persistence**: Maintains chat history and project state

### Security & Authentication

- **JWT Authentication**: Secure token-based user authentication
- **Role-Based Access**: User permission management
- **Session Management**: Persistent user sessions with Redis
- **Input Validation**: Robust server-side validation

## Technology Stack

### Frontend

- **React 18**: Modern UI framework with hooks and context
- **Monaco Editor**: Professional code editor (same as VS Code)
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API communication

### Backend

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Socket.io**: Real-time bidirectional communication
- **Redis**: Session storage and caching

### AI & External Services

- **Google Gemini API**: Advanced AI model for code assistance
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing and security

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB instance (local or cloud)
- Redis server (optional, for session storage)
- Google Gemini API key

### Environment Configuration

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-developer
JWT_SECRET=your-secure-jwt-secret-key
GEMINI_API_KEY=your-google-gemini-api-key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AI-Developer
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the development servers**

   ```bash
   # Terminal 1: Start backend server
   cd backend
   npm start

   # Terminal 2: Start frontend development server
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile

### Project Management

- `GET /api/projects` - Retrieve user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### AI Integration

- `POST /api/ai/chat` - Send message to AI assistant
- `POST /api/ai/generate` - Generate code with AI

### Code Execution

- `POST /api/run` - Execute code in sandbox environment

## Architecture

### Frontend Architecture

```
src/
├── components/     # Reusable UI components
├── screens/        # Page-level components
├── context/        # React context providers
├── config/         # Configuration files
├── auth/           # Authentication components
└── routes/         # Application routing
```

### Backend Architecture

```
backend/
├── controllers/    # Request handlers
├── models/         # Database models
├── routes/         # API route definitions
├── middleware/     # Custom middleware
├── services/       # Business logic
└── db/            # Database configuration
```

## Security Considerations

- All user inputs are validated and sanitized
- JWT tokens are used for secure authentication
- Passwords are hashed using bcrypt
- CORS is properly configured
- Rate limiting is implemented for API endpoints
- Environment variables are used for sensitive data

## Performance Optimizations

- Redis caching for session management
- Efficient database queries with proper indexing
- Frontend code splitting and lazy loading
- Optimized bundle sizes with Vite
- Real-time updates using WebSocket connections

## Development Guidelines

### Code Style

- Follow ESLint configuration
- Use consistent naming conventions
- Implement proper error handling
- Write meaningful commit messages

### Testing

- Unit tests for backend services
- Integration tests for API endpoints
- Frontend component testing
- End-to-end testing for critical flows

## Deployment

### Production Build

```bash
# Frontend build
cd frontend
npm run build

# Backend setup
cd backend
npm install --production
```

### Environment Variables

Ensure all production environment variables are properly configured:

- Database connection strings
- API keys and secrets
- CORS origins
- Logging configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support or questions:

- Create an issue in the repository
- Contact the development team
- Review the documentation

---

**Developed by Yash Kumar Singh**  
_MCA Final Year Project - BIT Mesra_
