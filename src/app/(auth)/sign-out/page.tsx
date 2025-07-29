'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';

export default function SignOutPage() {
  const router = useRouter();
  const { signOut } = useAuthActions();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut();
        router.push('/');
      } catch (error) {
        console.error('Sign out error:', error);
        router.push('/');
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Signing out...
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Please wait while we sign you out.
        </p>
      </div>
    </div>
  );
} 