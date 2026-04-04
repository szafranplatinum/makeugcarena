'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ChevronLeft, ChevronRight, Edit, Ban } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', plan: 'Pro', role: 'User', credits: 450, status: 'active', joined: '2024-01-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', plan: 'Growth', role: 'User', credits: 280, status: 'active', joined: '2024-01-20' },
  { id: 3, name: 'Charlie Lee', email: 'charlie@example.com', plan: 'Startup', role: 'Admin', credits: 150, status: 'active', joined: '2024-02-01' },
  { id: 4, name: 'Diana Wang', email: 'diana@example.com', plan: 'Pro', role: 'User', credits: 520, status: 'inactive', joined: '2024-02-10' },
  { id: 5, name: 'Eve Chen', email: 'eve@example.com', plan: 'Free', role: 'User', credits: 10, status: 'active', joined: '2024-02-15' },
  { id: 6, name: 'Frank Brown', email: 'frank@example.com', plan: 'Enterprise', role: 'Admin', credits: 9999, status: 'active', joined: '2024-02-20' },
  { id: 7, name: 'Grace Martinez', email: 'grace@example.com', plan: 'Growth', role: 'User', credits: 320, status: 'active', joined: '2024-02-25' },
  { id: 8, name: 'Henry Davis', email: 'henry@example.com', plan: 'Startup', role: 'User', credits: 100, status: 'inactive', joined: '2024-03-01' },
];

const planColorMap: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-700',
  Startup: 'bg-blue-100 text-blue-700',
  Growth: 'bg-purple-100 text-purple-700',
  Pro: 'bg-amber-100 text-amber-700',
  Enterprise: 'bg-green-100 text-green-700',
};

const roleColorMap: Record<string, string> = {
  User: 'bg-gray-100 text-gray-700',
  Admin: 'bg-red-100 text-red-700',
};

const statusColorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
};

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredUsers = mockUsers.filter((user) => {
    const matchSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                       user.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'All' || user.plan === planFilter;
    const matchRole = roleFilter === 'All' || user.role === roleFilter;
    return matchSearch && matchPlan && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <AdminHeader title="用户管理" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>所有套餐</option>
              <option>免费版</option>
              <option>创业版</option>
              <option>成长版</option>
              <option>专业版</option>
              <option>企业版</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">所有角色</option>
              <option value="User">用户</option>
              <option value="Admin">管理员</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">套餐</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">积分</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${planColorMap[user.plan]}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColorMap[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.credits}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColorMap[user.status]}`}>
                        {user.status === 'active' ? '活跃' : '不活跃'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="编辑">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="封禁用户">
                          <Ban className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              显示 {startIndex + 1} 至 {Math.min(startIndex + itemsPerPage, filteredUsers.length)} / {filteredUsers.length} 位用户
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-brand-500 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
