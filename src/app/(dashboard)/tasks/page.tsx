'use client';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/auth-hooks';

export default function TasksInsightsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </>
  );
}


