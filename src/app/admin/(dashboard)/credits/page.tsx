'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Edit, Save, X } from 'lucide-react';

interface CreditAction {
  id: string;
  action: string;
  label: string;
  creditCost: number;
  description: string;
}

const creditActions: CreditAction[] = [
  {
    id: 'talking_head',
    action: 'TALKING_HEAD',
    label: 'Talking Head Video',
    creditCost: 1,
    description: 'Generate a video of an AI avatar speaking',
  },
  {
    id: 'hook_video',
    action: 'HOOK_VIDEO',
    label: 'Hook Video',
    creditCost: 0.5,
    description: 'Generate a short hook/intro video',
  },
  {
    id: 'product_demo',
    action: 'PRODUCT_DEMO',
    label: 'Product Demo',
    creditCost: 2,
    description: 'Generate a product demonstration video',
  },
  {
    id: 'broll',
    action: 'BROLL',
    label: 'B-Roll/Stock Footage',
    creditCost: 0.5,
    description: 'Generate supplementary b-roll footage',
  },
  {
    id: 'script_gen',
    action: 'SCRIPT_GEN',
    label: 'Script Generation',
    creditCost: 0.1,
    description: 'Generate a video script using AI',
  },
  {
    id: 'image_gen',
    action: 'IMAGE_GEN',
    label: 'Image Generation',
    creditCost: 0.2,
    description: 'Generate AI images for use in videos',
  },
];

const mockUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Lee', email: 'charlie@example.com' },
  { id: 4, name: 'Diana Wang', email: 'diana@example.com' },
  { id: 5, name: 'Eve Chen', email: 'eve@example.com' },
];

export default function CreditConfigurationPage() {
  const [actions, setActions] = useState(creditActions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CreditAction>>({});
  const [selectedUser, setSelectedUser] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const handleEditAction = (action: CreditAction) => {
    setEditingId(action.id);
    setEditValues({ ...action });
  };

  const handleSaveAction = () => {
    if (editingId && editValues.id) {
      setActions(actions.map(a => a.id === editingId ? { ...a, ...editValues } : a));
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleManualAdjustment = () => {
    if (selectedUser && adjustmentAmount && adjustmentReason) {
      alert(`Manual adjustment submitted:\nUser: ${selectedUser}\nAmount: ${adjustmentAmount}\nReason: ${adjustmentReason}`);
      setSelectedUser('');
      setAdjustmentAmount('');
      setAdjustmentReason('');
    }
  };

  return (
    <div>
      <AdminHeader title="积分配置" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Credit Actions Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">积分操作定义</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">标签</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">积分消耗</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">描述</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {actions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {editingId === action.id ? (
                          <input
                            type="text"
                            value={editValues.action}
                            onChange={(e) => setEditValues({ ...editValues, action: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        ) : (
                          <code className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{action.action}</code>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === action.id ? (
                          <input
                            type="text"
                            value={editValues.label}
                            onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{action.label}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === action.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.creditCost}
                            onChange={(e) => setEditValues({ ...editValues, creditCost: parseFloat(e.target.value) })}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{action.creditCost}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === action.id ? (
                          <input
                            type="text"
                            value={editValues.description}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{action.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === action.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveAction}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditAction(action)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Manual Credit Adjustment */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">手动积分调整</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择用户</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">选择用户...</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数量（积分）</label>
              <input
                type="number"
                step="0.1"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Enter amount to add/subtract"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">原因</label>
            <textarea
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="调整原因..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleManualAdjustment}
            disabled={!selectedUser || !adjustmentAmount || !adjustmentReason}
            className="w-full md:w-auto px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            提交调整
          </button>
        </div>
      </div>
    </div>
  );
}
