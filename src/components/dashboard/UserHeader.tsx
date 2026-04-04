'use client';

import { Bell, Coins } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface UserHeaderProps {
  title: string;
  subtitle?: string;
}

export default function UserHeader({ title, subtitle }: UserHeaderProps) {
  const userName = 'John Doe'; // Mock data
  const userPlan = 'Pro'; // Mock data
  const credits = 450; // Mock data

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-6">
        {/* Credits Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200">
          <Coins className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-medium text-brand-600">{credits}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
            {getInitials(userName)}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs text-brand-600 font-medium">{userPlan}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
