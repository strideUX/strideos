"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const userPref: ThemePreference = (user as any)?.themePreference || 'system';

  const [resolvedDark, setResolvedDark] = useState<boolean>(false);

  // Resolve dark mode based on user preference and system
  const desiredDark = useMemo(() => {
    if (userPref === 'dark') return true;
    if (userPref === 'light') return false;
    return getSystemPrefersDark();
  }, [userPref]);

  useEffect(() => {
    setResolvedDark(desiredDark);
  }, [desiredDark]);

  // Listen to system changes when on system mode
  useEffect(() => {
    if (userPref !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolvedDark(media.matches);
    try {
      media.addEventListener('change', onChange);
    } catch {
      // Safari
      // @ts-expect-error Safari
      media.addListener(onChange);
    }
    return () => {
      try {
        media.removeEventListener('change', onChange);
      } catch {
        // Safari
        // @ts-expect-error Safari
        media.removeListener(onChange);
      }
    };
  }, [userPref]);

  // Apply class to document root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (resolvedDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedDark]);

  return <>{children}</>;
}