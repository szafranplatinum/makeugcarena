'use client';

import { useState } from 'react';
import UserHeader from '@/components/dashboard/UserHeader';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  Star,
  Filter,
} from 'lucide-react';

interface Script {
  id: string;
  title: string;
  category: string;
  wordCount: number;
  date: string;
  favorite: boolean;
  tone: string;
}

const mockScripts: Script[] = [
  {
    id: '1',
    title: 'Product Demo - Camera',
    category: 'Product Demo',
    wordCount: 250,
    date: '2024-03-28',
    favorite: true,
    tone: 'Professional',
  },
  {
    id: '2',
    title: 'Social Media Ad Template',
    category: 'Marketing',
    wordCount: 150,
    date: '2024-03-25',
    favorite: false,
    tone: 'Energetic',
  },
  {
    id: '3',
    title: 'Tutorial Introduction',
    category: 'Tutorial',
    wordCount: 200,
    date: '2024-03-20',
    favorite: true,
    tone: 'Friendly',
  },
  {
    id: '4',
    title: 'Brand Story Overview',
    category: 'Brand Story',
    wordCount: 300,
    date: '2024-03-15',
    favorite: false,
    tone: 'Professional',
  },
];

const categories = ['All', 'Product Demo', 'Marketing', 'Tutorial', 'Brand Story'];

export default function ScriptsPage() {
  const [scripts, setScripts] = useState(mockScripts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScriptTitle, setNewScriptTitle] = useState('');

  const filteredScripts = scripts.filter((script) => {
    const matchesSearch = script.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || script.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    setScripts(scripts.filter((s) => s.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setScripts(
      scripts.map((s) =>
        s.id === id ? { ...s, favorite: !s.favorite } : s
      )
    );
  };

  const handleCreateScript = () => {
    if (newScriptTitle.trim()) {
      const newScript: Script = {
        id: (scripts.length + 1).toString(),
        title: newScriptTitle,
        category: 'Product Demo',
        wordCount: 0,
        date: new Date().toISOString().split('T')[0],
        favorite: false,
        tone: 'Professional',
      };
      setScripts([newScript, ...scripts]);
      setNewScriptTitle('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <UserHeader title="Scripts" subtitle="Manage your video scripts" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Action Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Script
            </button>
          </div>

          {/* Scripts Table */}
          {filteredScripts.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-8">
                        <button className="text-gray-500 hover:text-gray-700">
                          ★
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Tone
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Words
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScripts.map((script) => (
                      <tr
                        key={script.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleToggleFavorite(script.id)}
                            className={`text-lg transition-colors ${
                              script.favorite
                                ? 'text-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            ★
                          </button>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {script.title}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {script.category}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {script.tone}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {script.wordCount}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(script.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            title="Copy"
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors inline-block"
                          >
                            <Copy className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(script.id)}
                            title="Delete"
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors inline-block"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-600 font-medium">No scripts found</p>
              <p className="text-gray-500 text-sm mt-1">
                Create your first script to get started
              </p>
            </div>
          )}

          {/* Create Script Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-8 max-w-sm w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Create New Script
                </h3>
                <input
                  type="text"
                  placeholder="Script title..."
                  value={newScriptTitle}
                  onChange={(e) => setNewScriptTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent mb-6"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateScript();
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateScript}
                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
