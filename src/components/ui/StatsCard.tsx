'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  color = 'brand',
}) => {
  const trendIcon = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />,
  };

  const trendColor = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const colorClasses: Record<string, string> = {
    brand: 'text-brand-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center bg-opacity-10', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>

      {change && (
        <div className={cn('mt-4 inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium', trendColor[trend])}>
          {trendIcon[trend]}
          {change}
        </div>
      )}
    </div>
  );
};

StatsCard.displayName = 'StatsCard';

export default StatsCard;
