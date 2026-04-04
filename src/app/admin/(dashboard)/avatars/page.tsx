'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Loader, AlertCircle, Mic } from 'lucide-react';
import type { AIAvatar } from '@/types';

interface AvatarVoice {
  id: string;
  avatar_id: string;
  name: string;
  language: string;
  provider: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  provider_voice_id: string;
  is_active: boolean;
}

interface ListResponse {
  success: boolean;
  data: {
    avatars: AIAvatar[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

type FormAvatar = Omit<AIAvatar, 'id' | 'created_at' | 'sort_order'> & { id?: string };

export default function AvatarManagementPage() {
  const [avatars, setAvatars] = useState<AIAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterStyle, setFilterStyle] = useState<string>('');
  const [filterPremium, setFilterPremium] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormAvatar>({
    name: '',
    thumbnail_url: '',
    preview_video_url: null,
    gender: 'male',
    ethnicity: 'asian',
    style: 'professional',
    age_range: '20-30',
    languages: [],
    is_premium: false,
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expandedVoices, setExpandedVoices] = useState<Record<string, boolean>>({});
  const [avatarVoices, setAvatarVoices] = useState<Record<string, AvatarVoice[]>>({});
  const [voicesLoading, setVoicesLoading] = useState<Record<string, boolean>>({});
  const [showVoiceForm, setShowVoiceForm] = useState<string | null>(null);
  const [voiceFormData, setVoiceFormData] = useState({
    name: '',
    language: 'en',
    provider: 'elevenlabs' as const,
    provider_voice_id: '',
  });

  // Fetch avatars
  const fetchAvatars = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/avatars?page=1&pageSize=100');
      const json: ListResponse = await res.json();

      if (!json.success) {
        setError(json.data?.avatars ? null : 'Failed to fetch avatars');
        setAvatars([]);
        return;
      }

      setAvatars(json.data.avatars);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch avatars');
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  // Fetch voices for an avatar
  const fetchAvatarVoices = async (avatarId: string) => {
    if (avatarVoices[avatarId]) return;

    try {
      setVoicesLoading(prev => ({ ...prev, [avatarId]: true }));
      const res = await fetch('/api/admin/voices?pageSize=100');
      const json = await res.json();

      if (json.success) {
        const filtered = json.data.voices.filter((v: AvatarVoice) => v.avatar_id === avatarId);
        setAvatarVoices(prev => ({ ...prev, [avatarId]: filtered }));
      }
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    } finally {
      setVoicesLoading(prev => ({ ...prev, [avatarId]: false }));
    }
  };

  const toggleExpandVoices = (avatarId: string) => {
    setExpandedVoices(prev => ({
      ...prev,
      [avatarId]: !prev[avatarId],
    }));

    if (!expandedVoices[avatarId]) {
      fetchAvatarVoices(avatarId);
    }
  };

  // Filter and search avatars
  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !filterGender || avatar.gender === filterGender;
    const matchesStyle = !filterStyle || avatar.style === filterStyle;
    const matchesPremium = !filterPremium || (filterPremium === 'premium' ? avatar.is_premium : !avatar.is_premium);

    return matchesSearch && matchesGender && matchesStyle && matchesPremium;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (!formData.name || !formData.thumbnail_url) {
        setFormError('Name and thumbnail URL are required');
        setSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        languages: typeof formData.languages === 'string'
          ? formData.languages.split(',').map(l => l.trim()).filter(Boolean)
          : formData.languages,
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/avatars?id=${editingId}`
        : '/api/admin/avatars';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setFormError(json.error || 'Failed to save avatar');
        setSubmitting(false);
        return;
      }

      // Update local state
      if (editingId) {
        setAvatars(prev => prev.map(a => a.id === editingId ? json.data : a));
      } else {
        setAvatars(prev => [...prev, json.data]);
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        thumbnail_url: '',
        preview_video_url: null,
        gender: 'male',
        ethnicity: 'asian',
        style: 'professional',
        age_range: '20-30',
        languages: [],
        is_premium: false,
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
    if (!confirm('Are you sure you want to delete this avatar?')) return;

    try {
      const res = await fetch(`/api/admin/avatars?id=${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to delete avatar');
        return;
      }

      setAvatars(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete avatar');
    }
  };

  // Handle edit
  const handleEdit = (avatar: AIAvatar) => {
    setEditingId(avatar.id);
    setFormData({
      name: avatar.name,
      thumbnail_url: avatar.thumbnail_url,
      preview_video_url: avatar.preview_video_url,
      gender: avatar.gender,
      ethnicity: avatar.ethnicity,
      style: avatar.style,
      age_range: avatar.age_range,
      languages: avatar.languages || [],
      is_premium: avatar.is_premium,
      is_active: avatar.is_active,
    });
    setShowModal(true);
  };

  // Handle toggle active
  const handleToggleActive = async (avatar: AIAvatar) => {
    try {
      const res = await fetch(`/api/admin/avatars?id=${avatar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !avatar.is_active }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAvatars(prev => prev.map(a => a.id === avatar.id ? json.data : a));
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  // Handle add voice
  const handleAddVoice = async (avatarId: string) => {
    if (!voiceFormData.name || !voiceFormData.provider_voice_id) {
      setFormError('Voice name and provider voice ID are required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_id: avatarId,
          ...voiceFormData,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAvatarVoices(prev => ({
          ...prev,
          [avatarId]: [...(prev[avatarId] || []), json.data],
        }));
        setShowVoiceForm(null);
        setVoiceFormData({
          name: '',
          language: 'en',
          provider: 'elevenlabs',
          provider_voice_id: '',
        });
      } else {
        setFormError(json.error || 'Failed to create voice');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create voice');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: avatars.length,
    active: avatars.filter(a => a.is_active).length,
    premium: avatars.filter(a => a.is_premium).length,
    styles: new Set(avatars.map(a => a.style)).size,
  };

  return (
    <div>
      <AdminHeader title="AI 数字人管理" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">总数字人</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600 mt-1">已启用</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.premium}</div>
            <div className="text-sm text-gray-600 mt-1">付费</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.styles}</div>
            <div className="text-sm text-gray-600 mt-1">风格数</div>
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
              name: '',
              thumbnail_url: '',
              preview_video_url: null,
              gender: 'male',
              ethnicity: 'asian',
              style: 'professional',
              age_range: '20-30',
              languages: [],
              is_premium: false,
              is_active: true,
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          添加数字人
        </button>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="搜索数字人名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">所有性别</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="non_binary">非二元</option>
          </select>

          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">所有风格</option>
            <option value="professional">专业</option>
            <option value="casual">休闲</option>
            <option value="creative">创意</option>
            <option value="lifestyle">生活方式</option>
          </select>

          <select
            value={filterPremium}
            onChange={(e) => setFilterPremium(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">所有状态</option>
            <option value="premium">付费</option>
            <option value="free">免费</option>
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 text-brand-600 animate-spin" />
          </div>
        ) : filteredAvatars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">没有找到数字人</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvatars.map((avatar) => (
              <div key={avatar.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center relative">
                  {avatar.thumbnail_url && (
                    <img
                      src={avatar.thumbnail_url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {avatar.is_premium && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-semibold">
                      付费
                    </div>
                  )}
                  {!avatar.thumbnail_url && (
                    <div className="text-4xl font-bold text-brand-600 opacity-30">{avatar.name.charAt(0)}</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{avatar.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{avatar.age_range} 岁</p>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div><span className="font-medium">性别：</span> {avatar.gender === 'male' ? '男' : avatar.gender === 'female' ? '女' : '非二元'}</div>
                    <div><span className="font-medium">风格：</span> {avatar.style}</div>
                    <div><span className="font-medium">语言：</span> {avatar.languages?.join(', ') || '-'}</div>
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleToggleActive(avatar)}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        avatar.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {avatar.is_active ? '已启用' : '未启用'}
                    </button>
                  </div>

                  {/* Voice Section */}
                  <div className="border-t pt-3">
                    <button
                      onClick={() => toggleExpandVoices(avatar.id)}
                      className="w-full flex items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <span>语音 ({avatarVoices[avatar.id]?.length || 0})</span>
                      </div>
                      {expandedVoices[avatar.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedVoices[avatar.id] && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {voicesLoading[avatar.id] ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader className="h-4 w-4 text-brand-600 animate-spin" />
                          </div>
                        ) : (avatarVoices[avatar.id] || []).length > 0 ? (
                          <div className="space-y-2">
                            {(avatarVoices[avatar.id] || []).map(voice => (
                              <div key={voice.id} className="bg-gray-50 p-2 rounded text-xs">
                                <p className="font-medium text-gray-900">{voice.name}</p>
                                <p className="text-gray-600">{voice.language} • {voice.provider}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">暂无语音</p>
                        )}

                        {showVoiceForm === avatar.id ? (
                          <div className="bg-gray-50 p-3 rounded space-y-2">
                            <input
                              type="text"
                              placeholder="语音名称"
                              value={voiceFormData.name}
                              onChange={(e) => setVoiceFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <select
                              value={voiceFormData.language}
                              onChange={(e) => setVoiceFormData(prev => ({ ...prev, language: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="en">英文</option>
                              <option value="zh">中文</option>
                              <option value="es">西班牙文</option>
                              <option value="fr">法文</option>
                            </select>
                            <select
                              value={voiceFormData.provider}
                              onChange={(e) => setVoiceFormData(prev => ({ ...prev, provider: e.target.value as any }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="elevenlabs">ElevenLabs</option>
                              <option value="fish_audio">Fish Audio</option>
                              <option value="google">Google</option>
                              <option value="azure">Azure</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Provider Voice ID"
                              value={voiceFormData.provider_voice_id}
                              onChange={(e) => setVoiceFormData(prev => ({ ...prev, provider_voice_id: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddVoice(avatar.id)}
                                disabled={submitting}
                                className="flex-1 px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                              >
                                {submitting ? '保存中...' : '保存'}
                              </button>
                              <button
                                onClick={() => setShowVoiceForm(null)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowVoiceForm(avatar.id)}
                            className="w-full px-2 py-1 text-xs border border-brand-300 text-brand-600 rounded hover:bg-brand-50"
                          >
                            + 添加语音
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(avatar)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">编辑</span>
                    </button>
                    <button
                      onClick={() => handleDelete(avatar.id)}
                      className="px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? '编辑数字人' : '添加新数字人'}
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

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="例如: Emma Rose"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  缩略图 URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Preview Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  预览视频 URL
                </label>
                <input
                  type="url"
                  value={formData.preview_video_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, preview_video_url: e.target.value || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://example.com/preview.mp4"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  性别 *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="non_binary">非二元</option>
                </select>
              </div>

              {/* Ethnicity */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  种族 *
                </label>
                <select
                  required
                  value={formData.ethnicity}
                  onChange={(e) => setFormData(prev => ({ ...prev, ethnicity: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="asian">亚洲</option>
                  <option value="black">黑色</option>
                  <option value="caucasian">白种人</option>
                  <option value="hispanic">西班牙裔</option>
                  <option value="middle_eastern">中东</option>
                  <option value="mixed">混合</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  风格 *
                </label>
                <select
                  required
                  value={formData.style}
                  onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="professional">专业</option>
                  <option value="casual">休闲</option>
                  <option value="creative">创意</option>
                  <option value="lifestyle">生活方式</option>
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  年龄范围
                </label>
                <input
                  type="text"
                  value={formData.age_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_range: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="20-30"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  语言 (逗号分隔)
                </label>
                <input
                  type="text"
                  value={typeof formData.languages === 'string' ? formData.languages : formData.languages.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="en, zh, es"
                />
              </div>

              {/* Premium Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="premium"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                  className="h-4 w-4 text-brand-600 rounded"
                />
                <label htmlFor="premium" className="text-sm font-medium text-gray-900">
                  付费数字人
                </label>
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
