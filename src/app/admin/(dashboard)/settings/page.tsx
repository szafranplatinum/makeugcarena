'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Mic,
  Video,
  CreditCard,
  HardDrive,
  Brain,
  RefreshCw,
} from 'lucide-react';

// API Key IDs must match the backend
const KEY = {
  OPENAI_API_KEY: 'api_key_openai',
  OPENAI_MODEL: 'api_config_openai_model',
  OPENAI_PROVIDER: 'api_config_script_provider',
  ANTHROPIC_API_KEY: 'api_key_anthropic',
  ANTHROPIC_MODEL: 'api_config_anthropic_model',
  ELEVENLABS_API_KEY: 'api_key_elevenlabs',
  ELEVENLABS_DEFAULT_VOICE: 'api_config_elevenlabs_voice',
  FISH_AUDIO_API_KEY: 'api_key_fish_audio',
  TTS_PROVIDER: 'api_config_tts_provider',
  HEYGEN_API_KEY: 'api_key_heygen',
  SIMLI_API_KEY: 'api_key_simli',
  LIPSYNC_PROVIDER: 'api_config_lipsync_provider',
  STORAGE_PROVIDER: 'api_config_storage_provider',
  AWS_ACCESS_KEY_ID: 'api_key_aws_access',
  AWS_SECRET_ACCESS_KEY: 'api_key_aws_secret',
  AWS_S3_BUCKET: 'api_config_s3_bucket',
  AWS_S3_REGION: 'api_config_s3_region',
  STRIPE_SECRET_KEY: 'api_key_stripe_secret',
  STRIPE_PUBLISHABLE_KEY: 'api_key_stripe_publishable',
  STRIPE_WEBHOOK_SECRET: 'api_key_stripe_webhook',
} as const;

type TabId = 'script' | 'tts' | 'lipsync' | 'storage' | 'payment' | 'general';

interface TestResult {
  provider: string;
  success: boolean;
  message: string;
}

export default function SystemSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('script');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // General settings (non-API)
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'MakeUGC',
    defaultLanguage: 'en',
    maintenanceMode: false,
    maxDuration: 120,
  });

  // Load existing settings (parallel fetch for speed)
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [res, genRes] = await Promise.all([
        fetch('/api/admin/api-keys'),
        fetch('/api/admin/settings'),
      ]);

      if (res.ok) {
        const json = await res.json();
        if (json.data) setValues(json.data);
      }

      if (genRes.ok) {
        const genJson = await genRes.json();
        if (genJson.data) {
          setGeneralSettings((prev) => ({
            ...prev,
            siteName: genJson.data.site_name || 'MakeUGC',
            defaultLanguage: genJson.data.default_language || 'en',
            maintenanceMode: genJson.data.maintenance_mode === true || genJson.data.maintenance_mode === 'true',
            maxDuration: parseInt(genJson.data.max_video_duration) || 120,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      // Save API keys
      const apiRes = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const apiJson = await apiRes.json();

      // Save general settings
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: JSON.stringify(generalSettings.siteName),
          default_language: JSON.stringify(generalSettings.defaultLanguage),
          maintenance_mode: JSON.stringify(generalSettings.maintenanceMode),
          max_video_duration: JSON.stringify(generalSettings.maxDuration),
        }),
      });

      if (apiRes.ok) {
        setSaveMsg({ type: 'success', text: apiJson.message || '设置保存成功！' });
        // Reload to get fresh masked values
        await loadSettings();
      } else {
        setSaveMsg({ type: 'error', text: apiJson.error || '保存失败' });
      }
    } catch (err) {
      setSaveMsg({ type: 'error', text: '网络错误，请重试。' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };

  const handleTest = async (provider: string) => {
    setTesting(provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      setTestResult({ provider, success: json.success, message: json.message || json.error });
    } catch {
      setTestResult({ provider, success: false, message: 'Network error' });
    } finally {
      setTesting(null);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'script', label: '脚本 AI', icon: <Brain className="h-4 w-4" /> },
    { id: 'tts', label: '语音合成', icon: <Mic className="h-4 w-4" /> },
    { id: 'lipsync', label: '口型同步', icon: <Video className="h-4 w-4" /> },
    { id: 'storage', label: '存储', icon: <HardDrive className="h-4 w-4" /> },
    { id: 'payment', label: '支付', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'general', label: '通用设置', icon: <Zap className="h-4 w-4" /> },
  ];

  // ---- Reusable Components ----
  const ApiKeyInput = ({
    label,
    keyId,
    placeholder,
    helpText,
  }: {
    label: string;
    keyId: string;
    placeholder?: string;
    helpText?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {helpText && <p className="text-xs text-gray-500 mb-2">{helpText}</p>}
      <div className="relative">
        <input
          type={showKeys[keyId] ? 'text' : 'password'}
          value={values[keyId] || ''}
          onChange={(e) => handleChange(keyId, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => toggleKeyVisibility(keyId)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showKeys[keyId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const SelectInput = ({
    label,
    keyId,
    options,
    helpText,
  }: {
    label: string;
    keyId: string;
    options: { value: string; label: string }[];
    helpText?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {helpText && <p className="text-xs text-gray-500 mb-2">{helpText}</p>}
      <select
        value={values[keyId] || options[0]?.value || ''}
        onChange={(e) => handleChange(keyId, e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const TestButton = ({ provider, label }: { provider: string; label: string }) => (
    <button
      onClick={() => handleTest(provider)}
      disabled={testing === provider}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {testing === provider ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Test {label}
    </button>
  );

  const StatusBadge = ({
    keyId,
    label,
  }: {
    keyId: string;
    label: string;
  }) => {
    const val = values[keyId];
    const configured = val && val.length > 0 && !val.includes('not configured');
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          configured
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200'
        }`}
      >
        {configured ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div>
        <AdminHeader title="系统设置" userName="超级管理员" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="系统设置" userName="超级管理员" />

      <div className="p-6">
        {/* Status Banner */}
        {saveMsg && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
              saveMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {saveMsg.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {saveMsg.text}
          </div>
        )}

        {testResult && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
              testResult.success
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {testResult.message}
          </div>
        )}

        {/* Integration Status Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-900">API 集成状态</span>
            <span className="text-xs text-gray-500 ml-2">所有密钥均通过 AES-256-GCM 加密存储</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge keyId={KEY.OPENAI_API_KEY} label="OpenAI" />
            <StatusBadge keyId={KEY.ANTHROPIC_API_KEY} label="Anthropic" />
            <StatusBadge keyId={KEY.ELEVENLABS_API_KEY} label="ElevenLabs" />
            <StatusBadge keyId={KEY.HEYGEN_API_KEY} label="HeyGen" />
            <StatusBadge keyId={KEY.SIMLI_API_KEY} label="Simli" />
            <StatusBadge keyId={KEY.STRIPE_SECRET_KEY} label="Stripe" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* ========== Script AI ========== */}
          {activeTab === 'script' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI 脚本生成</h2>
                <p className="text-sm text-gray-500 mt-1">
                  配置 AI 脚本生成服务商，支持 OpenAI GPT 和 Anthropic Claude。
                </p>
              </div>

              <SelectInput
                label="AI 服务商"
                keyId={KEY.OPENAI_PROVIDER}
                helpText="选择用于生成脚本的 AI 模型"
                options={[
                  { value: 'openai', label: 'OpenAI (GPT-4o / GPT-4o-mini)' },
                  { value: 'anthropic', label: 'Anthropic (Claude Sonnet / Haiku)' },
                ]}
              />

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">OpenAI 配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ApiKeyInput
                    label="OpenAI API 密钥"
                    keyId={KEY.OPENAI_API_KEY}
                    placeholder="sk-proj-..."
                    helpText="从 platform.openai.com 获取密钥"
                  />
                  <SelectInput
                    label="模型"
                    keyId={KEY.OPENAI_MODEL}
                    options={[
                      { value: 'gpt-4o', label: 'GPT-4o（最佳质量）' },
                      { value: 'gpt-4o-mini', label: 'GPT-4o-mini（更快更便宜）' },
                      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    ]}
                  />
                </div>
                <div className="mt-3">
                  <TestButton provider="openai" label="OpenAI" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Anthropic 配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ApiKeyInput
                    label="Anthropic API 密钥"
                    keyId={KEY.ANTHROPIC_API_KEY}
                    placeholder="sk-ant-..."
                    helpText="从 console.anthropic.com 获取密钥"
                  />
                  <SelectInput
                    label="模型"
                    keyId={KEY.ANTHROPIC_MODEL}
                    options={[
                      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4（推荐）' },
                      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5（更快）' },
                      { value: 'claude-opus-4-20250514', label: 'Claude Opus 4（最能干）' },
                    ]}
                  />
                </div>
                <div className="mt-3">
                  <TestButton provider="anthropic" label="Anthropic" />
                </div>
              </div>
            </div>
          )}

          {/* ========== Voice (TTS) ========== */}
          {activeTab === 'tts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">语音合成 (TTS)</h2>
                <p className="text-sm text-gray-500 mt-1">
                  配置文字转语音服务商，用于生成配音。
                </p>
              </div>

              <SelectInput
                label="TTS 服务商"
                keyId={KEY.TTS_PROVIDER}
                helpText="选择语音合成引擎"
                options={[
                  { value: 'elevenlabs', label: 'ElevenLabs（推荐）' },
                  { value: 'fish_audio', label: 'Fish Audio' },
                  { value: 'mock', label: 'Mock（开发用）' },
                ]}
              />

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">ElevenLabs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ApiKeyInput
                    label="ElevenLabs API 密钥"
                    keyId={KEY.ELEVENLABS_API_KEY}
                    placeholder="xi-..."
                    helpText="从 elevenlabs.io/api 获取密钥"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">默认语音 ID</label>
                    <p className="text-xs text-gray-500 mb-2">ElevenLabs 默认语音的 voice_id</p>
                    <input
                      type="text"
                      value={values[KEY.ELEVENLABS_DEFAULT_VOICE] || ''}
                      onChange={(e) => handleChange(KEY.ELEVENLABS_DEFAULT_VOICE, e.target.value)}
                      placeholder="21m00Tcm4TlvDq8ikWAM"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <TestButton provider="elevenlabs" label="ElevenLabs" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Fish Audio</h3>
                <ApiKeyInput
                  label="Fish Audio API 密钥"
                  keyId={KEY.FISH_AUDIO_API_KEY}
                  placeholder="fa-..."
                  helpText="从 fish.audio 获取密钥"
                />
              </div>
            </div>
          )}

          {/* ========== Lip-Sync ========== */}
          {activeTab === 'lipsync' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">口型同步视频生成</h2>
                <p className="text-sm text-gray-500 mt-1">
                  配置口型同步服务商，用于生成数字人视频。
                </p>
              </div>

              <SelectInput
                label="口型同步服务商"
                keyId={KEY.LIPSYNC_PROVIDER}
                helpText="选择视频生成引擎"
                options={[
                  { value: 'heygen', label: 'HeyGen（推荐）' },
                  { value: 'simli', label: 'Simli' },
                  { value: 'mock', label: 'Mock（开发用）' },
                ]}
              />

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">HeyGen</h3>
                <ApiKeyInput
                  label="HeyGen API 密钥"
                  keyId={KEY.HEYGEN_API_KEY}
                  placeholder="hg-..."
                  helpText="从 app.heygen.com/settings 获取密钥"
                />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Simli</h3>
                <ApiKeyInput
                  label="Simli API 密钥"
                  keyId={KEY.SIMLI_API_KEY}
                  placeholder="simli-..."
                  helpText="从 simli.com/dashboard 获取密钥"
                />
              </div>
            </div>
          )}

          {/* ========== Storage ========== */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">文件存储</h2>
                <p className="text-sm text-gray-500 mt-1">
                  配置生成文件（音频、视频、缩略图）的存储位置。
                </p>
              </div>

              <SelectInput
                label="存储服务商"
                keyId={KEY.STORAGE_PROVIDER}
                helpText="选择文件存储后端"
                options={[
                  { value: 'supabase', label: 'Supabase 存储（默认）' },
                  { value: 's3', label: 'AWS S3' },
                ]}
              />

              {values[KEY.STORAGE_PROVIDER] === 's3' && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">AWS S3 配置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ApiKeyInput
                      label="AWS 访问密钥 ID"
                      keyId={KEY.AWS_ACCESS_KEY_ID}
                      placeholder="AKIA..."
                    />
                    <ApiKeyInput
                      label="AWS 秘密访问密钥"
                      keyId={KEY.AWS_SECRET_ACCESS_KEY}
                      placeholder="wJal..."
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">S3 存储桶名称</label>
                      <input
                        type="text"
                        value={values[KEY.AWS_S3_BUCKET] || ''}
                        onChange={(e) => handleChange(KEY.AWS_S3_BUCKET, e.target.value)}
                        placeholder="my-ugc-videos"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                    <SelectInput
                      label="S3 区域"
                      keyId={KEY.AWS_S3_REGION}
                      options={[
                        { value: 'us-east-1', label: '美国东部 (N. Virginia)' },
                        { value: 'us-west-2', label: '美国西部 (Oregon)' },
                        { value: 'eu-west-1', label: '欧洲 (Ireland)' },
                        { value: 'ap-northeast-1', label: '亚太地区 (Tokyo)' },
                        { value: 'ap-southeast-1', label: '亚太地区 (Singapore)' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {(!values[KEY.STORAGE_PROVIDER] || values[KEY.STORAGE_PROVIDER] === 'supabase') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Supabase Storage uses your existing Supabase project. Make sure a storage bucket
                    named <code className="font-mono bg-blue-100 px-1 rounded">media</code> exists
                    in your Supabase dashboard under Storage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========== Payment ========== */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">支付 (Stripe)</h2>
                <p className="text-sm text-gray-500 mt-1">
                  配置 Stripe 用于订阅计费和积分购买。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <ApiKeyInput
                  label="Stripe 公开密钥"
                  keyId={KEY.STRIPE_PUBLISHABLE_KEY}
                  placeholder="pk_live_..."
                  helpText="用于客户端 Stripe.js 的公开密钥"
                />
                <ApiKeyInput
                  label="Stripe 密钥"
                  keyId={KEY.STRIPE_SECRET_KEY}
                  placeholder="sk_live_..."
                  helpText="服务端秘密密钥"
                />
                <ApiKeyInput
                  label="Stripe Webhook 密钥"
                  keyId={KEY.STRIPE_WEBHOOK_SECRET}
                  placeholder="whsec_..."
                  helpText="用于验证事件的 Webhook 签名密钥"
                />
              </div>
            </div>
          )}

          {/* ========== General ========== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">通用设置</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">站点名称</label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({ ...prev, siteName: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">默认语言</label>
                  <select
                    value={generalSettings.defaultLanguage}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({ ...prev, defaultLanguage: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">最大视频时长（秒）</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="10"
                    value={generalSettings.maxDuration}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        maxDuration: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    {generalSettings.maxDuration}s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) =>
                    setGeneralSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                  }
                  className="w-4 h-4 rounded cursor-pointer"
                  id="maintenance"
                />
                <label htmlFor="maintenance" className="text-sm font-medium text-gray-700 cursor-pointer">
                  启用维护模式
                </label>
                <span className="text-xs text-gray-500">（禁用非管理员用户访问）</span>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? '保存中...' : '保存所有设置'}
          </button>
          <span className="text-xs text-gray-500">
            敏感密钥在存储前通过 AES-256-GCM 加密
          </span>
        </div>
      </div>
    </div>
  );
}
