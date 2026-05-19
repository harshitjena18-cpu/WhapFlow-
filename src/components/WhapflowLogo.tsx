import { cn } from './ui/utils';

interface WhapflowLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'w-6 h-6',
    text: 'text-base',
    gap: 'gap-2',
  },
  md: {
    icon: 'w-8 h-8',
    text: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'w-10 h-10',
    text: 'text-2xl',
    gap: 'gap-3',
  },
};

export function WhapflowLogo({ 
  size = 'md', 
  variant = 'full', 
  className 
}: WhapflowLogoProps) {
  const config = sizeConfig[size];

  return (
    <div 
      className={cn(
        'group inline-flex items-center',
        variant === 'full' && config.gap,
        className
      )}
    >
      {/* Custom SVG Icon */}
      <svg
        className={cn(config.icon, "transition-transform duration-200 group-hover:scale-110")}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Whapflow Logo"
      >
        {/* Shopping cart basket */}
        <path
          d="M6 8L8 8L10.5 20C10.5 20.8284 11.1716 21.5 12 21.5H24C24.8284 21.5 25.5 20.8284 25.5 20L27 12H10"
          stroke="#25D366"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Cart wheels/dots */}
        <circle
          cx="13"
          cy="25"
          r="1.5"
          fill="#25D366"
        />
        <circle
          cx="23"
          cy="25"
          r="1.5"
          fill="#25D366"
        />
        
        {/* Recovery flow arrow - curved path from top right flowing back */}
        <path
          d="M26 6C26 6 24 3 20 3C18 3 17 4 17 4"
          stroke="#25D366"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Arrow head */}
        <path
          d="M20 3L17 4L18 7"
          stroke="#25D366"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark with split color */}
      {variant === 'full' && (
        <span className={cn('font-semibold tracking-tight', config.text)}>
          <span className="text-[#25D366]">Whap</span>
          <span className="text-gray-900">flow</span>
        </span>
      )}
    </div>
  );
}
