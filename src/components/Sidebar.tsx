import { NavLink, Link } from 'react-router';
import { 
  LayoutDashboard, 
  Zap, 
  FileText, 
  BarChart3, 
  CreditCard, 
  Settings,
  MessageCircle,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { WhapflowLogo } from './WhapflowLogo';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Automations', path: '/automations', icon: Zap },
  { name: 'Templates', path: '/templates', icon: FileText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Billing', path: '/billing', icon: CreditCard },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const getInitials = (email?: string, name?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(user?.email, user?.user_metadata?.full_name);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-6 right-6 z-50 p-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-40
          transition-transform duration-300 ease-in-out
          w-72
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-8 py-8 border-b border-gray-100">
          <Link to="/" className="group">
            <WhapflowLogo size="md" variant="full" className="hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-8 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#25D366] text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-6 border-t border-gray-100">
          {loading ? (
             <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
             </div>
          ) : (
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] group"
              aria-label="View profile settings"
            >
              <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0 group-hover:shadow-sm transition-all">
                <span className="text-white font-semibold text-xs">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#25D366] transition-colors">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}