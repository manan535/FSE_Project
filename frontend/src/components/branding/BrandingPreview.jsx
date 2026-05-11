/**
 * BrandingPreview — Live preview of workspace branding
 *
 * Shows a miniature mockup of how the sidebar, navbar, and buttons
 * will look with the selected branding (logo, name, tagline, theme color).
 */

import { motion } from 'framer-motion';
import {
  FaHome,
  FaProjectDiagram,
  FaTasks,
  FaUsers,
  FaChartBar,
  FaCog,
  FaBell
} from 'react-icons/fa';

// ─── Auto-generated initials avatar ───────────────────────────────────────────
const InitialsAvatar = ({ name, color, size = 'lg' }) => {
  const initials = (name || 'W')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center font-bold text-white shadow-lg`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

const BrandingPreview = ({ name, tagline, themeColor, logo }) => {
  const displayName = name || 'Your Workspace';
  const displayTagline = tagline || 'Your tagline here';
  const color = themeColor || '#7c3aed';

  const logoUrl = logo
    ? (logo.startsWith('http') ? logo : `http://localhost:5000${logo}`)
    : '';

  const sidebarItems = [
    { icon: FaHome, label: 'Dashboard', active: true },
    { icon: FaProjectDiagram, label: 'Projects', active: false },
    { icon: FaTasks, label: 'Tasks', active: false },
    { icon: FaUsers, label: 'Team', active: false },
    { icon: FaChartBar, label: 'Analytics', active: false },
    { icon: FaCog, label: 'Settings', active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Live Preview
      </p>

      {/* Preview Container — mimics dashboard layout */}
      <div className="rounded-2xl border border-gray-700/50 bg-gray-900/80 overflow-hidden shadow-2xl">
        {/* ─── Mini Sidebar + Content ─────────────────────────────── */}
        <div className="flex h-[340px]">
          {/* Sidebar mock */}
          <div className="w-[140px] bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
            {/* Logo / Name */}
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <InitialsAvatar name={displayName} color={color} size="sm" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white truncate leading-tight">
                    {displayName.length > 12 ? displayName.slice(0, 12) + '…' : displayName}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-2 space-y-0.5 overflow-hidden">
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] transition-colors"
                  style={{
                    backgroundColor: item.active ? color : 'transparent',
                    color: item.active ? '#fff' : '#9ca3af'
                  }}
                >
                  <item.icon className="text-[10px] flex-shrink-0" />
                  <span className="truncate font-medium">{item.label}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Navbar mock */}
            <div className="h-10 bg-gray-850 border-b border-gray-800 px-3 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#111827' }}>
              <p className="text-[10px] text-gray-400 font-medium">
                Welcome back 👋
              </p>
              <div className="flex items-center gap-2">
                <FaBell className="text-[10px] text-gray-500" />
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ backgroundColor: color }}
                >
                  U
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 p-3 space-y-3 overflow-hidden" style={{ backgroundColor: '#0f1629' }}>
              {/* Header with branding */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <InitialsAvatar name={displayName} color={color} size="sm" />
                  )}
                  <p className="text-xs font-bold text-white truncate">
                    {displayName}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 italic truncate pl-7">
                  "{displayTagline}"
                </p>
              </div>

              {/* Stat cards mock */}
              <div className="grid grid-cols-3 gap-1.5">
                {['Projects', 'Tasks', 'Team'].map((label, i) => (
                  <div key={label} className="bg-gray-800/60 rounded-lg p-2">
                    <div
                      className="w-4 h-4 rounded-md mb-1 flex items-center justify-center"
                      style={{ backgroundColor: `${color}30` }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                    </div>
                    <p className="text-[8px] text-gray-500">{label}</p>
                    <p className="text-xs font-bold text-white">{[12, 48, 8][i]}</p>
                  </div>
                ))}
              </div>

              {/* Button samples */}
              <div className="space-y-1.5">
                <button
                  className="w-full py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all"
                  style={{ backgroundColor: color }}
                >
                  Primary Button
                </button>
                <button
                  className="w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all border"
                  style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrandingPreview;
