'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconCalendar, IconUsers, IconTarget, IconTrendingUp, IconArrowRight, IconSearch, IconFilter, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function SprintPlanningPage() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<any>(null);

  // Queries
  const departments = useQuery(api.departments.listAllDepartments, {});
  const sprints = useQuery(
    api.sprints.getSprints,
    selectedDepartment ? { departmentId: selectedDepartment } : 'skip'
  );
  const selectedSprintData = useQuery(
    api.sprints.getSprint,
    selectedSprint ? { id: selectedSprint } : 'skip'
  );
  const backlogTasks = useQuery(
    api.sprints.getSprintBacklogTasks,
    selectedDepartment ? { departmentId: selectedDepartment } : 'skip'
  );

  // Mutations
  const assignTaskToSprint = useMutation(api.tasks.assignTaskToSprint);

  // Role-based permissions
  const canPlanSprints = user?.role === 'admin' || user?.role === 'pm';

  // Filter tasks based on search and filters
  const filteredTasks = backlogTasks?.tasks?.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !task.assignee) ||
      (task.assignee && task.assignee._id === assigneeFilter);

    return matchesSearch && matchesPriority && matchesAssignee;
  }) || [];

  // Calculate capacity utilization
  const capacityUtilization = selectedSprintData ? 
    (selectedSprintData.committedPoints / selectedSprintData.totalCapacity) * 100 : 0;
  
  const isCapacityWarning = capacityUtilization > 80;
  const isCapacityCritical = capacityUtilization > 100;

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!canPlanSprints) {
    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="flex flex-col gap-6 p-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                  <p className="text-gray-600">Only Project Managers and Administrators can access sprint planning.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const handleAssignTask = async (taskId: string) => {
    if (!selectedSprint) {
      toast.error('Please select a sprint first');
      return;
    }

    try {
      await assignTaskToSprint({
        taskId,
        sprintId: selectedSprint,
      });
      toast.success('Task assigned to sprint successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign task to sprint');
    }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setIsDragging(true);
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTask(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedSprint || !draggedTask) return;

    try {
      await assignTaskToSprint({
        taskId: draggedTask._id,
        sprintId: selectedSprint,
      });
      toast.success('Task assigned to sprint successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign task to sprint');
    }
    
    setIsDragging(false);
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'active': return 'default';
      case 'review': return 'outline';
      case 'complete': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sprint Planning</h1>
              <p className="text-gray-600">Plan and assign tasks to sprints with capacity tracking</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sprint</label>
                  <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints?.map((sprint) => (
                        <SelectItem key={sprint._id} value={sprint._id}>
                          {sprint.name} ({formatDate(sprint.startDate)} - {formatDate(sprint.endDate)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assignee</label>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {backlogTasks?.tasks?.map((task) => task.assignee).filter(Boolean).map((assignee) => (
                        <SelectItem key={assignee._id} value={assignee._id}>
                          {assignee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sprint Planning Interface */}
          {selectedDepartment && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backlog Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTarget className="h-5 w-5" />
                    Task Backlog
                  </CardTitle>
                  <CardDescription>
                    Available tasks for sprint assignment ({filteredTasks.length} of {backlogTasks?.total || 0} tasks)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div 
                      key={task._id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-move transition-all ${
                        isDragging && draggedTask?._id === task._id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getPriorityBadgeVariant(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.storyPoints && (
                              <Badge variant="outline">{task.storyPoints} pts</Badge>
                            )}
                            {task.assignee ? (
                              <Badge variant="secondary">{task.assignee.name}</Badge>
                            ) : (
                              <Badge variant="outline">Unassigned</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignTask(task._id)}
                          disabled={!selectedSprint}
                        >
                          <IconArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all' 
                        ? 'No tasks match your filters' 
                        : 'No tasks available for assignment'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Sprint */}
              {selectedSprintData && (
                <Card 
                  className={`transition-all ${
                    isDragging ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCalendar className="h-5 w-5" />
                      {selectedSprintData.name}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(selectedSprintData.startDate)} - {formatDate(selectedSprintData.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sprint Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedSprintData.committedPoints}
                        </div>
                        <div className="text-sm text-blue-800">Committed Points</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedSprintData.totalCapacity}
                        </div>
                        <div className="text-sm text-green-800">Total Capacity</div>
                      </div>
                    </div>

                    {/* Capacity Progress with Warnings */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity Utilization</span>
                        <span className={`font-medium ${
                          isCapacityCritical ? 'text-red-600' : 
                          isCapacityWarning ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {Math.round(capacityUtilization)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCapacityCritical ? 'bg-red-600' : 
                            isCapacityWarning ? 'bg-yellow-600' : 'bg-blue-600'
                          }`}
                          style={{ 
                            width: `${Math.min(capacityUtilization, 100)}%` 
                          }}
                        />
                      </div>
                      {(isCapacityWarning || isCapacityCritical) && (
                        <div className={`flex items-center gap-2 text-sm ${
                          isCapacityCritical ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          <IconAlertTriangle className="h-4 w-4" />
                          {isCapacityCritical 
                            ? 'Sprint capacity exceeded!' 
                            : 'Approaching sprint capacity limit'}
                        </div>
                      )}
                    </div>

                    {/* Sprint Tasks */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Assigned Tasks ({selectedSprintData.tasks?.length || 0})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedSprintData.tasks?.map((task) => (
                          <div key={task._id} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{task.title}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                                    {task.priority}
                                  </Badge>
                                  {task.storyPoints && (
                                    <Badge variant="outline" size="sm">{task.storyPoints} pts</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!selectedSprintData.tasks || selectedSprintData.tasks.length === 0) && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            {isDragging ? 'Drop tasks here to assign them' : 'No tasks assigned yet'}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Instructions */}
          {!selectedDepartment && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Get Started</h2>
                  <p className="text-gray-600">Select a department to start planning sprints and assigning tasks.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 