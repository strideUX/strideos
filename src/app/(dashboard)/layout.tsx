'use client';

import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { PageErrorBoundary } from "@/components/error-boundaries/page-error-boundary";
import { NetworkStatusBadge } from "@/components/network-status-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard content if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Redirecting...</div>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Dashboard">
      <SidebarProvider
        style={{
          "--sidebar-width": "250px",
          "--sidebar-width-mobile": "250px",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" user={user || undefined} />
        <SidebarInset>
          <div className="relative">
            {/* Network Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              <NetworkStatusBadge />
            </div>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PageErrorBoundary>
  );
}