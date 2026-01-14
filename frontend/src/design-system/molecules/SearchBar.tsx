/**
 * SearchBar Component
 * Smart search input with synthesizer aesthetic
 * Features: Command-palette feel, glow on focus, monospace input,
 * image upload capability, and search icon
 */

import React, { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  imagePreview?: string | null;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  placeholder = 'Search brands, gear, or categories...',
  imagePreview = null,
  isLoading = false,
  disabled = false,
  icon,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="relative group">
      {/* Glow border background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 group-focus-within:opacity-75 transition duration-500" />

      {/* Main search container */}
      <div className="relative bg-bg-surface/95 backdrop-blur-xl border border-white/10 group-focus-within:border-accent-primary/50 rounded-2xl overflow-hidden shadow-2xl flex items-center transition-all duration-300">
        {/* Search Icon - Left */}
        <div className="px-4 text-text-muted group-focus-within:text-text-primary transition-colors">
          {icon || (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* Input Field */}
        <input
          type="text"
          className="flex-1 bg-transparent p-4 text-base text-text-primary placeholder-text-dimmed outline-none font-light"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
        />

        {/* Image Preview / Upload Button */}
        {onFileSelect && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            disabled={disabled || isLoading}
            title="Search with Image"
          >
            {imagePreview ? (
              <div className="w-8 h-8 rounded-md overflow-hidden border border-accent-primary">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Submit Button - Right */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={disabled || isLoading}
            className="px-4 py-2 m-2 bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 disabled:opacity-50 rounded-xl text-black font-semibold transition-all active:scale-95"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
                <path
                  d="M4 12a8 8 0 018-8v0a8 8 0 018 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SEARCH FILTER - Optional filter chips below search bar
// ============================================================================

interface SearchFilterProps {
  filters: Array<{ id: string; label: string }>;
  activeFilters: string[];
  onFilterChange: (filterId: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  activeFilters,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider
            transition-all duration-200
            ${
              activeFilters.includes(filter.id)
                ? 'bg-accent-primary/20 border border-accent-primary/50 text-accent-primary'
                : 'bg-bg-surface/30 border border-white/10 text-text-muted hover:text-text-primary'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default SearchBar;
