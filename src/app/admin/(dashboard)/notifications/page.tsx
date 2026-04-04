'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

const mockNotifications = [
  {
    id: 1,
    subject: 'New Feature: Avatar Templates Released',
    recipients: 'All Users',
    type: 'info',
    sent: '2024-03-28',
    status: 'Sent',
    openRate: 68,
  },
  {
    id: 2,
    subject: 'Scheduled Maintenance Tonight',
    recipients: 'All Users',
    type: 'warning',
    sent: '2024-03-27',
    status: 'Sent',
    openRate: 92,
  },
  {
    id: 3,
    subject: 'Pro Plan Free Trial Expired',
    recipients: 'Growth Plan Users',
    type: 'warning',
    sent: '2024-03-26',
    status: 'Sent',
    openRate: 54,
  },
  {
    id: 4,
    subject: 'Credits Expiring Soon - Alice Johnson',
    recipients: 'Specific User',
    type: 'alert',
    sent: '2024-03-25',
    status: 'Sent',
    openRate: 100,
  },
  {
    id: 5,
    subject: 'System Alert: High Error Rate Detected',
    recipients: 'Admins Only',
    type: 'alert',
    sent: '2024-03-24',
    status: 'Failed',
    openRate: 0,
  },
];

const typeColorMap: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  alert: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const typeBadgeColorMap: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  alert: 'bg-red-100 text-red-700',
};

const statusColorMap: Record<string, string> = {
  Sent: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
};

export default function NotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient: 'all',
    subject: '',
    message: '',
    type: 'info',
  });
  const itemsPerPage = 5;

  const totalPages = Math.ceil(mockNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedNotifications = mockNotifications.slice(startIndex, startIndex + itemsPerPage);

  const handleSendNotification = () => {
    // Mock send notification
    setFormData({ recipient: 'all', subject: '', message: '', type: 'info' });
    setIsFormOpen(false);
  };

  return (
    <div>
      <AdminHeader title="通知管理" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Send Notification Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">发送通知</h2>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              新建通知
            </button>
          </div>

          {/* Form */}
          {isFormOpen && (
            <div className="p-6 bg-gray-50 border-b border-gray-100 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">接收者</label>
                  <select
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">所有用户</option>
                    <option value="free">免费版用户</option>
                    <option value="startup">启动版用户</option>
                    <option value="growth">增长版用户</option>
                    <option value="pro">专业版用户</option>
                    <option value="enterprise">企业版用户</option>
                    <option value="specific">特定用户</option>
                    <option value="admins">仅管理员</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="info">信息</option>
                    <option value="warning">警告</option>
                    <option value="alert">提醒</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Notification subject..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendNotification}
                  className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                >
                  发送
                </button>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">通知历史</h2>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">接收者</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">发送时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">打开率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{notification.subject}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{notification.recipients}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${typeBadgeColorMap[notification.type]}`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{notification.sent}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColorMap[notification.status]}`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-brand-500 transition-all"
                              style={{ width: `${notification.openRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{notification.openRate}%</span>
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
                显示 {startIndex + 1} 到 {Math.min(startIndex + itemsPerPage, mockNotifications.length)} 的{' '}
                {mockNotifications.length} 个通知
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
    </div>
  );
}
