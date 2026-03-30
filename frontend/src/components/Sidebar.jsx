import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

const icons = { LayoutDashboard, Users, CreditCard, Settings };

const navItems = [
  { label: 'Dashboard', icon: 'LayoutDashboard', active: true },
  { label: 'Users', icon: 'Users', active: false },
  { label: 'Billing', icon: 'CreditCard', active: false },
  { label: 'Settings', icon: 'Settings', active: false },
];

export default function Sidebar({ isOpen, onToggle, isMobile }) {
  const [activeItem, setActiveItem] = useState('Dashboard');

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800
          sidebar-transition
          ${isMobile
            ? `w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isOpen ? 'w-64' : 'w-20'}`
          }
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-200 dark:border-surface-800 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span
            className={`font-bold text-lg text-surface-900 dark:text-white tracking-tight transition-opacity duration-200 ${
              !isMobile && !isOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            SaaSHub
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const isActive = activeItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveItem(item.label)}
                className={`
                  group flex items-center gap-3 w-full rounded-xl px-3 py-2.5
                  text-sm font-medium transition-all duration-150 cursor-pointer
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white'
                  }
                `}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'
                  }`}
                />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    !isMobile && !isOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <div className="p-3 border-t border-surface-200 dark:border-surface-800 shrink-0">
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-full h-9 rounded-xl
                text-surface-400 dark:text-surface-500
                hover:bg-surface-100 dark:hover:bg-surface-800
                hover:text-surface-600 dark:hover:text-surface-300
                transition-colors cursor-pointer"
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
