'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ChevronLeft, ChevronRight, Eye, RotateCcw, Trash2 } from 'lucide-react';

const mockVideos = [
  {
    id: 1,
    title: 'Product Demo - AI Features',
    user: { name: 'Alice Johnson', email: 'alice@example.com' },
    type: 'Product Demo',
    status: 'Completed',
    duration: '2:45',
    credits: 45,
    created: '2024-03-28',
  },
  {
    id: 2,
    title: 'Talking Head - Customer Review',
    user: { name: 'Bob Smith', email: 'bob@example.com' },
    type: 'Talking Head',
    status: 'Completed',
    duration: '1:32',
    credits: 25,
    created: '2024-03-27',
  },
  {
    id: 3,
    title: 'Hook Video - Tech Explainer',
    user: { name: 'Charlie Lee', email: 'charlie@example.com' },
    type: 'Hook',
    status: 'Rendering',
    duration: '0:45',
    credits: 15,
    created: '2024-03-27',
  },
  {
    id: 4,
    title: 'B-roll Collection - Nature Scenes',
    user: { name: 'Diana Wang', email: 'diana@example.com' },
    type: 'B-roll',
    status: 'Processing',
    duration: '5:20',
    credits: 60,
    created: '2024-03-26',
  },
  {
    id: 5,
    title: 'Product Demo - Landing Page',
    user: { name: 'Eve Chen', email: 'eve@example.com' },
    type: 'Product Demo',
    status: 'Failed',
    duration: '3:10',
    credits: 50,
    created: '2024-03-26',
  },
  {
    id: 6,
    title: 'Talking Head - Testimonial',
    user: { name: 'Frank Brown', email: 'frank@example.com' },
    type: 'Talking Head',
    status: 'Completed',
    duration: '2:15',
    credits: 30,
    created: '2024-03-25',
  },
  {
    id: 7,
    title: 'Hook Video - Viral Trend',
    user: { name: 'Grace Martinez', email: 'grace@example.com' },
    type: 'Hook',
    status: 'Draft',
    duration: '0:30',
    credits: 10,
    created: '2024-03-25',
  },
  {
    id: 8,
    title: 'Product Demo - SaaS Tool',
    user: { name: 'Henry Davis', email: 'henry@example.com' },
    type: 'Product Demo',
    status: 'Completed',
    duration: '4:05',
    credits: 55,
    created: '2024-03-24',
  },
  {
    id: 9,
    title: 'B-roll - Urban Photography',
    user: { name: 'Alice Johnson', email: 'alice@example.com' },
    type: 'B-roll',
    status: 'Completed',
    duration: '6:30',
    credits: 75,
    created: '2024-03-24',
  },
  {
    id: 10,
    title: 'Talking Head - Tutorial Series',
    user: { name: 'Bob Smith', email: 'bob@example.com' },
    type: 'Talking Head',
    status: 'Rendering',
    duration: '8:45',
    credits: 95,
    created: '2024-03-23',
  },
];

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  Processing: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  Rendering: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  Completed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  Failed: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

const typeColorMap: Record<string, string> = {
  'Talking Head': 'bg-purple-100 text-purple-700',
  Hook: 'bg-pink-100 text-pink-700',
  'Product Demo': 'bg-blue-100 text-blue-700',
  'B-roll': 'bg-green-100 text-green-700',
};

export default function VideoManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const itemsPerPage = 10;

  const filteredVideos = mockVideos.filter((video) => {
    const matchSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
                       video.user.name.toLowerCase().includes(search.toLowerCase()) ||
                       video.user.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || video.status === statusFilter;
    const matchType = typeFilter === 'All' || video.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedVideos = filteredVideos.slice(startIndex, startIndex + itemsPerPage);

  const toggleVideoSelection = (id: number) => {
    setSelectedVideos((prev) =>
      prev.includes(id) ? prev.filter((vid) => vid !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedVideos.length === displayedVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(displayedVideos.map((v) => v.id));
    }
  };

  return (
    <div>
      <AdminHeader title="视频管理" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">总视频数</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">8,721</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">已完成</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">7,234</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">处理中</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">89</h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">失败</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">156</h3>
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>所有状态</option>
              <option>草稿</option>
              <option>处理中</option>
              <option>渲染中</option>
              <option>已完成</option>
              <option>失败</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option>所有类型</option>
              <option>数字人口播</option>
              <option>开场钩子</option>
              <option>产品演示</option>
              <option>素材库</option>
            </select>

            <input
              type="date"
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedVideos.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">{selectedVideos.length} video(s) selected</p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors">
                Reprocess Selected
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors">
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Videos Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedVideos.length === displayedVideos.length && displayedVideos.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">标题</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">时长</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">积分</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedVideos.map((video) => {
                  const statusColor = statusColorMap[video.status];
                  return (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedVideos.includes(video.id)}
                          onChange={() => toggleVideoSelection(video.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{video.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{video.user.name}</div>
                          <div className="text-xs text-gray-500">{video.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColorMap[video.type]}`}>
                          {video.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor.bg} ${statusColor.text}`}>
                            {video.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{video.duration}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{video.credits}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{video.created}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="查看">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          {video.status === 'Failed' && (
                            <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="重新处理">
                              <RotateCcw className="h-4 w-4 text-blue-600" />
                            </button>
                          )}
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              显示 {startIndex + 1} 至 {Math.min(startIndex + itemsPerPage, filteredVideos.length)} / {filteredVideos.length} 个视频
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
