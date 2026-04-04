'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import UserHeader from '@/components/dashboard/UserHeader';
import {
  ChevronRight,
  ChevronLeft,
  Wand2,
  Loader2,
  Check,
  Search,
  Play,
  AlertCircle,
} from 'lucide-react';
import type { AIAvatar, VideoProject } from '@/types';

type Step = 1 | 2 | 3 | 4;
type Tone = 'professional' | 'casual' | 'energetic' | 'friendly';
type AspectRatio = '16:9' | '9:16' | '1:1';
type Resolution = '1080p' | '4k';

interface CreateVideoState {
  currentStep: Step;
  // Step 1: Script
  script: string;
  language: string;
  tone: Tone;
  // Step 2: Avatar
  selectedAvatar: AIAvatar | null;
  // Step 3: Settings
  voiceId: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const VOICES = [
  { id: 'voice_sarah', name: 'Sarah', gender: 'female', style: 'warm' },
  { id: 'voice_james', name: 'James', gender: 'male', style: 'professional' },
  { id: 'voice_emma', name: 'Emma', gender: 'female', style: 'energetic' },
  { id: 'voice_michael', name: 'Michael', gender: 'male', style: 'casual' },
  { id: 'voice_lisa', name: 'Lisa', gender: 'female', style: 'friendly' },
  { id: 'voice_david', name: 'David', gender: 'male', style: 'authoritative' },
];

export default function CreateVideoPage() {
  const router = useRouter();
  const { t } = useI18n();

  const STEPS = [
    { number: 1, label: t('create.step.script'), icon: '📝' },
    { number: 2, label: t('create.step.avatar'), icon: '👤' },
    { number: 3, label: t('create.step.settings'), icon: '⚙️' },
    { number: 4, label: t('create.step.generate'), icon: '✨' },
  ];

  const TONES: { value: Tone; label: string }[] = [
    { value: 'professional', label: t('create.professional') },
    { value: 'casual', label: t('create.casual') },
    { value: 'energetic', label: t('create.energetic') },
    { value: 'friendly', label: t('create.friendly') },
  ];

  const [state, setState] = useState<CreateVideoState>({
    currentStep: 1,
    script: '',
    language: 'en',
    tone: 'professional',
    selectedAvatar: null,
    voiceId: 'voice_sarah',
    aspectRatio: '9:16',
    resolution: '1080p',
  });

  // Avatar loading state
  const [avatars, setAvatars] = useState<AIAvatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [avatarsError, setAvatarsError] = useState<string | null>(null);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [avatarGenderFilter, setAvatarGenderFilter] = useState<string>('');
  const [avatarStyleFilter, setAvatarStyleFilter] = useState<string>('');

  // Script generation state
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');

  // Video generation state
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  // ---- Avatar fetching ----
  const fetchAvatars = useCallback(async () => {
    setAvatarsLoading(true);
    setAvatarsError(null);
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '50');
      if (avatarGenderFilter) params.set('gender', avatarGenderFilter);
      if (avatarStyleFilter) params.set('style', avatarStyleFilter);
      if (avatarSearch) params.set('search', avatarSearch);

      const res = await fetch(`/api/avatars?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAvatars(json.data.data || []);
      } else {
        setAvatars([]);
        setAvatarsError(json.error || 'Failed to load avatars');
      }
    } catch (err) {
      setAvatarsError('Failed to load avatars');
      setAvatars([]);
    } finally {
      setAvatarsLoading(false);
    }
  }, [avatarGenderFilter, avatarStyleFilter, avatarSearch]);

  // Fetch avatars when entering step 2 or when filters change
  useEffect(() => {
    if (state.currentStep === 2) {
      fetchAvatars();
    }
  }, [state.currentStep, fetchAvatars]);

  // ---- Script generation ----
  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) {
      setScriptTopic('our amazing product');
    }
    setScriptGenerating(true);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product: scriptTopic || 'our amazing product',
          tone: state.tone,
          language: state.language,
          duration: 30,
        }),
      });
      const json = await res.json();
      if (json.data?.script) {
        setState((prev) => ({ ...prev, script: json.data.script }));
      }
    } catch (err) {
      console.error('Script generation failed:', err);
    } finally {
      setScriptGenerating(false);
    }
  };

  // ---- Video creation + generation ----
  const handleGenerateVideo = async () => {
    setGenerating(true);
    setGenerationError(null);
    setGenerationStatus('Creating project...');
    setGenerationProgress(5);

    try {
      // Step 1: Create project via POST /api/videos
      const createRes = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `Video - ${new Date().toLocaleDateString()}`,
          type: 'talking_head',
          script: state.script,
          avatarId: state.selectedAvatar?.id || null,
          voiceId: state.voiceId,
          language: state.language,
          ratio: state.aspectRatio,
          resolution: state.resolution,
        }),
      });

      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error || 'Failed to create project');
      }

      const project: VideoProject = createJson.data;
      setProjectId(project.id);
      setGenerationProgress(15);
      setGenerationStatus('Project created. Starting generation...');

      // Step 2: Trigger generation via POST /api/videos/generate
      const genRes = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId: project.id }),
      });

      const genJson = await genRes.json();

      if (!genRes.ok) {
        throw new Error(genJson.error || 'Failed to start generation');
      }

      setGenerationProgress(20);
      setGenerationStatus('Generation started. Processing...');

      // Step 3: Poll status
      pollStatus(project.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setGenerationError(message);
      setGenerating(false);
    }
  };

  const pollStatus = useCallback(
    async (pid: string) => {
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes max

      const poll = async () => {
        try {
          const res = await fetch(`/api/videos/${pid}/status`, {
            credentials: 'include',
          });
          const json = await res.json();

          if (json.success) {
            setGenerationProgress(json.progress || 0);

            if (json.status === 'completed') {
              setGenerationStatus('Video generated successfully!');
              setGenerationProgress(100);
              setGenerationComplete(true);
              setOutputUrl(json.output?.outputUrl || null);
              setGenerating(false);
              return;
            }

            if (json.status === 'failed') {
              setGenerationError(json.error || 'Generation failed');
              setGenerating(false);
              return;
            }

            // Map progress to status text
            const progress = json.progress || 0;
            if (progress <= 20) {
              setGenerationStatus('Generating speech audio...');
            } else if (progress <= 40) {
              setGenerationStatus('Creating lip-sync animation...');
            } else if (progress <= 60) {
              setGenerationStatus('Generating subtitles...');
            } else if (progress <= 80) {
              setGenerationStatus('Composing final video...');
            } else if (json.status === 'rendering') {
              setGenerationStatus('Rendering final output...');
            } else {
              setGenerationStatus('Processing...');
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            setGenerationError('Generation timed out. Check your videos page.');
            setGenerating(false);
          }
        } catch {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            setGenerationError('Lost connection to server');
            setGenerating(false);
          }
        }
      };

      setTimeout(poll, 2000); // Initial delay before first poll
    },
    []
  );

  // ---- Navigation ----
  const handleNextStep = () => {
    if (state.currentStep < 4) {
      setState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as Step,
      }));
    }
  };

  const handlePrevStep = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as Step,
      }));
    }
  };

  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.script.trim().length > 0;
      case 2:
        return state.selectedAvatar !== null;
      case 3:
        return state.voiceId !== '';
      default:
        return true;
    }
  };

  const getLanguageLabel = (val: string) =>
    LANGUAGES.find((l) => l.value === val)?.label || val;

  const getVoiceName = (id: string) =>
    VOICES.find((v) => v.id === id)?.name || id;

  return (
    <div className="flex flex-col h-full">
      <UserHeader title={t('create.title')} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                        step.number < state.currentStep
                          ? 'bg-green-500 text-white'
                          : step.number === state.currentStep
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.number < state.currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium mt-2 ${
                        step.number <= state.currentStep
                          ? 'text-brand-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-4 rounded-full transition-all ${
                        step.number < state.currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* ========== STEP 1: Script ========== */}
            {state.currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="script"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {t('create.scriptTitle')}
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('create.scriptDesc')}
                  </p>
                  <textarea
                    id="script"
                    value={state.script}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, script: e.target.value }))
                    }
                    placeholder={t('create.scriptPlaceholder')}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {state.script.length} {t('create.characters')}
                    </p>
                    <span className="text-xs text-gray-500">
                      {t('create.recommended')}
                    </span>
                  </div>
                </div>

                {/* AI Script Generation */}
                <div className="border border-brand-200 rounded-lg p-4 bg-brand-50">
                  <p className="text-sm font-medium text-brand-700 mb-3">
                    {t('create.orGenerateAI')}
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={scriptTopic}
                      onChange={(e) => setScriptTopic(e.target.value)}
                      placeholder={t('create.productPlaceholder')}
                      className="flex-1 px-3 py-2 border border-brand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      onClick={handleGenerateScript}
                      disabled={scriptGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {scriptGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {scriptGenerating ? t('create.generating') : t('create.generate')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {t('create.language')}
                    </label>
                    <select
                      id="language"
                      value={state.language}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('create.tone')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() =>
                            setState((prev) => ({ ...prev, tone: tone.value }))
                          }
                          className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            state.tone === tone.value
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tone.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== STEP 2: Avatar ========== */}
            {state.currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('create.selectAvatar')}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {t('create.selectAvatarDesc')}
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={avatarSearch}
                      onChange={(e) => setAvatarSearch(e.target.value)}
                      placeholder={t('common.search')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <select
                    value={avatarGenderFilter}
                    onChange={(e) => setAvatarGenderFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">{t('create.filterAll')}</option>
                    <option value="female">{t('create.filterFemale')}</option>
                    <option value="male">{t('create.filterMale')}</option>
                    <option value="non_binary">Non-Binary</option>
                  </select>
                  <select
                    value={avatarStyleFilter}
                    onChange={(e) => setAvatarStyleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Styles</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="creative">Creative</option>
                    <option value="lifestyle">Lifestyle</option>
                  </select>
                </div>

                {/* Avatar Grid */}
                {avatarsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                    <span className="ml-3 text-gray-600">Loading avatars...</span>
                  </div>
                ) : avatarsError ? (
                  <div className="text-center py-16">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600">{avatarsError}</p>
                    <button
                      onClick={fetchAvatars}
                      className="mt-3 text-sm text-brand-600 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : avatars.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500">
                      No avatars found. Please check the database or adjust your filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {avatars.map((avatar) => (
                      <div
                        key={avatar.id}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            selectedAvatar: avatar,
                          }))
                        }
                        className={`rounded-lg border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                          state.selectedAvatar?.id === avatar.id
                            ? 'border-brand-600 bg-brand-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
                          {avatar.thumbnail_url ? (
                            <img
                              src={avatar.thumbnail_url}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-3xl">👤</span>
                            </div>
                          )}
                          {avatar.is_premium && (
                            <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              PRO
                            </span>
                          )}
                          {state.selectedAvatar?.id === avatar.id && (
                            <div className="absolute inset-0 bg-brand-600/20 flex items-center justify-center">
                              <div className="bg-brand-600 rounded-full p-1">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm">
                          {avatar.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {avatar.gender} · {avatar.style}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== STEP 3: Settings ========== */}
            {state.currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('create.videoSettings')}
                </h3>

                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('create.voice')}
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    {t('create.selectVoice')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {VOICES.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() =>
                          setState((prev) => ({ ...prev, voiceId: voice.id }))
                        }
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                          state.voiceId === voice.id
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            voice.gender === 'female'
                              ? 'bg-pink-100 text-pink-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {voice.gender === 'female' ? '♀' : '♂'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {voice.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {voice.style}
                          </p>
                        </div>
                        {state.voiceId === voice.id && (
                          <Check className="h-4 w-4 text-brand-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('create.aspectRatio')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: '9:16', label: 'Portrait', desc: '9:16' },
                          { value: '16:9', label: 'Landscape', desc: '16:9' },
                          { value: '1:1', label: 'Square', desc: '1:1' },
                        ] as const
                      ).map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              aspectRatio: ratio.value,
                            }))
                          }
                          className={`px-3 py-3 rounded-lg border-2 font-medium text-sm transition-all flex flex-col items-center gap-1 ${
                            state.aspectRatio === ratio.value
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className={`border-2 rounded ${
                              state.aspectRatio === ratio.value
                                ? 'border-brand-600'
                                : 'border-gray-400'
                            } ${
                              ratio.value === '9:16'
                                ? 'w-4 h-7'
                                : ratio.value === '16:9'
                                  ? 'w-7 h-4'
                                  : 'w-5 h-5'
                            }`}
                          />
                          <span>{ratio.label}</span>
                          <span className="text-xs text-gray-500">
                            {ratio.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('create.resolution')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: '1080p', label: 'Full HD', desc: '1080p' },
                          { value: '4k', label: 'Ultra HD', desc: '4K' },
                        ] as const
                      ).map((res) => (
                        <button
                          key={res.value}
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              resolution: res.value,
                            }))
                          }
                          className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                            state.resolution === res.value
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p>{res.label}</p>
                          <p className="text-xs text-gray-500">{res.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== STEP 4: Generate ========== */}
            {state.currentStep === 4 && (
              <div className="space-y-6">
                {!generating && !generationComplete && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ready to Generate
                    </h3>
                    <p className="text-gray-600">
                      Review your settings and click generate to create your
                      video.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Script:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {state.script.length} {t('create.characters')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Language:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getLanguageLabel(state.language)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tone:</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {state.tone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avatar:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {state.selectedAvatar?.name || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Voice:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getVoiceName(state.voiceId)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Aspect Ratio:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {state.aspectRatio}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Resolution:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {state.resolution}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">
                          Estimated Credits:
                        </span>
                        <span className="text-sm font-semibold text-amber-600">
                          1.0 credit
                        </span>
                      </div>
                    </div>

                    {generationError && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{generationError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateVideo}
                      className="w-full py-4 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      <Play className="h-5 w-5" />
                      {t('create.generateVideo')}
                    </button>
                  </>
                )}

                {/* Generation in progress */}
                {generating && (
                  <div className="text-center py-8 space-y-6">
                    <Loader2 className="h-12 w-12 animate-spin text-brand-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Generating Your Video
                      </h3>
                      <p className="text-gray-600 mt-1">{generationStatus}</p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-md mx-auto">
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-brand-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {generationProgress}% complete
                      </p>
                    </div>

                    {generationError && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md mx-auto">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm">{generationError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Generation complete */}
                {generationComplete && (
                  <div className="text-center py-8 space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Video Generated Successfully!
                      </h3>
                      <p className="text-gray-600 mt-1">
                        Your video is ready to view and download.
                      </p>
                    </div>

                    {outputUrl && (
                      <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-gray-600 mb-2">Output URL:</p>
                        <p className="text-sm font-mono text-brand-600 break-all">
                          {outputUrl}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => router.push('/dashboard/videos')}
                        className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        View My Videos
                      </button>
                      <button
                        onClick={() => {
                          setState({
                            currentStep: 1,
                            script: '',
                            language: 'en',
                            tone: 'professional',
                            selectedAvatar: null,
                            voiceId: 'voice_sarah',
                            aspectRatio: '9:16',
                            resolution: '1080p',
                          });
                          setGenerationComplete(false);
                          setGenerationError(null);
                          setProjectId(null);
                          setOutputUrl(null);
                          setGenerationProgress(0);
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Create Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {!generating && !generationComplete && (
            <div className="flex justify-between gap-4 mt-8">
              <button
                onClick={handlePrevStep}
                disabled={state.currentStep === 1}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('create.previousStep')}
              </button>
              {state.currentStep < 4 && (
                <button
                  onClick={handleNextStep}
                  disabled={!canProceed()}
                  className="px-6 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {t('create.nextStep')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
