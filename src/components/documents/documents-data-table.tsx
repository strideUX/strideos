'use client';

import { useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface DocumentRow {
  _id: Id<'documents'>;
  title: string;
  documentType?: string;
  createdAt: number;
  updatedAt?: number;
  status?: string;
  author?: { _id: Id<'users'>; name?: string; email?: string } | null;
  isProjectBrief?: boolean;
}

const getDocumentTypeColor = (type?: string) => {
  switch (type) {
    case 'project_brief': return 'bg-blue-100 text-blue-800';
    case 'meeting_notes': return 'bg-green-100 text-green-800';
    case 'wiki_article': return 'bg-purple-100 text-purple-800';
    case 'resource_doc': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDocumentType = (type?: string) => {
  const typeMap: Record<string, string> = {
    project_brief: 'Project Brief',
    meeting_notes: 'Meeting Notes',
    wiki_article: 'Wiki Article',
    resource_doc: 'Resource Doc',
    blank: 'Blank',
  } as const;
  return (type && typeMap[type]) || (type ?? 'Unknown');
};

const getStatusBadge = (status?: string) => {
  const s = (status || 'draft').toLowerCase();
  switch (s) {
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Draft</Badge>;
    case 'published':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Published</Badge>;
    case 'archived':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

interface DocumentsDataTableProps {
  documents: DocumentRow[];
}

export function DocumentsDataTable({ documents }: DocumentsDataTableProps) {
  const router = useRouter();
  const removeDocument = useMutation(api.documents.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);

  const columns: ColumnDef<DocumentRow>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'author',
      header: 'Author',
      cell: ({ row }) => {
        const author = row.original.author;
        return (
          <div className="text-sm text-muted-foreground">{author?.name || author?.email || '—'}</div>
        );
      },
    },
    {
      accessorKey: 'documentType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('documentType') as string | undefined;
        return (
          <Badge variant="secondary" className={getDocumentTypeColor(type)}>
            {formatDocumentType(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status as string | undefined),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt') as number);
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Modified',
      cell: ({ row }) => {
        const value = row.getValue('updatedAt') as number | undefined;
        const date = value ? new Date(value) : null;
        return (
          <div className="text-sm text-muted-foreground">
            {date ? formatDistanceToNow(date, { addSuffix: true }) : 'Never'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const document = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/editor/${document._id}`);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDocument(document);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: documents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto text-slate-400 mb-4">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No documents found
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          No documents match your current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/editor/${row.original._id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedDocument?.isProjectBrief ? 'Cannot delete project brief' : 'Delete document?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDocument?.isProjectBrief
                ? 'This is a project brief. Delete the project instead to remove this document.'
                : 'This action cannot be undone. This will permanently delete the document and its pages.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={selectedDocument?.isProjectBrief}
              onClick={async () => {
                if (!selectedDocument) return;
                try {
                  await removeDocument({ documentId: selectedDocument._id });
                  toast.success('Document deleted');
                  setDeleteDialogOpen(false);
                  setSelectedDocument(null);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to delete document');
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


