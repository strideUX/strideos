/**
 * SprintFilters - Filtering interface for sprint management and search
 *
 * @remarks
 * Provides client, department, status, and search filtering capabilities for sprint views.
 * Automatically filters departments based on selected client. Integrates with sprint
 * management workflow for dynamic filtering and search functionality.
 *
 * @example
 * ```tsx
 * <SprintFilters
 *   clients={clientList}
 *   departments={departmentList}
 *   selectedClient="client123"
 *   selectedDepartment="dept456"
 *   selectedStatus="active"
 *   searchQuery="sprint name"
 *   onClientChange={handleClientChange}
 *   onDepartmentChange={handleDepartmentChange}
 *   onStatusChange={handleStatusChange}
 *   onSearchChange={handleSearchChange}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// 3. Types
interface OptionItem { 
  _id: string; 
  name: string; 
}

interface SprintFiltersProps {
  /** List of available clients */
  clients?: OptionItem[] | null;
  /** List of available departments with optional client association */
  departments?: (OptionItem & { clientId?: string })[] | null;
  /** Currently selected client ID */
  selectedClient: string;
  /** Currently selected department ID */
  selectedDepartment: string;
  /** Currently selected status filter */
  selectedStatus: string;
  /** Current search query */
  searchQuery: string;
  /** Callback for client selection change */
  onClientChange: (v: string) => void;
  /** Callback for department selection change */
  onDepartmentChange: (v: string) => void;
  /** Callback for status selection change */
  onStatusChange: (v: string) => void;
  /** Callback for search query change */
  onSearchChange: (v: string) => void;
}

// 4. Component definition
export const SprintFilters = memo(function SprintFilters({
  clients,
  departments,
  selectedClient,
  selectedDepartment,
  selectedStatus,
  searchQuery,
  onClientChange,
  onDepartmentChange,
  onStatusChange,
  onSearchChange,
}: SprintFiltersProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredDepartments = useMemo(() => {
    return (departments ?? []).filter((d) => 
      (selectedClient === "all" ? true : d.clientId === selectedClient)
    );
  }, [departments, selectedClient]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleClientChange = useCallback((value: string) => {
    onClientChange(value);
    onDepartmentChange('all');
  }, [onClientChange, onDepartmentChange]);

  const handleDepartmentChange = useCallback((value: string) => {
    onDepartmentChange(value);
  }, [onDepartmentChange]);

  const handleStatusChange = useCallback((value: string) => {
    onStatusChange(value);
  }, [onStatusChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter sprints by client, department, status, or search by name.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client</label>
            <Select value={selectedClient} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {(clients ?? []).map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {filteredDepartments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input 
              placeholder="Search sprints..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});


