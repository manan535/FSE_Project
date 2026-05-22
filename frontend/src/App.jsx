import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceSetup from './pages/WorkspaceSetup';

import Overview from './pages/dashboard/Overview';
import Projects from './pages/dashboard/Projects';
import ProjectBoard from './pages/dashboard/ProjectBoard';
import Tasks from './pages/dashboard/Tasks';
import Team from './pages/dashboard/Team';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';
import Billing from './pages/dashboard/Billing';
import AuditLogs from './pages/dashboard/AuditLogs';
import TenantSettings from './pages/dashboard/TenantSettings';
import Chat from './pages/dashboard/Chat';
import InviteAccept from './pages/InviteAccept';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <SocketProvider>
              {/* Global toast container */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#f9fafb',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  },
                  success: {
                    iconTheme: { primary: '#10b981', secondary: '#f9fafb' },
                  },
                  error: {
                    iconTheme: { primary: '#ef4444', secondary: '#f9fafb' },
                  },
                }}
              />

              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/workspace-setup"
                  element={
                    <ProtectedRoute>
                      <WorkspaceSetup />
                    </ProtectedRoute>
                  }
                />

                {/* Public invite accept page */}
                <Route path="/invite/:token" element={<InviteAccept />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Overview />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectBoard />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="team" element={<Team />} />
                  <Route path="chats" element={<Chat />} />
                  <Route path="chats/:chatId" element={<Chat />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="activity" element={<AuditLogs />} />
                  <Route path="branding" element={<TenantSettings />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SocketProvider>
          </NotificationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;