'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Check, X, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const mockAdmins = [
  { id: 1, name: 'Super Admin', email: 'superadmin@example.com', role: 'Super Admin', added: '2024-01-01' },
  { id: 2, name: 'John Manager', email: 'john@example.com', role: 'Admin', added: '2024-02-15' },
  { id: 3, name: 'Sarah Manager', email: 'sarah@example.com', role: 'Admin', added: '2024-03-01' },
];

const mockAPIKeys = [
  {
    id: 1,
    name: 'Production API Key',
    key: 'sk_live_51234567890',
    created: '2024-01-10',
    lastUsed: '2024-03-28',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Development API Key',
    key: 'sk_test_98765432101',
    created: '2024-02-20',
    lastUsed: '2024-03-27',
    status: 'Active',
  },
];

const permissionMatrix = [
  { feature: 'View Dashboard', user: true, admin: true, superAdmin: true },
  { feature: 'Manage Users', user: false, admin: true, superAdmin: true },
  { feature: 'Manage Avatars', user: false, admin: true, superAdmin: true },
  { feature: 'Manage Plans', user: false, admin: false, superAdmin: true },
  { feature: 'Manage Credits', user: false, admin: true, superAdmin: true },
  { feature: 'System Settings', user: false, admin: false, superAdmin: true },
  { feature: 'View Analytics', user: false, admin: true, superAdmin: true },
  { feature: 'Delete Users', user: false, admin: false, superAdmin: true },
  { feature: 'Manage Admins', user: false, admin: false, superAdmin: true },
];

export default function PermissionsPage() {
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');
  const [visibleKeys, setVisibleKeys] = useState<number[]>([]);

  const toggleKeyVisibility = (id: number) => {
    setVisibleKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 14)}${key.substring(key.length - 7)}`;
  };

  return (
    <div>
      <AdminHeader title="角色与权限" userName="超级管理员" />

      <div className="p-6 space-y-8">
        {/* Manage Admins Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">管理员管理</h2>
            <button
              onClick={() => setShowAddAdminForm(!showAddAdminForm)}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加管理员
            </button>
          </div>

          {/* Add Admin Form */}
          {showAddAdminForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="管理员邮箱"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option>Admin</option>
                  <option>Super Admin</option>
                </select>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    添加管理员
                  </button>
                  <button
                    onClick={() => setShowAddAdminForm(false)}
                    className="flex-1 px-4 py-2 bg-white border border-blue-200 text-gray-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admins Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">名称</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">添加时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            admin.role === 'Super Admin'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{admin.added}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={admin.id === 1}
                            title={admin.id === 1 ? 'Cannot modify super admin' : 'Change role'}
                          >
                            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={admin.id === 1}
                            title={admin.id === 1 ? 'Cannot remove super admin' : 'Remove admin'}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Permission Matrix Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">权限矩阵</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                    功能
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">用户</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">管理员</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">超级管理员</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissionMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.user ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.admin ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.superAdmin ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
            <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate New Key
            </button>
          </div>

          {/* API Keys Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Used</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockAPIKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{apiKey.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {visibleKeys.includes(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title={visibleKeys.includes(apiKey.id) ? 'Hide' : 'Show'}
                          >
                            {visibleKeys.includes(apiKey.id) ? (
                              <EyeOff className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Copy key"
                          >
                            <Copy className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{apiKey.created}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{apiKey.lastUsed}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                          {apiKey.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke key"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
