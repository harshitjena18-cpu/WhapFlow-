import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen bg-gray-50">
        <div className="p-8 lg:p-12 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
