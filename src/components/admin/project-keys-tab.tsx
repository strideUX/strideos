"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectKeyRow {
  _id: string;
  key: string;
  description?: string;
  clientId: string;
  departmentId?: string;
  projectId?: string;
  lastTaskNumber: number;
  lastSprintNumber: number;
  isDefault: boolean;
  isActive: boolean;
}

export default function ProjectKeysTab() {
  const keys = useQuery((api as any).projectKeys?.list, {} as any) as ProjectKeyRow[] | undefined;
  const update = useMutation((api as any).projectKeys?.update);
  const create = useMutation((api as any).slugs?.generateProjectKey);

  const [newDesc, setNewDesc] = useState<string>("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Keys</CardTitle>
        <CardDescription>Manage JIRA-style key prefixes used for slugs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-4">
          <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <Button
            onClick={async () => {
              await create({} as any);
              setNewDesc("");
            }}
          >
            Create Default Key
          </Button>
        </div>
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
            {(keys || []).map((k) => (
              <TableRow key={k._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className="font-mono" variant="outline">{k.key}</Badge>
                    <span className="text-xs text-muted-foreground">{k.description || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Client: {k.clientId}</div>
                    <div>Dept: {k.departmentId || "All"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">Tasks: {k.lastTaskNumber} • Sprints: {k.lastSprintNumber}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={k.isActive ? "default" : "secondary"}>{k.isActive ? "Active" : "Inactive"}</Badge>
                    {k.isDefault && <Badge variant="outline">Default</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => update({ id: k._id, isActive: !k.isActive } as any)}
                    >
                      {k.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => update({ id: k._id, isDefault: !k.isDefault } as any)}
                    >
                      {k.isDefault ? "Unset Default" : "Set Default"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
