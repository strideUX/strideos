"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface OptionItem { _id: string; name: string }

export function SprintFilters({
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
}: {
  clients?: OptionItem[] | null;
  departments?: (OptionItem & { clientId?: string })[] | null;
  selectedClient: string;
  selectedDepartment: string;
  selectedStatus: string;
  searchQuery: string;
  onClientChange: (v: string) => void;
  onDepartmentChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}) {
  const filteredDepartments = (departments ?? []).filter((d) => (selectedClient === "all" ? true : d.clientId === selectedClient));

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
            <Select value={selectedClient} onValueChange={(v) => { onClientChange(v); onDepartmentChange('all'); }}>
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
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
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
            <Select value={selectedStatus} onValueChange={onStatusChange}>
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
            <Input placeholder="Search sprints..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


