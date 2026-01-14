/**
 * BrandCard Component
 * Glassmorphic "Instrument Module" card for brand exploration
 * Features: Dark translucent background, logo grayscale→color on hover,
 * status indicator, and glow effect on active state
 */

import React, { useState } from 'react';

interface BrandCardProps {
  name: string;
  logo_url?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'syncing';
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
}

const statusConfig = {
  active: { dot: 'bg-emerald-500', pulse: 'animate-pulse', label: 'Active' },
  inactive: { dot: 'bg-zinc-700', pulse: '', label: 'Inactive' },
  syncing: { dot: 'bg-amber-500', pulse: 'animate-pulse', label: 'Syncing' },
};

export const BrandCard: React.FC<BrandCardProps> = ({
  name,
  logo_url,
  category,
  status = 'active',
  onClick,
  onHover,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHover?.(false);
  };

  const statusInfo = statusConfig[status];

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative w-full aspect-square
        bg-bg-card/40 backdrop-blur-md
        border border-white/5
        rounded-xl
        transition-all duration-300 ease-out
        group
        overflow-hidden
        ${isHovering 
          ? 'border-accent-primary/50 scale-105' 
          : 'border-white/5'
        }
      `}
      style={{
        boxShadow: isHovering 
          ? '0 0 20px -5px rgb(245, 158, 11)' 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Status Indicator - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div
          className={`
            w-2 h-2 rounded-full
            ${statusInfo.dot}
            ${statusInfo.pulse}
            transition-colors duration-300
          `}
        />
      </div>

      {/* Category Badge - Top Left Corner (Optional) */}
      {category && (
        <div className="absolute top-4 left-4 z-20">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted px-2 py-1 rounded border border-white/10 bg-bg-surface/50 backdrop-blur-sm">
            {category}
          </span>
        </div>
      )}

      {/* Logo Container - Center of card */}
      <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-b from-white/[0.02] to-transparent">
        {logo_url ? (
          <img
            src={logo_url}
            alt={name}
            className={`
              max-w-[80%] max-h-[80%] object-contain
              transition-all duration-300 ease-out
              ${isHovering 
                ? 'grayscale-0 opacity-100 drop-shadow-2xl' 
                : 'grayscale opacity-70 drop-shadow-lg'
              }
            `}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-lg font-bold">
              ?
            </div>
            <span className="text-xs font-medium text-center">{name}</span>
          </div>
        )}
      </div>

      {/* Bottom Label - Fade in on hover */}
      <div
        className={`
          absolute bottom-0 left-0 right-0
          px-4 py-3
          bg-gradient-to-t from-bg-surface/80 to-transparent
          transition-opacity duration-300
          ${isHovering ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <p className="text-text-primary font-semibold text-sm line-clamp-1">
          {name}
        </p>
        {status !== 'inactive' && (
          <p className="text-text-muted text-xs font-mono mt-1">
            {statusInfo.label}
          </p>
        )}
      </div>
    </button>
  );
};

export default BrandCard;
