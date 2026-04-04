'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, maxLength, ...props }, ref) => {
    const [value, setValue] = useState(props.defaultValue as string | undefined || '');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const charCount = value?.length || 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div>
          <textarea
            ref={ref}
            maxLength={maxLength}
            className={cn(
              'w-full rounded-lg border transition-colors duration-200 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
              'placeholder-gray-400 text-gray-900 px-3 py-2',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 hover:border-gray-400 focus:border-brand-500',
              className
            )}
            onChange={handleChange}
            {...props}
          />
          {maxLength && (
            <p className="mt-1 text-xs text-gray-500">
              {charCount} / {maxLength}
            </p>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
