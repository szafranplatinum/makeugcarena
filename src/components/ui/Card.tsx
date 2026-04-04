'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footer,
  headerAction,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}
      {...props}
    >
      {/* Header */}
      {(title || headerAction) && (
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">{footer}</div>
      )}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;
