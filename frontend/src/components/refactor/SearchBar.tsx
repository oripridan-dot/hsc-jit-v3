/**
 * SearchBar Component
 * Dedicated search component with keyboard shortcuts
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from './Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search 333+ products...',
  autoFocus = false,
  disabled = false,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(autoFocus);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: CMD+K or CTRL+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Clear on ESC
      if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        rightIcon={
          value && (
            <button
              onClick={() => onChange('')}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )
        }
      />

      {/* Keyboard Hint */}
      {!isFocused && !value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-slate-500 font-medium">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">⌘ K</kbd>
        </div>
      )}
    </div>
  );
}
