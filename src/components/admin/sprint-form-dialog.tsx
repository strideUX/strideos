'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IconX, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Sprint {
  _id: Id<"sprints">;
  name?: string;
  description?: string;
  clientId?: Id<"clients">;
  departmentId?: Id<"departments">;
  startDate?: number;
  endDate?: number;
  duration?: number;
  totalCapacity?: number;
  velocityTarget?: number;
  sprintMasterId?: Id<"users">;
  teamMemberIds?: Id<"users">[];
  goals?: string[];
}

interface Client {
  _id: Id<"clients">;
  name: string;
}

interface Department {
  _id: Id<"departments">;
  name: string;
  clientId: Id<"clients">;
}

interface User {
  _id: Id<"users">;
  name?: string;
  email?: string;
  role?: string;
  departmentIds?: Id<"departments">[];
}

interface sprint-form-dialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: Sprint;
  clients: Client[];
  departments: Department[];
  users: User[];
  defaultValues?: { clientId?: Id<"clients">; departmentId?: Id<"departments"> };
  onSuccess?: (sprintId: Id<"sprints">, context?: { clientId?: Id<"clients">; departmentId?: Id<"departments"> }) => void;
}

export function sprint-form-dialog({ open, onOpenChange, sprint, clients, departments, users, defaultValues, onSuccess }: sprint-form-dialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    duration: 2,
    totalCapacity: 40,
    useAutoCapacity: true, // New field to control auto capacity calculation
    velocityTarget: 20,
    sprintMasterId: '',
    teamMemberIds: [] as Id<"users">[],
    goals: [] as string[],
    newGoal: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutations
  const createSprint = useMutation(api.sprints.createSprint);
  const updateSprint = useMutation(api.sprints.updateSprint);

  // Queries
  const departmentCapacity = useQuery(
    api.sprints.getDepartmentCapacity,
    formData.departmentId && formData.duration ? {
      departmentId: formData.departmentId as Id<"departments">,
      duration: formData.duration,
    } : 'skip'
  );

  // Initialize form data when editing
  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name || '',
        description: sprint.description || '',
        clientId: sprint.clientId || '',
        departmentId: sprint.departmentId || '',
        startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
        endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
        duration: sprint.duration || 2,
        totalCapacity: sprint.totalCapacity || 40,
        useAutoCapacity: true,
        velocityTarget: sprint.velocityTarget || 20,
        sprintMasterId: sprint.sprintMasterId || 'none',
        teamMemberIds: sprint.teamMemberIds || [],
        goals: sprint.goals || [],
        newGoal: '',
      });
    } else {
      // Reset form for new sprint
      setFormData({
        name: '',
        description: '',
        clientId: defaultValues?.clientId || '',
        departmentId: defaultValues?.departmentId || '',
        startDate: '',
        endDate: '',
        duration: 2,
        totalCapacity: 40,
        useAutoCapacity: true,
        velocityTarget: 20,
        sprintMasterId: 'none',
        teamMemberIds: [],
        goals: [],
        newGoal: '',
      });
    }
  }, [sprint, open, defaultValues?.clientId, defaultValues?.departmentId]);

  // Filter departments based on selected client
  const filteredDepartments = departments?.filter(dept => 
    !formData.clientId || dept.clientId === formData.clientId
  ) || [];

  // Filter users based on selected department
  const filteredUsers = users?.filter(user => {
    if (!formData.departmentId) return true;
    return user.departmentIds?.includes(formData.departmentId as Id<"departments">) || user.role === 'admin' || user.role === 'pm';
  }) || [];

  // Calculate capacity based on department settings
  const calculatedCapacity = departmentCapacity?.calculatedCapacity || 0;
  const capacityPerWeek = departmentCapacity?.capacityPerWeek || 0;
  const workstreamCount = departmentCapacity?.workstreamCount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.clientId || !formData.departmentId || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate dates
      const startDate = new Date(formData.startDate).getTime();
      const endDate = new Date(formData.endDate).getTime();
      
      if (startDate >= endDate) {
        toast.error('End date must be after start date');
        return;
      }

      const sprintData = {
        name: formData.name,
        description: formData.description,
        clientId: formData.clientId as Id<"clients">,
        departmentId: formData.departmentId as Id<"departments">,
        startDate,
        endDate,
        duration: formData.duration,
        totalCapacity: formData.useAutoCapacity ? undefined : formData.totalCapacity, // Use calculated capacity if auto is enabled
        goals: formData.goals,
        velocityTarget: formData.velocityTarget,
        sprintMasterId: formData.sprintMasterId === 'none' ? undefined : (formData.sprintMasterId as Id<"users"> || undefined),
        teamMemberIds: formData.teamMemberIds,
      };

      if (sprint) {
        // Update existing sprint
        await updateSprint({
          id: sprint._id,
          ...sprintData,
        });
        toast.success('Sprint updated successfully');
        onSuccess?.(sprint._id, { clientId: formData.clientId as Id<"clients">, departmentId: formData.departmentId as Id<"departments"> });
        onOpenChange(false);
      } else {
        // Create new sprint
        const createdId = await createSprint(sprintData);
        toast.success('Sprint created successfully');
        onSuccess?.(createdId, { clientId: formData.clientId as Id<"clients">, departmentId: formData.departmentId as Id<"departments"> });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || 'Failed to save sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGoal = () => {
    if (formData.newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, formData.newGoal.trim()],
        newGoal: '',
      }));
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const toggleTeamMember = (userId: Id<"users">) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(userId)
        ? prev.teamMemberIds.filter(id => id !== userId)
        : [...prev.teamMemberIds, userId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sprint ? 'Edit Sprint' : 'Create New Sprint'}</DialogTitle>
          <DialogDescription>
            {sprint ? 'Update sprint details and configuration.' : 'Create a new sprint with capacity planning and team assignment.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sprint Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sprint 1 - User Authentication"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (weeks) *</Label>
                <Select value={formData.duration.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 week</SelectItem>
                    <SelectItem value="2">2 weeks</SelectItem>
                    <SelectItem value="3">3 weeks</SelectItem>
                    <SelectItem value="4">4 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the sprint goals and objectives..."
                rows={3}
              />
            </div>
          </div>

          {/* Client and Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client & Department</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  clientId: value,
                  departmentId: '', // Reset department when client changes
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sprint Dates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Capacity Planning */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Capacity Planning</h3>
            
            {/* Department Capacity Information */}
            {formData.departmentId && departmentCapacity && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Department Capacity Settings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Workstreams:</span> {workstreamCount}
                  </div>
                  <div>
                    <span className="font-medium">Capacity per workstream:</span> {capacityPerWeek} points/sprint
                  </div>
                  <div>
                    <span className="font-medium">Calculated capacity:</span> {calculatedCapacity} points
                  </div>
                  <div>
                    <span className="font-medium">Capacity per week:</span> {capacityPerWeek.toFixed(1)} points
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useAutoCapacity"
                  checked={formData.useAutoCapacity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    useAutoCapacity: e.target.checked,
                    totalCapacity: e.target.checked ? calculatedCapacity : prev.totalCapacity
                  }))}
                  className="rounded"
                />
                <Label htmlFor="useAutoCapacity" className="text-sm cursor-pointer">
                  Use automatic capacity calculation from department settings
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCapacity">
                    Total Capacity (story points)
                    {formData.useAutoCapacity && (
                      <span className="text-xs text-gray-500 ml-2">Auto-calculated</span>
                    )}
                  </Label>
                  <Input
                    id="totalCapacity"
                    type="number"
                    value={formData.useAutoCapacity ? calculatedCapacity : formData.totalCapacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalCapacity: parseInt(e.target.value) || 0 }))}
                    min="1"
                    disabled={formData.useAutoCapacity}
                    className={formData.useAutoCapacity ? "bg-gray-100" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="velocityTarget">Velocity Target (points/week)</Label>
                  <Input
                    id="velocityTarget"
                    type="number"
                    value={formData.velocityTarget}
                    onChange={(e) => setFormData(prev => ({ ...prev, velocityTarget: parseInt(e.target.value) || 0 }))}
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Team Assignment</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sprintMaster">Sprint Master</Label>
              <Select value={formData.sprintMasterId} onValueChange={(value) => setFormData(prev => ({ ...prev, sprintMasterId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint master" />
                </SelectTrigger>
                <SelectContent>
                                      <SelectItem value="none">No sprint master</SelectItem>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={user._id}
                      checked={formData.teamMemberIds.includes(user._id)}
                      onChange={() => toggleTeamMember(user._id)}
                      className="rounded"
                    />
                    <Label htmlFor={user._id} className="text-sm cursor-pointer">
                      {user.name} ({user.role})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sprint Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sprint Goals</h3>
            
            <div className="space-y-2">
              <Label>Goals</Label>
              <div className="space-y-2">
                {formData.goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex-1 text-left">
                      {goal}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(index)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Input
                  value={formData.newGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, newGoal: e.target.value }))}
                  placeholder="Add a new goal..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (sprint ? 'Update Sprint' : 'Create Sprint')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 