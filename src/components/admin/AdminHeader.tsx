'use client';

import { Bell, Search, LogOut } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface AdminHeaderProps {
  title: string;
  userName?: string;
}

export default function AdminHeader({ title, userName = 'Admin' }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="h-8 w-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-semibold">
            {getInitials(userName)}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-gray-900">{userName}</div>
            <div className="text-xs text-red-500">超级管理员</div>
          </div>
        </div>
      </div>
    </header>
  );
}
