import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TooltipProvider } from './ui/tooltip';

export function DashboardLayout() {
  return (
    <TooltipProvider>
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
    </TooltipProvider>
  );
}