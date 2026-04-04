'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import UserHeader from '@/components/dashboard/UserHeader';
import { Upload, AlertTriangle, Check, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

interface SettingsState {
  profile: {
    name: string;
    email: string;
  };
  preferences: {
    language: string;
    videoRatio: string;
    resolution: string;
  };
  notifications: {
    emailNotifications: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
  };
}

export default function SettingsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    profile: {
      name: '',
      email: '',
    },
    preferences: {
      language: 'English',
      videoRatio: '16:9',
      resolution: '1080p',
    },
    notifications: {
      emailNotifications: true,
      marketingEmails: false,
    },
    security: {
      twoFactorEnabled: false,
    },
  });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const { data: profile } = (await response.json()) as { data: UserProfile };

        // Populate settings from API response
        setSettings((prev) => ({
          ...prev,
          profile: {
            name: profile.full_name || '',
            email: profile.email || '',
          },
          preferences: {
            ...prev.preferences,
            language: profile.language || 'English',
          },
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load profile'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: settings.profile.name,
          language: settings.preferences.language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (
    field: keyof SettingsState['profile'],
    value: string
  ) => {
    // Prevent email changes
    if (field === 'email') return;

    setSettings({
      ...settings,
      profile: { ...settings.profile, [field]: value },
    });
  };

  const handlePreferencesChange = (
    field: keyof SettingsState['preferences'],
    value: string
  ) => {
    setSettings({
      ...settings,
      preferences: { ...settings.preferences, [field]: value },
    });
  };

  const handleNotificationsChange = (
    field: keyof SettingsState['notifications']
  ) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: !settings.notifications[field],
      },
    });
  };

  const handleSecurityChange = (field: keyof SettingsState['security']) => {
    setSettings({
      ...settings,
      security: { ...settings.security, [field]: !settings.security[field] },
    });
  };

  // Extract initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <UserHeader title={t('settings.title')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <UserHeader title={t('settings.title')} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {saved && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Settings saved successfully!
              </p>
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t('settings.profile')}
            </h3>

            <div className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Profile Picture
                </label>
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                    {getInitials(settings.profile.name)}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors font-medium text-sm">
                      <Upload className="h-4 w-4" />
                      Upload New Picture
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG or PNG, max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t('settings.name')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) =>
                    handleProfileChange('name', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t('settings.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Video Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  {t('settings.language')}
                </label>
                <select
                  id="language"
                  value={settings.preferences.language}
                  onChange={(e) =>
                    handlePreferencesChange('language', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Chinese</option>
                  <option>Japanese</option>
                </select>
              </div>

              {/* Video Ratio */}
              <div>
                <label
                  htmlFor="ratio"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Default Video Ratio
                </label>
                <select
                  id="ratio"
                  value={settings.preferences.videoRatio}
                  onChange={(e) =>
                    handlePreferencesChange('videoRatio', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option>16:9 (Landscape)</option>
                  <option>9:16 (Portrait)</option>
                  <option>1:1 (Square)</option>
                </select>
              </div>

              {/* Resolution */}
              <div>
                <label
                  htmlFor="resolution"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Default Resolution
                </label>
                <select
                  id="resolution"
                  value={settings.preferences.resolution}
                  onChange={(e) =>
                    handlePreferencesChange('resolution', e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option>1080p (Full HD)</option>
                  <option>720p (HD)</option>
                  <option>480p (SD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t('settings.notifications')}
            </h3>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {t('settings.emailNotifications')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Get notified when your videos are ready
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleNotificationsChange('emailNotifications')
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.emailNotifications
                      ? 'bg-brand-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.emailNotifications
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{t('settings.marketingEmails')}</p>
                  <p className="text-sm text-gray-600">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleNotificationsChange('marketingEmails')
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.marketingEmails
                      ? 'bg-brand-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications.marketingEmails
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Security
            </h3>

            <div className="space-y-4">
              {/* Change Password */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">
                    Update your password regularly to keep your account secure
                  </p>
                </div>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Change
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  onClick={() => handleSecurityChange('twoFactorEnabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.security.twoFactorEnabled
                      ? 'bg-brand-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.security.twoFactorEnabled
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t('settings.dangerZone')}
                </h3>
                <p className="text-sm text-red-800">
                  These actions are permanent and cannot be undone
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              {t('settings.deleteAccount')}
            </button>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end gap-4">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-8 max-w-sm w-full">
                <h3 className="text-xl font-bold text-red-900 mb-4">
                  {t('settings.deleteAccount')}?
                </h3>
                <p className="text-gray-600 mb-6">
                  This action is permanent and cannot be undone. All your videos,
                  projects, and data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    {t('settings.deleteAccount')}
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
