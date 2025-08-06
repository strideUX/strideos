'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Department, DepartmentStatus } from '@/types/client';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
  clientId: Id<"clients">;
  onSuccess: () => void;
}

export function DepartmentFormDialog({ 
  open, 
  onOpenChange, 
  department, 
  clientId, 
  onSuccess 
}: DepartmentFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workstreamCount: 1,
    workstreamCapacity: 8,
    sprintDuration: 2,
    workstreamLabels: [] as string[],
    timezone: 'UTC',
    workingHours: {
      start: '09:00',
      end: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    },
    status: 'active' as DepartmentStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workstreamLabelsInput, setWorkstreamLabelsInput] = useState('');

  const createDepartment = useMutation(api.departments.createDepartment);
  const updateDepartment = useMutation(api.departments.updateDepartment);

  // Reset form when dialog opens/closes or department changes
  useEffect(() => {
    if (open) {
      if (department) {
        // Editing existing department
        setFormData({
          name: department.name || '',
          description: department.description || '',
          workstreamCount: department.workstreamCount || 1,
          workstreamCapacity: department.workstreamCapacity || 8,
          sprintDuration: department.sprintDuration || 2,
          workstreamLabels: department.workstreamLabels || [],
          timezone: department.timezone || 'UTC',
          workingHours: department.workingHours || {
            start: '09:00',
            end: '17:00',
            daysOfWeek: [1, 2, 3, 4, 5],
          },
          status: department.status || 'active',
        });
        setWorkstreamLabelsInput(department.workstreamLabels?.join(', ') || '');
      } else {
        // Creating new department
        setFormData({
          name: '',
          description: '',
          workstreamCount: 1,
          workstreamCapacity: 8,
          sprintDuration: 2,
          workstreamLabels: [],
          timezone: 'UTC',
          workingHours: {
            start: '09:00',
            end: '17:00',
            daysOfWeek: [1, 2, 3, 4, 5],
          },
          status: 'active',
        });
        setWorkstreamLabelsInput('');
      }
    }
  }, [open, department]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse workstream labels
      const labels = workstreamLabelsInput
        .split(',')
        .map(label => label.trim())
        .filter(label => label.length > 0);

      if (department) {
        // Update existing department
        await updateDepartment({
          departmentId: department._id as Id<"departments">,
          name: formData.name,
          description: formData.description || undefined,
          workstreamCount: formData.workstreamCount,
          workstreamCapacity: formData.workstreamCapacity,
          sprintDuration: formData.sprintDuration,
          workstreamLabels: labels.length > 0 ? labels : undefined,
          timezone: formData.timezone,
          workingHours: formData.workingHours,
          status: formData.status,
        });
        toast.success('Department updated successfully');
      } else {
        // Create new department
        await createDepartment({
          name: formData.name,
          clientId: clientId,
          description: formData.description || undefined,
          workstreamCount: formData.workstreamCount,
          workstreamCapacity: formData.workstreamCapacity,
          sprintDuration: formData.sprintDuration,
          workstreamLabels: labels.length > 0 ? labels : undefined,
          timezone: formData.timezone,
          workingHours: formData.workingHours,
        });
        toast.success('Department created successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkingHoursChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
      },
    }));
  };

  const handleDayToggle = (day: number) => {
    const currentDays = formData.workingHours.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    handleWorkingHoursChange('daysOfWeek', newDays);
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Create New Department'}
          </DialogTitle>
          <DialogDescription>
            {department 
              ? 'Update the department configuration below.'
              : 'Add a new department to this client organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Engineering, Marketing, Sales"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the department's role and responsibilities"
                  rows={3}
                />
              </div>

              {/* Status - Only show for existing departments, new departments are automatically active */}
              {department && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Workstream Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Workstream Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workstreamCount">Number of Workstreams *</Label>
                <Input
                  id="workstreamCount"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.workstreamCount}
                  onChange={(e) => handleInputChange('workstreamCount', parseInt(e.target.value))}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  How many parallel workstreams this department can handle
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workstreamCapacity">Workstream Capacity *</Label>
                <Input
                  id="workstreamCapacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.workstreamCapacity}
                  onChange={(e) => handleInputChange('workstreamCapacity', parseInt(e.target.value))}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Story points per sprint per workstream
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprintDuration">Sprint Duration (weeks) *</Label>
                <Select value={formData.sprintDuration.toString()} onValueChange={(value) => handleInputChange('sprintDuration', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 week</SelectItem>
                    <SelectItem value="2">2 weeks</SelectItem>
                    <SelectItem value="3">3 weeks</SelectItem>
                    <SelectItem value="4">4 weeks</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Standard sprint length for this department
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workstreamLabels">Workstream Labels (Optional)</Label>
              <Input
                id="workstreamLabels"
                value={workstreamLabelsInput}
                onChange={(e) => setWorkstreamLabelsInput(e.target.value)}
                placeholder="e.g., Frontend, Backend, Mobile (comma-separated)"
              />
              <p className="text-sm text-muted-foreground">
                Custom labels for each workstream. Leave empty for default numbering.
                {formData.workstreamCount > 0 && ` Must provide exactly ${formData.workstreamCount} labels if specified.`}
              </p>
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Working Hours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex gap-1">
                  {dayLabels.map((label, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={formData.workingHours.daysOfWeek.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(index)}
                      className="w-10 h-8 text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.workingHours.start}
                  onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.workingHours.end}
                  onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Saving...' : (department ? 'Update Department' : 'Create Department')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
