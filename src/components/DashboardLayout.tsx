import { Outlet } from 'react-router';
import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  return (
    <div className="min-h-screen premium-gradient-bg grain-texture font-sans relative">
      <Sidebar />
      <Header />
      
      {/* Main Content Area */}
      <main className="lg:ml-72">
        <div className="p-8 lg:p-12 max-w-[1400px]">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}