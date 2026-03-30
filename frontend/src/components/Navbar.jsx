import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { currentUser, tenant } from '../data/mockData';

export default function Navbar({ onMenuToggle, darkMode, onToggleDarkMode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-4 sm:px-6 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
      {/* Left: menu + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          id="mobile-menu-toggle"
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl
            text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800
            hover:text-surface-700 dark:hover:text-surface-200 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm
              bg-surface-100 dark:bg-surface-800
              text-surface-900 dark:text-surface-100
              placeholder:text-surface-400 dark:placeholder:text-surface-500
              border border-transparent
              focus:border-primary-300 dark:focus:border-primary-600
              focus:bg-white dark:focus:bg-surface-900
              focus:ring-2 focus:ring-primary-500/20
              outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          id="dark-mode-toggle"
          onClick={onToggleDarkMode}
          className="flex items-center justify-center w-9 h-9 rounded-xl
            text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800
            hover:text-surface-700 dark:hover:text-surface-200 transition-colors cursor-pointer"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button
          id="notifications-button"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl
            text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800
            hover:text-surface-700 dark:hover:text-surface-200 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-white dark:ring-surface-900" />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="profile-dropdown-toggle"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
              hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-surface-900 dark:text-white leading-tight">
                {currentUser.name}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 leading-tight">
                {tenant.name}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-surface-400 transition-transform duration-200 hidden sm:block ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 py-1.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-xl shadow-surface-900/10 dark:shadow-black/30 z-50">
              <div className="px-4 py-2.5 border-b border-surface-100 dark:border-surface-700">
                <p className="text-sm font-semibold text-surface-900 dark:text-white">
                  {currentUser.name}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {currentUser.email}
                </p>
              </div>
              <button
                id="dropdown-profile"
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <div className="my-1 border-t border-surface-100 dark:border-surface-700" />
              <button
                id="dropdown-logout"
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
