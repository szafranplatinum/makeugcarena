'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Save } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  features: string[];
  stripeMonthlyId: string;
  stripeYearlyId: string;
  isPopular: boolean;
  isActive: boolean;
}

const mockPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 10,
    features: ['10 credits/month', '2 avatars', 'Basic support'],
    stripeMonthlyId: '',
    stripeYearlyId: '',
    isPopular: false,
    isActive: true,
  },
  {
    id: 'startup',
    name: 'Startup',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: 100,
    features: ['100 credits/month', '10 avatars', 'Email support', 'Custom branding'],
    stripeMonthlyId: 'price_startup_monthly',
    stripeYearlyId: 'price_startup_yearly',
    isPopular: false,
    isActive: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 69,
    yearlyPrice: 690,
    credits: 300,
    features: ['300 credits/month', 'Unlimited avatars', 'Priority support', 'Analytics dashboard'],
    stripeMonthlyId: 'price_growth_monthly',
    stripeYearlyId: 'price_growth_yearly',
    isPopular: true,
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 119,
    yearlyPrice: 1190,
    credits: 500,
    features: ['500 credits/month', 'Unlimited avatars', 'Phone support', 'API access'],
    stripeMonthlyId: 'price_pro_monthly',
    stripeYearlyId: 'price_pro_yearly',
    isPopular: false,
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 9999,
    features: ['Custom credits', 'Dedicated account manager', '24/7 support', 'Custom integrations'],
    stripeMonthlyId: '',
    stripeYearlyId: '',
    isPopular: false,
    isActive: true,
  },
];

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState(mockPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Plan>>({});

  const handleEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditValues({ ...plan });
  };

  const handleSave = () => {
    if (editingId && editValues.id) {
      setPlans(plans.map(p => p.id === editingId ? { ...p, ...editValues } : p));
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleInputChange = (field: keyof Plan, value: any) => {
    setEditValues({ ...editValues, [field]: value });
  };

  return (
    <div>
      <AdminHeader title="订阅计划" userName="超级管理员" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border ${
                plan.isPopular ? 'border-brand-500 ring-2 ring-brand-500' : 'border-gray-200'
              } bg-white overflow-hidden transition-shadow hover:shadow-lg`}
            >
              {plan.isPopular && (
                <div className="bg-brand-500 text-white text-xs font-semibold px-4 py-2 text-center">
                  最受欢迎
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Plan Name */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>

                {editingId === plan.id ? (
                  <div className="space-y-4">
                    {/* Monthly Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">月付价格</label>
                      <input
                        type="number"
                        value={editValues.monthlyPrice}
                        onChange={(e) => handleInputChange('monthlyPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    {/* Yearly Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">年付价格</label>
                      <input
                        type="number"
                        value={editValues.yearlyPrice}
                        onChange={(e) => handleInputChange('yearlyPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    {/* Credits */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">每月积分</label>
                      <input
                        type="number"
                        value={editValues.credits}
                        onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    {/* Stripe Monthly ID */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stripe 月付价格 ID</label>
                      <input
                        type="text"
                        value={editValues.stripeMonthlyId}
                        onChange={(e) => handleInputChange('stripeMonthlyId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        placeholder="price_xxx"
                      />
                    </div>

                    {/* Stripe Yearly ID */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stripe 年付价格 ID</label>
                      <input
                        type="text"
                        value={editValues.stripeYearlyId}
                        onChange={(e) => handleInputChange('stripeYearlyId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        placeholder="price_xxx"
                      />
                    </div>

                    {/* Popular Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editValues.isPopular}
                        onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <label className="text-sm text-gray-700">标记为热门</label>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editValues.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <label className="text-sm text-gray-700">已启用</label>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Price Display */}
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {plan.monthlyPrice > 0 ? `$${plan.monthlyPrice}` : 'Custom'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">每月</div>
                    </div>

                    {/* Credits */}
                    <div className="py-4 border-y border-gray-200">
                      <div className="text-lg font-semibold text-gray-900">{plan.credits}</div>
                      <div className="text-sm text-gray-600">每月积分</div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-brand-500 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Status */}
                    <div className="pt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          plan.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {plan.isActive ? '已启用' : '未启用'}
                      </span>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(plan)}
                      className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      编辑计划
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
