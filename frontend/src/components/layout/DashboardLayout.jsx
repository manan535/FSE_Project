import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { TenantProvider } from '../../context/TenantContext';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TenantProvider>
      <div className="min-h-screen bg-[#0a0e1a]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        
        <div
          className="transition-all duration-300"
          style={{ marginLeft: collapsed ? '80px' : '256px' }}
        >
          <Navbar />
          
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TenantProvider>
  );
};

export default DashboardLayout;