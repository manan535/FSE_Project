# ScaleNest: Modern Multi-Tenant 

A complete, production-ready multi-tenant ScaleNest built with the MERN stack (MongoDB, Express, React, Node.js) featuring authentication, workspace management, and a modern dashboard.

## 🚀 Features

### Authentication & Security
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Multi-tenant data isolation

### Multi-Tenant Architecture
- Create and manage multiple workspaces
- Invite team members via invite codes
- Role-based access control (Admin, Member, Viewer)
- Seamless workspace switching

### Project & Task Management
- Create and organize projects
- Kanban-style task management
- Priority levels and status tracking
- Team collaboration features

### Analytics & Insights
- Interactive charts and visualizations
- Team performance metrics
- Progress tracking
- Activity monitoring

### Modern UI/UX
- Beautiful landing page with pricing tiers
- Responsive design (mobile, tablet, desktop)
- Smooth animations with Framer Motion
- Tailwind CSS styling
- Collapsible sidebar navigation

## 🛠 Tech Stack

### Frontend
- **React** 18.2 - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd saas-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - MONGODB_URI: Your MongoDB *** string
# - JWT_SECRET: A strong random secret key
# - PORT: Backend server port (default: 5000)
```

**Example .env configuration:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas-platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# For macOS (with Homebrew)
brew services start mongodb-community

# For Linux
sudo systemctl start mongod

# For Windows
# MongoDB should start automatically, or use MongoDB Compass
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
saas-platform/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB ***
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── workspaceController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── tenant.js            # Multi-tenant isolation
│   ├── models/
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Membership.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workspaceRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── WorkspaceContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Overview.jsx
│   │   │   │   ├── Projects.jsx
│   │   │   │   ├── Tasks.jsx
│   │   │   │   ├── Team.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── Settings.jsx
│   │   │   │   └── Billing.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── WorkspaceSetup.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/my` - Get user's workspaces
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/switch` - Switch active workspace
- `POST /api/workspaces/join` - Join workspace with invite code
- `PUT /api/workspaces/:id` - Update workspace
- `GET /api/workspaces/:id/members` - Get workspace members
- `DELETE /api/workspaces/members/:id` - Remove member

### Projects (Requires workspace context)
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks (Requires workspace context)
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🎨 Application Flow

1. **Landing Page** → User sees features, pricing, and testimonials
2. **Registration/Login** → User creates account or logs in
3. **Workspace Setup** → User creates or joins a workspace
4. **Dashboard** → User accesses their workspace dashboard
5. **Project Management** → Create and manage projects
6. **Task Management** → Organize tasks across projects
7. **Team Collaboration** → Invite members and assign work
8. **Analytics** → Track progress and performance

## 🔐 Multi-Tenant Architecture

The platform implements true multi-tenancy with:

- **Data Isolation**: Each workspace's data is completely separated
- **Workspace Context**: All API requests include workspace ID
- **Membership Roles**: Fine-grained access control
- **Invite System**: Secure workspace joining via invite codes

## 🎯 Usage Examples

### Creating a Workspace
```javascript
POST /api/workspaces
{
  "name": "My Company"
}
```

### Adding a Task
```javascript
POST /api/tasks
Headers: { "x-workspace-id": "workspace_id" }
{
  "title": "Implement authentication",
  "description": "Add JWT authentication",
  "priority": "high",
  "status": "todo"
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas-platform
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify MongoDB is accessible on the specified port

### CORS Errors
- Backend CORS is configured to allow all origins in development
- For production, update CORS settings in server.js

### Port Already in Use
- Change PORT in backend .env
- Change port in frontend vite.config.js

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React community for amazing tools
- MongoDB for flexible database
- Tailwind CSS for beautiful styling
- Framer Motion for smooth animations

## 📧 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ using the MERN stack
