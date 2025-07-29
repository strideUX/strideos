'use client';

import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RoleSwitcher() {
  const { user } = useAuth();
  const updateUserRole = useMutation(api.auth.updateUserRole);

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'task_owner', label: 'Task Owner' },
    { value: 'client', label: 'Client' },
  ];

  const handleRoleChange = async (role: 'admin' | 'pm' | 'task_owner' | 'client') => {
    try {
      await updateUserRole({ role });
      // The page will automatically re-render due to Convex's real-time updates
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
        🧪 Development Role Switcher
      </h3>
      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
        Current role: <span className="font-mono bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
          {user.role || 'pm'}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => handleRoleChange(role.value as any)}
            disabled={user.role === role.value}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              user.role === role.value
                ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 cursor-not-allowed'
                : 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
        This component will be removed in production. It's for testing role-based content display.
      </p>
    </div>
  );
} 