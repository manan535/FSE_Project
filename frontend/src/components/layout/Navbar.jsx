import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTenant } from '../../context/TenantContext';
import { FaChevronDown, FaBuilding, FaCheck, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const { logo, themeColor } = useTenant();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const color = themeColor || '#7c3aed';
  const logoUrl = logo ? (logo.startsWith('http') ? logo : `http://localhost:5000${logo}`) : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
  <div className="relative flex-1 max-w-md">
    
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 hover:border-gray-600 transition-all duration-300">
      <h2 className="text-lg font-semibold text-white">
        Welcome back, {user?.name || "User"} 👋
      </h2>
      <p className="text-sm text-gray-400">
        Let's build something amazing today 🚀
      </p>
    </div>

    {/* subtle accent line */}
    <div className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full" style={{ backgroundColor: color }}></div>
  </div>
</div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-700/50"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded-md object-cover" />
            ) : (
              <FaBuilding className="text-gray-400" />
            )}
            <span className="font-medium text-gray-200">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
            <FaChevronDown className="text-gray-500 text-sm" />
          </button>

          <AnimatePresence>
            {showWorkspaceMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-800/60 py-2"
              >
                <div className="px-4 py-2 border-b border-gray-800/60">
                  <p className="text-sm text-gray-500">Switch Workspace</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace._id}
                      onClick={() => {
                        switchWorkspace(workspace._id);
                        setShowWorkspaceMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-800/50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {workspace.logo ? (
                          <img src={workspace.logo.startsWith('http') ? workspace.logo : `http://localhost:5000${workspace.logo}`} alt="" className="w-6 h-6 rounded-md object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: workspace.themeColor || color }}>
                            {(workspace.name || 'W').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-200">{workspace.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{workspace.role}</p>
                        </div>
                      </div>
                      {currentWorkspace?._id === workspace._id && (
                        <FaCheck style={{ color }} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-800/60 mt-2">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      navigate('/workspace-setup');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-800/50 flex items-center gap-2 transition-colors"
                    style={{ color }}
                  >
                    <FaPlus />
                    <span className="font-medium">Create or Join Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell with Dropdown Panel */}
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: color }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-800/60 py-2"
              >
                <div className="px-4 py-3 border-b border-gray-800/60">
                  <p className="font-medium text-white">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/dashboard/settings');
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-800/50 text-gray-300 transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-800/50 text-red-400 transition-colors"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;