'use client';

import Link from 'next/link';
import { useI18n, LanguageSwitcher } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-brand-700">MakeUGC</div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {t('landing.login')}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            {t('landing.getStarted')}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm text-brand-700 mb-8">
          {t('landing.hero')}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          {t('landing.title')}
          <br />
          <span className="text-brand-600">{t('landing.titleHighlight')}</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          {t('landing.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-8 py-3 text-base font-semibold text-white hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            {t('landing.cta')}
          </Link>
          <Link
            href="#demo"
            className="rounded-lg border border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('landing.watchDemo')}
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
          {[
            {
              title: t('landing.feature1Title'),
              desc: t('landing.feature1Desc'),
              icon: '📝',
            },
            {
              title: t('landing.feature2Title'),
              desc: t('landing.feature2Desc'),
              icon: '🎭',
            },
            {
              title: t('landing.feature3Title'),
              desc: t('landing.feature3Desc'),
              icon: '⚡',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
