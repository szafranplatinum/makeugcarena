'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="w-full">
      <div
        className="flex items-center border-b border-gray-200 gap-8 overflow-x-auto"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 whitespace-nowrap',
              'border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-brand-600 border-brand-600'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
