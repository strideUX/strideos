'use client';

import React, { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useAuth } from './AuthProvider';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeSynchronizer(): null {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const dbTheme = (user as any)?.themePreference as 'system' | 'light' | 'dark' | undefined;
    const effective = dbTheme || 'system';
    // Only change if different to avoid unnecessary writes/reflows
    if (effective && effective !== theme) {
      setTheme(effective);
    }
  }, [user, setTheme, theme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey="theme"
    >
      {/* Sync next-themes with the authenticated user's preference */}
      <ThemeSynchronizer />
      {children}
    </NextThemesProvider>
  );
}


