/**
 * DocumentsDataTable - Comprehensive documents management table
 *
 * @remarks
 * Displays a data table of documents with sorting, filtering, and management
 * capabilities. Integrates with Convex for real-time document operations and
 * provides comprehensive document metadata display.
 *
 * @example
 * ```tsx
 * <DocumentsDataTable documents={projectDocuments} />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// 2. Internal imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

// 3. Types
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

interface DocumentsDataTableProps {
  /** Array of documents to display in the table */
  documents: DocumentRow[];
}

interface DocumentTypeConfig {
  color: string;
  label: string;
}

interface StatusConfig {
  color: string;
  label: string;
}

// 4. Component definition
export const DocumentsDataTable = memo(function DocumentsDataTable({ 
  documents 
}: DocumentsDataTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const router = useRouter();
  const removeDocument = useMutation(api.documents.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const documentTypeConfigs = useMemo((): Record<string, DocumentTypeConfig> => ({
    project_brief: { color: 'bg-blue-100 text-blue-800', label: 'Project Brief' },
    meeting_notes: { color: 'bg-green-100 text-green-800', label: 'Meeting Notes' },
    wiki_article: { color: 'bg-purple-100 text-purple-800', label: 'Wiki Article' },
    resource_doc: { color: 'bg-orange-100 text-orange-800', label: 'Resource Doc' },
    blank: { color: 'bg-gray-100 text-gray-800', label: 'Blank' },
  }), []);

  const statusConfigs = useMemo((): Record<string, StatusConfig> => ({
    draft: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Draft' },
    published: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Published' },
    archived: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Archived' },
  }), []);

  const tableData = useMemo(() => documents, [documents]);

  const isDeleteDialogOpen = useMemo(() => {
    return Boolean(deleteDialogOpen && selectedDocument);
  }, [deleteDialogOpen, selectedDocument]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getDocumentTypeColor = useCallback((type?: string): string => {
    const config = documentTypeConfigs[type || ''] || documentTypeConfigs.blank;
    return config.color;
  }, [documentTypeConfigs]);

  const formatDocumentType = useCallback((type?: string): string => {
    const config = documentTypeConfigs[type || ''] || documentTypeConfigs.blank;
    return config.label;
  }, [documentTypeConfigs]);

  const getStatusBadge = useCallback((status?: string) => {
    const s = (status || 'draft').toLowerCase();
    const config = statusConfigs[s] || statusConfigs.draft;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  }, [statusConfigs]);

  const handleEditDocument = useCallback((documentId: string) => {
    router.push(`/editor/${documentId}`);
  }, [router]);

  const handleViewDocument = useCallback((documentId: string) => {
    router.push(`/editor/${documentId}`);
  }, [router]);

  const handleDeleteClick = useCallback((document: DocumentRow) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      await removeDocument({ id: selectedDocument._id });
      toast.success('Document deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
    }
  }, [selectedDocument, removeDocument]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
  }, []);

  const formatDate = useCallback((timestamp: number): string => {
    return formatDistanceToNow(timestamp) + ' ago';
  }, []);

  const renderActions = useCallback((document: DocumentRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleViewDocument(document._id)}>
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditDocument(document._id)}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDeleteClick(document)}
          className="text-red-600"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ), [handleViewDocument, handleEditDocument, handleDeleteClick]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No documents found</p>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
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
          <div className="text-sm text-muted-foreground">
            {author?.name || author?.email || '—'}
          </div>
        );
      },
    },
    {
      accessorKey: 'documentType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('documentType') as string;
        return (
          <Badge className={getDocumentTypeColor(type)}>
            {formatDocumentType(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const timestamp = row.getValue('createdAt') as number;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(timestamp)}
          </div>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => {
        const timestamp = row.original.updatedAt;
        return (
          <div className="text-sm text-muted-foreground">
            {timestamp ? formatDate(timestamp) : '—'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => renderActions(row.original),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              &quot;{selectedDocument?.title}&quot; and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});


