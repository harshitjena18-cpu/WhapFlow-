import { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Send, 
  BarChart3, 
  Settings, 
  Bell, 
  MessageCircle,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Package,
  Menu as _Menu,
  X as _X
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
// deno-lint-ignore no-unused-vars
import logo from 'figma:asset/9ad57f78ffcb8b81f228eb1f033e9199d9c738a7.png';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
};

type AbandonedCart = {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  cartValue: number;
  status: 'pending' | 'sent' | 'recovered';
  time: string;
};

export function Dashboard() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, active: activeNav === 'Overview' },
    { name: 'Live Carts', href: '/dashboard/carts', icon: <ShoppingCart className="w-5 h-5" />, active: activeNav === 'Live Carts' },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: <Send className="w-5 h-5" />, active: activeNav === 'Campaigns' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" />, active: activeNav === 'Analytics' },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, active: activeNav === 'Settings' },
  ];

  const abandonedCarts: AbandonedCart[] = [
    {
      id: '1',
      customer: { name: 'Sarah Johnson', email: 'sarah.j@email.com' },
      cartValue: 127.50,
      status: 'sent',
      time: '15 minutes ago',
    },
    {
      id: '2',
      customer: { name: 'Michael Chen', email: 'mchen@email.com' },
      cartValue: 89.99,
      status: 'pending',
      time: '32 minutes ago',
    },
    {
      id: '3',
      customer: { name: 'Emma Williams', email: 'emma.w@email.com' },
      cartValue: 215.00,
      status: 'recovered',
      time: '1 hour ago',
    },
    {
      id: '4',
      customer: { name: 'David Brown', email: 'd.brown@email.com' },
      cartValue: 64.50,
      status: 'sent',
      time: '2 hours ago',
    },
    {
      id: '5',
      customer: { name: 'Lisa Anderson', email: 'lisa.a@email.com' },
      cartValue: 178.25,
      status: 'pending',
      time: '3 hours ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Sidebar - Auto-hide */}
      <aside 
        className={`${
          sidebarExpanded ? 'w-72' : 'w-20'
        } bg-white border-r border-gray-100 fixed h-full flex flex-col shadow-sm transition-all duration-300 ease-in-out z-30 group hover:w-72`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group/logo overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#20BD5A] rounded-xl flex items-center justify-center shadow-sm group-hover/logo:shadow-md transition-all duration-300 flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-semibold text-gray-900 whitespace-nowrap transition-opacity duration-300 ${
              sidebarExpanded || 'opacity-0 w-0'
            }`}>
              Whapflow
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-hidden">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => setActiveNav(item.name)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    item.active
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-[#25D366] shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={item.name}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${
                    sidebarExpanded || 'opacity-0 w-0'
                  }`}>
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <Link
            to="/settings"
            aria-label="User Profile and Settings"
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 overflow-hidden active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/20"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#20BD5A] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-semibold text-sm">JD</span>
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-300 ${
              sidebarExpanded || 'opacity-0 w-0'
            }`}>
              <p className="text-sm font-semibold text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@store.com</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-72' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back! Here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" aria-label="Notifications" className="relative rounded-xl border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title="Total Recovered Revenue"
              value="$12,487"
              change="+18.2%"
              trend="up"
              icon={<DollarSign className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-green-100 to-emerald-100"
              iconColor="text-green-600"
            />
            <MetricCard
              title="Recovery Rate"
              value="28.4%"
              change="+4.3%"
              trend="up"
              icon={<TrendingUp className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-blue-100 to-sky-100"
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Active Carts"
              value="47"
              change="-8"
              trend="down"
              icon={<Package className="w-6 h-6" />}
              iconBg="bg-gradient-to-br from-purple-100 to-violet-100"
              iconColor="text-purple-600"
            />
          </div>

          {/* Recent Abandoned Carts Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Abandoned Carts</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Monitor and manage your abandoned cart recovery campaigns
                </p>
              </div>
              <Button className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group">
                View All
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-gray-700 font-semibold">Customer</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Cart Value</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abandonedCarts.map((cart) => (
                    <TableRow key={cart.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                      <TableCell className="py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{cart.customer.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{cart.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        ${cart.cartValue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cart.status === 'recovered'
                              ? 'default'
                              : cart.status === 'sent'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={`rounded-lg px-3 py-1 ${
                            cart.status === 'recovered'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-100 hover:to-emerald-100 border-green-200'
                              : cart.status === 'sent'
                              ? 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 hover:from-blue-100 hover:to-sky-100 border-blue-200'
                              : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 hover:from-yellow-100 hover:to-amber-100 border-yellow-200'
                          }`}
                        >
                          {cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{cart.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ title, value, change, trend, icon, iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
          trend === 'up' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
}
