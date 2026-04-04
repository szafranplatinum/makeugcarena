'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  Coins,
  Settings,
  BarChart3,
  Film,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Mic,
} from 'lucide-react';
import { useState } from 'react';

const adminNavItems = [
  {
    group: '概览',
    items: [
      { label: '仪表盘', href: '/admin', icon: LayoutDashboard },
      { label: '数据分析', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    group: '内容管理',
    items: [
      { label: 'AI 数字人', href: '/admin/avatars', icon: UserCircle },
      { label: '语音库', href: '/admin/voices', icon: Mic },
      { label: '视频管理', href: '/admin/videos', icon: Film },
      { label: '脚本管理', href: '/admin/scripts', icon: FileText },
    ],
  },
  {
    group: '用户管理',
    items: [
      { label: '用户列表', href: '/admin/users', icon: Users },
      { label: '订阅计划', href: '/admin/plans', icon: CreditCard },
      { label: '积分配置', href: '/admin/credits', icon: Coins },
    ],
  },
  {
    group: '系统设置',
    items: [
      { label: 'API 配置', href: '/admin/settings', icon: Settings },
      { label: '权限管理', href: '/admin/permissions', icon: Shield },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-400" />
            <span className="font-bold text-lg">管理后台</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {adminNavItems.map((group) => (
          <div key={group.group} className="mb-6">
            {!collapsed && (
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                      collapsed && 'justify-center'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - back to user dashboard */}
      <div className="p-2 border-t border-gray-800">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          {!collapsed && <span>返回前台</span>}
        </Link>
      </div>
    </aside>
  );
}
