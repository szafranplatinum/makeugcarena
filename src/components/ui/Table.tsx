'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BaseProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Table: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table
      className={cn('w-full text-sm text-gray-900', className)}
      {...props}
    >
      {children}
    </table>
  </div>
);

const TableHeader: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <thead className={cn('bg-gray-50 border-b border-gray-200', className)} {...props}>
    {children}
  </thead>
);

const TableBody: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-gray-200', className)} {...props}>
    {children}
  </tbody>
);

const TableRow: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <tr
    className={cn('hover:bg-gray-50 transition-colors duration-200', className)}
    {...props}
  >
    {children}
  </tr>
);

const TableHead: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <th
    className={cn(
      'text-left font-semibold text-gray-700 px-6 py-3',
      className
    )}
    {...props}
  >
    {children}
  </th>
);

const TableCell: React.FC<BaseProps> = ({ className, children, ...props }) => (
  <td className={cn('px-6 py-4 text-gray-700', className)} {...props}>
    {children}
  </td>
);

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHead.displayName = 'TableHead';
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
