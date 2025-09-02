'use client';

import React, { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useCurrentUser } from '@/hooks/use-auth';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeSynchronizer(): null {
  const user = useCurrentUser();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (user === undefined) return;

    const dbTheme = (user as any)?.themePreference as 'system' | 'light' | 'dark' | undefined;
    const effective = dbTheme || 'system';

    if (effective !== theme) {
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
      <ThemeSynchronizer />
      {children}
    </NextThemesProvider>
  );
}

