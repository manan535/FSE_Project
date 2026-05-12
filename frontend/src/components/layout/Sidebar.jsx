import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaHome, FaProjectDiagram, FaTasks, FaUsers, FaChartBar,
  FaCog, FaCreditCard, FaChevronLeft, FaChevronRight, FaPalette, FaHistory
} from 'react-icons/fa';
import { useTenant } from '../../context/TenantContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { tenantName, logo, themeColor } = useTenant();

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/dashboard/projects', icon: FaProjectDiagram, label: 'Projects' },
    { path: '/dashboard/tasks', icon: FaTasks, label: 'Tasks' },
    { path: '/dashboard/team', icon: FaUsers, label: 'Team' },
    { path: '/dashboard/analytics', icon: FaChartBar, label: 'Analytics' },
    { path: '/dashboard/activity', icon: FaHistory, label: 'Activity' },
    { path: '/dashboard/branding', icon: FaPalette, label: 'Branding' },
    { path: '/dashboard/settings', icon: FaCog, label: 'Settings' },
    { path: '/dashboard/billing', icon: FaCreditCard, label: 'Billing' }
  ];

  const color = themeColor || '#7c3aed';
  const logoUrl = logo ? (logo.startsWith('http') ? logo : `http://localhost:5000${logo}`) : '';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      className="bg-[#0b1120] text-white h-screen fixed left-0 top-0 z-40 flex flex-col border-r border-gray-800/60"
    >
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 min-w-0"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {(tenantName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate leading-tight">
                {tenantName || 'ScaleNest'}
              </h1>
            </div>
          </motion.div>
        )}
        {collapsed && logoUrl && (
          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover mx-auto" />
        )}
        {collapsed && !logoUrl && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto"
            style={{ backgroundColor: color }}
          >
            {(tenantName || 'S').charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                style={({ isActive }) => isActive ? { backgroundColor: color } : {}}
              >
                <item.icon className="text-xl flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <p className="text-sm font-medium mb-2">Need help?</p>
            <p className="text-xs text-gray-400 mb-3">Check our documentation</p>
            <button
              className="w-full text-white text-sm py-2 rounded-lg transition-colors"
              style={{ backgroundColor: color }}
            >
              View Docs
            </button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;