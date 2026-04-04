'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';
import {
  LayoutDashboard,
  PlusCircle,
  Film,
  UserCircle,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export default function UserSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useI18n();
  const creditsLeft = 450; // Mock data
  const maxCredits = 500;
  const creditsUsed = maxCredits - creditsLeft;
  const creditPercentage = (creditsUsed / maxCredits) * 100;

  const userNavItems = [
    { label: t('nav.overview'), href: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.createVideo'), href: '/dashboard/create', icon: PlusCircle },
    { label: t('nav.myProjects'), href: '/dashboard/projects', icon: Film },
    { label: t('nav.aiAvatars'), href: '/dashboard/avatars', icon: UserCircle },
    { label: t('nav.scripts'), href: '/dashboard/scripts', icon: FileText },
    { label: t('nav.billing'), href: '/dashboard/billing', icon: CreditCard },
    { label: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white text-gray-900 transition-all duration-300 sticky top-0 border-r border-gray-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="font-bold text-lg text-brand-600">MakeUGC</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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
        <div className="space-y-1">
          {userNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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
      </nav>

      {/* Language Switcher + Credits */}
      <div className={cn('border-t border-gray-200', collapsed && 'px-2')}>
        {/* Language Switcher */}
        {!collapsed && (
          <div className="px-4 pt-3 pb-1">
            <LanguageSwitcher className="w-full justify-center" />
          </div>
        )}

        {/* Credits */}
        <div className={cn('p-4', collapsed && 'px-2')}>
          {!collapsed && (
            <>
              <div className="text-xs font-semibold text-gray-600 mb-2">
                {t('common.creditsLeft', { count: creditsLeft })}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-300"
                  style={{ width: `${creditPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {creditsUsed} {t('common.of')} {maxCredits} {t('common.used')}
              </div>
            </>
          )}
          {collapsed && (
            <div className="text-center">
              <div className="text-xs font-semibold text-brand-600">
                {creditsLeft}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
