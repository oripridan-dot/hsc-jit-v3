/**
 * Input Components
 * Form inputs with consistent styling
 */

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { HelperText } from './Typography';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Standard Input
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-text-tertiary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={`w-full px-3 py-2 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} bg-bg-elevated border-2 rounded-lg text-text-primary placeholder-text-tertiary transition-all focus:outline-none ${
              error
                ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
                : 'border-border hover:border-border-hover focus:border-border-focus focus:ring-2 focus:ring-primary/20'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <HelperText variant="error">{error}</HelperText>}
        {!error && helperText && <HelperText variant="normal">{helperText}</HelperText>}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea
 */
interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={`w-full px-3 py-2 bg-bg-elevated border-2 rounded-lg text-text-primary placeholder-text-tertiary transition-all focus:outline-none resize-none ${
            error
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
              : 'border-border hover:border-border-hover focus:border-border-focus focus:ring-2 focus:ring-primary/20'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {error && <HelperText variant="error">{error}</HelperText>}
        {!error && helperText && <HelperText variant="normal">{helperText}</HelperText>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Checkbox
 */
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, className = '', id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={`w-4 h-4 bg-bg-elevated border-2 border-border rounded transition-all focus:ring-2 focus:ring-primary/20 cursor-pointer ${className}`}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-text-primary cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {helperText && <HelperText>{helperText}</HelperText>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

/**
 * Radio Button
 */
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="radio"
          id={id}
          className={`w-4 h-4 bg-bg-elevated border-2 border-border rounded-full transition-all focus:ring-2 focus:ring-primary/20 cursor-pointer accent-primary ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * Select
 */
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-text-primary">
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 bg-bg-elevated border-2 rounded-lg text-text-primary transition-all focus:outline-none appearance-none ${
            error
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
              : 'border-border hover:border-border-hover focus:border-border-focus focus:ring-2 focus:ring-primary/20'
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <HelperText variant="error">{error}</HelperText>}
        {!error && helperText && <HelperText variant="normal">{helperText}</HelperText>}
      </div>
    );
  }
);

Select.displayName = 'Select';
