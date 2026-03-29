import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import StatsCard from './components/StatsCard';
import ActivityTable from './components/ActivityTable';
import UsageChart from './components/UsageChart';
import { currentUser, tenant, statsCards } from './data/mockData';
import { Building2 } from 'lucide-react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default function App() {
  const isMobile = !useMediaQuery('(min-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Collapse sidebar when switching to mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const mainMarginLeft = isMobile ? '0' : sidebarOpen ? '256px' : '80px';

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

      {/* Main container */}
      <div
        className="min-h-screen sidebar-transition"
        style={{ marginLeft: mainMarginLeft }}
      >
        <Navbar
          onMenuToggle={toggleSidebar}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Building2 className="w-4 h-4 text-surface-400" />
              <span className="text-sm text-surface-500 dark:text-surface-400">
                {tenant.name}
              </span>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md">
                {tenant.plan}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {statsCards.map((card) => (
              <StatsCard key={card.id} {...card} />
            ))}
          </div>

          {/* Chart + Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-5">
            <div className="xl:col-span-2">
              <UsageChart />
            </div>
            <div className="xl:col-span-3">
              <ActivityTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
