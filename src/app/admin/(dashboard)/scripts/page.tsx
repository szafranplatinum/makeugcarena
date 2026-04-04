'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';

const mockScripts = [
  {
    id: 1,
    title: 'Product Launch Announcement',
    user: { name: 'Alice Johnson', email: 'alice@example.com' },
    language: 'English',
    tone: 'Professional',
    wordCount: 350,
    aiGenerated: true,
    created: '2024-03-28',
  },
  {
    id: 2,
    title: 'Customer Success Story',
    user: { name: 'Bob Smith', email: 'bob@example.com' },
    language: 'English',
    tone: 'Inspirational',
    wordCount: 420,
    aiGenerated: false,
    created: '2024-03-27',
  },
  {
    id: 3,
    title: 'Product Demo Walkthrough',
    user: { name: 'Charlie Lee', email: 'charlie@example.com' },
    language: 'English',
    tone: 'Casual',
    wordCount: 280,
    aiGenerated: true,
    created: '2024-03-27',
  },
  {
    id: 4,
    title: 'Educational Tutorial Series',
    user: { name: 'Diana Wang', email: 'diana@example.com' },
    language: 'Spanish',
    tone: 'Educational',
    wordCount: 510,
    aiGenerated: false,
    created: '2024-03-26',
  },
  {
    id: 5,
    title: 'Brand Story Introduction',
    user: { name: 'Eve Chen', email: 'eve@example.com' },
    language: 'English',
    tone: 'Inspirational',
    wordCount: 380,
    aiGenerated: true,
    created: '2024-03-26',
  },
  {
    id: 6,
    title: 'How-To Guide Script',
    user: { name: 'Frank Brown', email: 'frank@example.com' },
    language: 'English',
    tone: 'Casual',
    wordCount: 290,
    aiGenerated: true,
    created: '2024-03-25',
  },
  {
    id: 7,
    title: 'Podcast Interview Script',
    user: { name: 'Grace Martinez', email: 'grace@example.com' },
    language: 'Portuguese',
    tone: 'Conversational',
    wordCount: 650,
    aiGenerated: false,
    created: '2024-03-25',
  },
  {
    id: 8,
    title: 'Product Comparison Video',
    user: { name: 'Henry Davis', email: 'henry@example.com' },
    language: 'English',
    tone: 'Professional',
    wordCount: 400,
    aiGenerated: true,
    created: '2024-03-24',
  },
];

const toneColorMap: Record<string, string> = {
  Professional: 'bg-blue-100 text-blue-700',
  Inspirational: 'bg-purple-100 text-purple-700',
  Casual: 'bg-green-100 text-green-700',
  Educational: 'bg-amber-100 text-amber-700',
  Conversational: 'bg-pink-100 text-pink-700',
};

export default function ScriptManagementPage() {
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [aiFilter, setAiFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredScripts = mockScripts.filter((script) => {
    const matchSearch = script.title.toLowerCase().includes(search.toLowerCase()) ||
                       script.user.name.toLowerCase().includes(search.toLowerCase()) ||
                       script.user.email.toLowerCase().includes(search.toLowerCase());
    const matchLanguage = languageFilter === 'All' || script.language === languageFilter;
    const matchAi = aiFilter === 'All' || (aiFilter === 'AI Generated' ? script.aiGenerated : !script.aiGenerated);
    return matchSearch && matchLanguage && matchAi;
  });

  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedScripts = filteredScripts.slice(startIndex, startIndex + itemsPerPage);

  const avgWordCount = Math.round(
    mockScripts.reduce((sum, script) => sum + script.wordCount, 0) / mockScripts.length
  );
  const aiGeneratedCount = mockScripts.filter((s) => s.aiGenerated).length;

  return (
    <div>
      <AdminHeader title="脚本管理" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">总脚本数</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{mockScripts.length}</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">AI 生成</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{aiGeneratedCount}</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">手动创建</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">{mockScripts.length - aiGeneratedCount}</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">平均字数</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgWordCount}</h3>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="搜索标题或用户..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <select
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>所有语言</option>
              <option>英语</option>
              <option>西班牙语</option>
              <option>葡萄牙语</option>
            </select>

            <select
              value={aiFilter}
              onChange={(e) => {
                setAiFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>所有脚本</option>
              <option>AI 生成</option>
              <option>手动创建</option>
            </select>

            <div />
          </div>
        </div>

        {/* Scripts Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">标题</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">语言</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">语调</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">字数</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">来源</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedScripts.map((script) => (
                  <tr key={script.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{script.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{script.user.name}</div>
                        <div className="text-xs text-gray-500">{script.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{script.language}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${toneColorMap[script.tone]}`}>
                        {script.tone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{script.wordCount} 字</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          script.aiGenerated
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {script.aiGenerated ? 'AI 生成' : '手动创建'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{script.created}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="查看">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                          <Trash2 className="h-4 w-4 text-red-600" />
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
              显示 {startIndex + 1} 至 {Math.min(startIndex + itemsPerPage, filteredScripts.length)} / {filteredScripts.length} 个脚本
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
