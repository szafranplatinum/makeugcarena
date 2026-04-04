'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Edit, Trash2, Loader, AlertCircle } from 'lucide-react';

interface AvatarVoice {
  id: string;
  avatar_id: string;
  name: string;
  language: string;
  accent: string | null;
  provider: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  provider_voice_id: string;
  sample_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface AIAvatar {
  id: string;
  name: string;
}

interface ListResponse {
  success: boolean;
  data: {
    voices: AvatarVoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

type FormVoice = Omit<AvatarVoice, 'id' | 'created_at' | 'sort_order'> & { id?: string };

export default function VoiceManagementPage() {
  const [voices, setVoices] = useState<AvatarVoice[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterLanguage, setFilterLanguage] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormVoice>({
    avatar_id: '',
    name: '',
    language: 'en',
    accent: null,
    provider: 'elevenlabs',
    provider_voice_id: '',
    sample_url: null,
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch voices and avatars
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch voices
        const voicesRes = await fetch('/api/admin/voices?page=1&pageSize=100');
        const voicesJson: ListResponse = await voicesRes.json();

        if (!voicesJson.success) {
          setError('Failed to fetch voices');
          setVoices([]);
          return;
        }

        setVoices(voicesJson.data.voices);

        // Fetch avatars to build a name map
        const avatarsRes = await fetch('/api/admin/avatars?page=1&pageSize=100');
        const avatarsJson = await avatarsRes.json();

        if (avatarsJson.success) {
          const avatarMap: Record<string, string> = {};
          avatarsJson.data.avatars.forEach((avatar: AIAvatar) => {
            avatarMap[avatar.id] = avatar.name;
          });
          setAvatars(avatarMap);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setVoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter voices
  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = !filterProvider || voice.provider === filterProvider;
    const matchesLanguage = !filterLanguage || voice.language === filterLanguage;

    return matchesSearch && matchesProvider && matchesLanguage;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (!formData.name || !formData.avatar_id || !formData.provider || !formData.provider_voice_id) {
        setFormError('Name, avatar, provider, and provider voice ID are required');
        setSubmitting(false);
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/voices?id=${editingId}`
        : '/api/admin/voices';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setFormError(json.error || 'Failed to save voice');
        setSubmitting(false);
        return;
      }

      // Update local state
      if (editingId) {
        setVoices(prev => prev.map(v => v.id === editingId ? json.data : v));
      } else {
        setVoices(prev => [...prev, json.data]);
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        avatar_id: '',
        name: '',
        language: 'en',
        accent: null,
        provider: 'elevenlabs',
        provider_voice_id: '',
        sample_url: null,
        is_active: true,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice?')) return;

    try {
      const res = await fetch(`/api/admin/voices?id=${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to delete voice');
        return;
      }

      setVoices(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice');
    }
  };

  // Handle edit
  const handleEdit = (voice: AvatarVoice) => {
    setEditingId(voice.id);
    setFormData({
      avatar_id: voice.avatar_id,
      name: voice.name,
      language: voice.language,
      accent: voice.accent,
      provider: voice.provider,
      provider_voice_id: voice.provider_voice_id,
      sample_url: voice.sample_url,
      is_active: voice.is_active,
    });
    setShowModal(true);
  };

  // Handle toggle active
  const handleToggleActive = async (voice: AvatarVoice) => {
    try {
      const res = await fetch(`/api/admin/voices?id=${voice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !voice.is_active }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setVoices(prev => prev.map(v => v.id === voice.id ? json.data : v));
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const uniqueLanguages = [...new Set(voices.map(v => v.language))];
  const activeVoices = voices.filter(v => v.is_active).length;

  return (
    <div>
      <AdminHeader title="AI 语音库" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{voices.length}</div>
            <div className="text-sm text-gray-600 mt-1">总语音</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{activeVoices}</div>
            <div className="text-sm text-gray-600 mt-1">已启用</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{new Set(voices.map(v => v.provider)).size}</div>
            <div className="text-sm text-gray-600 mt-1">提供商</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{uniqueLanguages.length}</div>
            <div className="text-sm text-gray-600 mt-1">语言</div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-700 hover:text-red-900 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              avatar_id: '',
              name: '',
              language: 'en',
              accent: null,
              provider: 'elevenlabs',
              provider_voice_id: '',
              sample_url: null,
              is_active: true,
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          添加语音
        </button>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="搜索语音名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">所有提供商</option>
            <option value="elevenlabs">ElevenLabs</option>
            <option value="fish_audio">Fish Audio</option>
            <option value="google">Google</option>
            <option value="azure">Azure</option>
          </select>

          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">所有语言</option>
            <option value="en">英文</option>
            <option value="zh">中文</option>
            <option value="es">西班牙文</option>
            <option value="fr">法文</option>
            <option value="de">德文</option>
            <option value="ja">日文</option>
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : filteredVoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">没有找到语音</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">数字人</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">语言</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">提供商</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVoices.map(voice => (
                  <tr key={voice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{voice.name}</p>
                      {voice.accent && (
                        <p className="text-xs text-gray-600">{voice.accent}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {avatars[voice.avatar_id] || voice.avatar_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {voice.language.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {voice.provider === 'elevenlabs' && 'ElevenLabs'}
                        {voice.provider === 'fish_audio' && 'Fish Audio'}
                        {voice.provider === 'google' && 'Google'}
                        {voice.provider === 'azure' && 'Azure'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(voice)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          voice.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {voice.is_active ? '已启用' : '未启用'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(voice)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(voice.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? '编辑语音' : '添加新语音'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{formError}</p>
                </div>
              )}

              {/* Avatar ID */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  数字人 *
                </label>
                <select
                  required
                  value={formData.avatar_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">选择数字人...</option>
                  {Object.entries(avatars).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  语音名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="例如: Deep Voice"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  语言 *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="en">英文 (English)</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="es">西班牙文 (Spanish)</option>
                  <option value="fr">法文 (French)</option>
                  <option value="de">德文 (German)</option>
                  <option value="ja">日文 (Japanese)</option>
                  <option value="ko">韩文 (Korean)</option>
                </select>
              </div>

              {/* Accent */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  口音
                </label>
                <input
                  type="text"
                  value={formData.accent || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accent: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="例如: British, American"
                />
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  提供商 *
                </label>
                <select
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="fish_audio">Fish Audio</option>
                  <option value="google">Google</option>
                  <option value="azure">Azure</option>
                </select>
              </div>

              {/* Provider Voice ID */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  提供商语音 ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.provider_voice_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider_voice_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="例如: 21m00Tcm4TlvDq8ikWAM"
                />
              </div>

              {/* Sample URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  示例音频 URL
                </label>
                <input
                  type="url"
                  value={formData.sample_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_url: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://example.com/sample.mp3"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-brand-600 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-900">
                  启用
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
