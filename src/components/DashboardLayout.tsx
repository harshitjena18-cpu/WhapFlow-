import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from './ui/sonner';

export function DashboardLayout() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen premium-gradient-bg grain-texture font-sans relative">
        <Sidebar />
        <Header />

        {/* Main Content Area */}
        <main className="lg:ml-72">
          <div className="p-8 lg:p-12 max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
