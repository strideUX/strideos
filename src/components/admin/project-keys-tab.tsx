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
import { Id } from '@/convex/_generated/dataModel';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 3. Types
interface ProjectKeyRow {
  /** Unique identifier for the project key */
  _id: Id<'projectKeys'>;
  /** JIRA-style key prefix (e.g., "PROJ") */
  key: string;
  /** Optional description for the project key */
  description?: string;
  /** Associated client identifier */
  clientId: Id<'clients'>;
  /** Associated department identifier (optional) */
  departmentId?: Id<'departments'>;
  /** Associated project identifier (optional) */
  projectId?: Id<'projects'>;
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
  const [newDescription, setNewDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');

  // Convex queries and mutations
  const keys = useQuery(api.projectKeys.list as any, {});
  const createProjectKey = useMutation(api.projectKeys.create as any);
  const updateProjectKey = useMutation(api.projectKeys.update as any);

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
    if (!selectedClientId) {
      toast.error('Please select a client first');
      return;
    }
    
    try {
      await createProjectKey({ 
        clientId: selectedClientId,
        description: newDescription || undefined 
      });
      setNewDescription('');
      toast.success('Project key created successfully');
    } catch (error) {
      console.error('Failed to create project key:', error);
      toast.error('Failed to create project key');
    }
  }, [createProjectKey, selectedClientId, newDescription]);

  const handleToggleActive = useCallback(async (key: ProjectKeyRow) => {
    try {
      await updateProjectKey({ id: key._id, isActive: !key.isActive });
      toast.success('Project key updated successfully');
    } catch (error) {
      console.error('Failed to update project key:', error);
      toast.error('Failed to update project key');
    }
  }, [updateProjectKey]);

  const handleToggleDefault = useCallback(async (key: ProjectKeyRow) => {
    try {
      await updateProjectKey({ id: key._id, isDefault: !key.isDefault });
      toast.success('Project key updated successfully');
    } catch (error) {
      console.error('Failed to update project key:', error);
      toast.error('Failed to update project key');
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
          <Select value={selectedClientId} onValueChange={(value: string) => setSelectedClientId(value as Id<'clients'> | '')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Clients</SelectItem>
              {/* TODO: Add client options from API */}
            </SelectContent>
          </Select>
          <Input 
            placeholder="Description (optional)" 
            value={newDescription} 
            onChange={handleDescriptionChange} 
            className="flex-1"
          />
          <Button onClick={handleCreateKey} disabled={!selectedClientId}>
            Create Project Key
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
