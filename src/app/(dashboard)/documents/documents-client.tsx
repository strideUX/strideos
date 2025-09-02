'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconSearch, IconPlus, IconFileText } from '@tabler/icons-react';
import { useAuth } from '@/hooks/use-auth';
import { SiteHeader } from '@/components/site-header';
import { DocumentsDataTable } from '@/components/documents/documents-data-table';
import { DocumentFormDialog } from '@/components/documents/document-form-dialog';
import type { Id } from '@/convex/_generated/dataModel';

export interface DocumentRow {
  _id: Id<'documents'>;
  title: string;
  documentType?: string;
  createdAt: number;
  updatedAt?: number;
  status?: string;
  author?: { _id: Id<'users'>; name?: string; email?: string } | null;
  isProjectBrief?: boolean;
}

export function DocumentsClient() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const documentsQuery = useQuery(api.documents.list, {
    status: statusFilter === 'all' ? undefined : (statusFilter as any),
    documentType: typeFilter === 'all' ? undefined : (typeFilter as any),
  });
  const documents = (documentsQuery ?? []) as DocumentRow[];

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) =>
      (doc.title || '').toLowerCase().includes(term) ||
      (doc.documentType || '').toLowerCase().includes(term)
    );
  }, [documents, searchTerm]);

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Documents</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage project and team documents</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="project_brief">Project Brief</SelectItem>
              <SelectItem value="meeting_notes">Meeting Notes</SelectItem>
              <SelectItem value="wiki_article">Wiki Article</SelectItem>
              <SelectItem value="resource_doc">Resource Document</SelectItem>
              <SelectItem value="blank">Blank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription>Overview of all documents</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsQuery === undefined ? (
              <div className="rounded-md border">
                <div className="flex h-24 items-center justify-center text-muted-foreground">Loading documents…</div>
              </div>
            ) : (
              <DocumentsDataTable documents={filteredDocuments} />
            )}
          </CardContent>
        </Card>

        <DocumentFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </>
  );
}


