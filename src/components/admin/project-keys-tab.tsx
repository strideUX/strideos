/**
 * ProjectKeysTab - Project key management tab component for administrative control
 *
 * @remarks
 * Manages JIRA-style project key prefixes used for generating task and sprint slugs.
 * Supports creating, updating, and configuring project keys with scope and status management.
 * Integrates with Convex for real-time data synchronization and key operations.
 * Provides administrative interface for project key lifecycle management.
 *
 * @example
 * ```tsx
 * <ProjectKeysTab />
 * ```
 */

// 1. External imports
import React, { useMemo, useState, memo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// 3. Types
interface ProjectKeyRow {
  /** Unique identifier for the project key */
  _id: string;
  /** JIRA-style key prefix (e.g., "PROJ") */
  key: string;
  /** Optional description for the project key */
  description?: string;
  /** Associated client identifier */
  clientId: string;
  /** Associated department identifier (optional) */
  departmentId?: string;
  /** Associated project identifier (optional) */
  projectId?: string;
  /** Last task number generated with this key */
  lastTaskNumber: number;
  /** Last sprint number generated with this key */
  lastSprintNumber: number;
  /** Whether this is the default project key */
  isDefault: boolean;
  /** Whether this project key is currently active */
  isActive: boolean;
}

interface ProjectKeysTabProps {
  // No props required for this component
}

// 4. Component definition
export const ProjectKeysTab = memo(function ProjectKeysTab({}: ProjectKeysTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (No props to destructure)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const keys = useQuery(api.projectKeys.list, {}) as ProjectKeyRow[] | undefined;
  const updateProjectKey = useMutation(api.projectKeys.update);
  const createProjectKey = useMutation(api.slugs.generateProjectKey);

  const [newDescription, setNewDescription] = useState<string>('');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const projectKeys = useMemo(() => {
    return keys || [];
  }, [keys]);

  const hasKeys = useMemo(() => {
    return projectKeys.length > 0;
  }, [projectKeys]);

  const sortedProjectKeys = useMemo(() => {
    return [...projectKeys].sort((a, b) => {
      // Sort by default first, then by key name
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      return a.key.localeCompare(b.key);
    });
  }, [projectKeys]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDescription(e.target.value);
  }, []);

  const handleCreateKey = useCallback(async () => {
    try {
      await createProjectKey({});
      setNewDescription('');
    } catch (error) {
      console.error('Failed to create project key:', error);
    }
  }, [createProjectKey]);

  const handleToggleActive = useCallback(async (key: ProjectKeyRow) => {
    try {
      await updateProjectKey({ id: key._id, isActive: !key.isActive });
    } catch (error) {
      console.error('Failed to update project key:', error);
    }
  }, [updateProjectKey]);

  const handleToggleDefault = useCallback(async (key: ProjectKeyRow) => {
    try {
      await updateProjectKey({ id: key._id, isDefault: !key.isDefault });
    } catch (error) {
      console.error('Failed to update project key:', error);
    }
  }, [updateProjectKey]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (keys === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading project keys...</div>
        </CardContent>
      </Card>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Keys</CardTitle>
        <CardDescription>Manage JIRA-style key prefixes used for generating task and sprint slugs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-4">
          <Input 
            placeholder="Description (optional)" 
            value={newDescription} 
            onChange={handleDescriptionChange} 
            className="flex-1"
          />
          <Button onClick={handleCreateKey}>
            Create Default Key
          </Button>
        </div>
        
        {!hasKeys ? (
          <div className="text-center py-8 text-muted-foreground">
            No project keys found. Create your first project key to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Counters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjectKeys.map((key) => (
                <TableRow key={key._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono" variant="outline">
                        {key.key}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {key.description || '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Client: {key.clientId}</div>
                      <div>Dept: {key.departmentId || 'All'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      Tasks: {key.lastTaskNumber} • Sprints: {key.lastSprintNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {key.isDefault && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(key)}
                      >
                        {key.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleDefault(key)}
                      >
                        {key.isDefault ? 'Unset Default' : 'Set Default'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});

export default ProjectKeysTab;
