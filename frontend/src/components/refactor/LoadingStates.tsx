/**
 * Loading States Components
 * Skeleton screens and loading indicators
 */

import { motion } from 'framer-motion';

/**
 * Skeleton Card
 * Placeholder while card content loads
 */
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="w-full h-48 bg-slate-700/50 rounded-lg animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-700/50 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton Grid
 * Multiple skeleton cards
 */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

/**
 * Skeleton Detail
 * Placeholder for product detail view
 */
export function SkeletonDetail() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-4">
        <div className="w-full aspect-square bg-slate-700/50 rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="w-16 h-16 bg-slate-700/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 bg-slate-700/50 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-700/50 rounded animate-pulse w-1/2" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-3 bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Spinner
 * Animated loading indicator
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorStyles = {
    primary: 'text-blue-500',
    white: 'text-white',
  };

  return (
    <svg
      className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Loading Overlay
 * Full-screen loading indicator
 */
export function LoadingOverlay({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 space-y-4 text-center">
        <Spinner size="lg" />
        <p className="text-slate-100 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Pulse
 * Generic pulse animation
 */
export function Pulse({
  className = '',
}: {
  className?: string;
}) {
  return <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />;
}

/**
 * Dots Loader
 * Animated dots pattern
 */
export function DotsLoader() {
  return (
    <div className="flex gap-2 items-center justify-center">
      {[0, 1, 2].map((idx) => (
        <motion.div
          key={idx}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: idx * 0.2,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Progress Bar
 */
export function ProgressBar({
  progress = 0,
  showPercentage = true,
}: {
  progress?: number;
  showPercentage?: boolean;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="space-y-2">
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-slate-400 text-right">{clampedProgress}%</p>
      )}
    </div>
  );
}
