'use client';

import { AuthProvider } from './AuthProvider';
import { I18nProvider } from '@/lib/i18n';

/**
 * Root providers component that wraps all context providers
 * Composition point for AuthProvider, I18nProvider, ThemeProvider, etc.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
