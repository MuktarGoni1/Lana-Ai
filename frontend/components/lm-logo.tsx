import React from 'react';
import { cn } from '@/lib/utils';

interface LMLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-10 h-10', text: 'text-xl', subText: 'text-[8px]' },
  md: { container: 'w-16 h-16', text: 'text-3xl', subText: 'text-xs' },
  lg: { container: 'w-24 h-24', text: 'text-5xl', subText: 'text-sm' },
  xl: { container: 'w-32 h-32', text: 'text-7xl', subText: 'text-base' },
};

const variantMap = {
  default: {
    bg: 'bg-[#FACC15]',
    text: 'text-slate-900',
    subText: 'text-slate-700',
    shadow: 'shadow-lg shadow-yellow-500/30',
  },
  white: {
    bg: 'bg-white',
    text: 'text-slate-900',
    subText: 'text-slate-600',
    shadow: 'shadow-lg shadow-white/30',
  },
  dark: {
    bg: 'bg-slate-900',
    text: 'text-[#FACC15]',
    subText: 'text-slate-400',
    shadow: 'shadow-lg shadow-black/30',
  },
};

export function LMLogo({ 
  size = 'md', 
  variant = 'default', 
  showText = false,
  className 
}: LMLogoProps) {
  const sizes = sizeMap[size];
  const colors = variantMap[variant];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* LM Logo Mark */}
      <div
        className={cn(
          'flex items-center justify-center font-black tracking-tighter rounded-2xl',
          sizes.container,
          colors.bg,
          colors.text,
          colors.shadow,
          'border-2 border-white/20'
        )}
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <span className={cn('leading-none', sizes.text)}>LM</span>
      </div>
      
      {/* Optional Text */}
      {showText && (
        <div className={cn('mt-2 font-bold tracking-wide', colors.subText, sizes.subText)}>
          LanaMind
        </div>
      )}
    </div>
  );
}

// Simple inline version for OG images and static use
export function LMLogoSimple({ 
  className,
  color = '#FACC15'
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <div 
      className={cn(
        'inline-flex items-center justify-center font-black tracking-tighter',
        className
      )}
      style={{ 
        color,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}
    >
      LM
    </div>
  );
}

// Navigation logo - compact version
export function LMLogoNav({ className }: { className?: string }) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center w-10 h-10 bg-[#FACC15] rounded-xl font-black text-slate-900 text-lg tracking-tighter',
        'shadow-md hover:shadow-lg transition-shadow',
        className
      )}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      LM
    </div>
  );
}

export default LMLogo;
