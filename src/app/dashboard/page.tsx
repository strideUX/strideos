'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import CounterTest from '@/components/features/CounterTest';
import RoleSwitcher from '@/components/features/RoleSwitcher';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render dashboard if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Redirecting to sign-in...</div>
      </div>
    );
  }

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading dashboard...</div>
      </div>
    );
  }

  // Role-based content rendering
  const renderRoleBasedContent = () => {
    const role = user.role || 'pm'; // Default to pm if no role assigned

    switch (role) {
      case 'admin':
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Admin Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              You are an admin. You have full system access and can manage users, clients, and departments.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Admin Capabilities
              </h2>
              <ul className="text-left text-slate-600 dark:text-slate-300 space-y-2">
                <li>• Manage all users and their roles</li>
                <li>• Create and manage clients</li>
                <li>• Configure departments and workstreams</li>
                <li>• Access system-wide analytics</li>
                <li>• Override any project or task permissions</li>
              </ul>
            </div>
          </div>
        );

      case 'pm':
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              PM Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              You are a Project Manager. You can create and manage projects, assign tasks, and oversee project delivery.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                PM Capabilities
              </h2>
              <ul className="text-left text-slate-600 dark:text-slate-300 space-y-2">
                <li>• Create and manage project documents</li>
                <li>• Assign tasks to team members</li>
                <li>• Set project timelines and priorities</li>
                <li>• Review and approve task completions</li>
                <li>• Manage sprint planning and capacity</li>
              </ul>
            </div>
          </div>
        );

      case 'task_owner':
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Task Owner Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              You are a Task Owner. You can view and update your assigned tasks, track progress, and collaborate on projects.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Task Owner Capabilities
              </h2>
              <ul className="text-left text-slate-600 dark:text-slate-300 space-y-2">
                <li>• View assigned tasks and project context</li>
                <li>• Update task status and progress</li>
                <li>• Add comments and documentation</li>
                <li>• Collaborate with team members</li>
                <li>• Track personal productivity metrics</li>
              </ul>
            </div>
          </div>
        );

      case 'client':
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Client Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              You are a Client. You can view project progress, provide feedback, and stay informed about deliverables.
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Client Capabilities
              </h2>
              <ul className="text-left text-slate-600 dark:text-slate-300 space-y-2">
                <li>• View project documents and progress</li>
                <li>• Provide feedback and comments</li>
                <li>• Track milestone completions</li>
                <li>• Review deliverables and approvals</li>
                <li>• Access project timeline and status</li>
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Welcome! Your role is not yet assigned. Please contact an administrator.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                strideOS
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/projects"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/tasks"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Tasks
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600 dark:text-slate-300">
                Welcome, {user?.name || user?.email}
              </span>
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {user?.role || 'No Role'}
              </span>
              <Link href="/sign-out" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Development Role Switcher - Remove this later */}
        <RoleSwitcher />
        
        {renderRoleBasedContent()}

        {/* Development Section - Remove this later */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Development Testing
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            This section is for testing real-time functionality during development. It will be removed in future updates.
          </p>
          <CounterTest />
        </div>
      </main>
    </div>
  );
} 