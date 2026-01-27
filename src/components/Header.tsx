import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between lg:ml-72">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, customers, or templates..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#25D366]/20 focus:bg-white transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-gray-100 mx-1 hidden md:block"></div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Whapflow Store</p>
            <p className="text-xs text-gray-500">Shopify Connected</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
            WS
          </div>
        </div>
      </div>
    </header>
  );
}
