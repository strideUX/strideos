'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSearch, IconPlus, IconFileText } from '@tabler/icons-react';
import { useAuth } from '@/lib/auth-hooks';
import { SiteHeader } from '@/components/site-header';
import { DocumentsDataTable } from '@/components/documents/DocumentsDataTable';
import { DocumentFormDialog } from '@/components/documents/DocumentFormDialog';
import type { Id } from '@/convex/_generated/dataModel';

export interface DocumentRow {
  _id: Id<'documents'>;
  title: string;
  documentType?: string;
  createdAt: number;
  updatedAt?: number;
}

export function DocumentsClient() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);

  const documents = (useQuery(api.documents.list, {}) ?? []) as DocumentRow[];

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
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconFileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>

        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DocumentsDataTable documents={filteredDocuments} />

        <DocumentFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </>
  );
}


