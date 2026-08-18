import { Bell, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [modifierKey, setModifierKey] = useState('⌘');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect platform for keyboard shortcut hint
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
    setModifierKey(isMac ? '⌘' : 'Ctrl');

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-10 glassmorphism-header px-8 py-4 flex items-center justify-between lg:ml-72 ${isScrolled ? 'scrolled' : ''}`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <label htmlFor="global-search" className="sr-only">Search orders, customers, or templates</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="global-search"
            ref={searchInputRef}
            type="text"
            placeholder="Search orders, customers, or templates..."
            className="w-full pl-10 pr-12 py-2 text-sm bg-white/60 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:bg-white focus:border-purple-300/50 transition-all backdrop-blur-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100/50 border border-gray-200/50 rounded flex items-center gap-0.5">
              <span className={modifierKey === '⌘' ? "text-xs" : "text-[9px]"}>{modifierKey}</span>K
            </kbd>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-all duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="h-8 w-px bg-gray-200/50 mx-1 hidden md:block"></div>
        <Link
          to="/settings"
          aria-label="User Profile and Settings"
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/50 transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Whapflow Store</p>
            <p className="text-xs text-gray-500">Shopify Connected</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200/50">
            WS
          </div>
        </Link>
      </div>
    </header>
  );
}