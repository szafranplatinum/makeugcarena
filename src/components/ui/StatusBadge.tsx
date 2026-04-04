'use client';

import React from 'react';
import { VIDEO_STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

type VideoStatus = 'draft' | 'processing' | 'rendering' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: VideoStatus;
  size?: 'sm' | 'md';
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = VIDEO_STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  const dotColor = config.color.replace('text-', 'bg-');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        config.bgColor,
        config.color,
        sizeClasses[size]
      )}
    >
      <span className={cn('inline-block h-2 w-2 rounded-full', dotColor)} />
      {config.label}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
