'use client';

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

interface DocumentsDataTableProps {
  documents: DocumentRow[];
}

export function DocumentsDataTable({ documents }: DocumentsDataTableProps) {
  const router = useRouter();

  const columns: ColumnDef<DocumentRow>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
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
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/editor/${document._id}`)}>
                Edit
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
      <div className="rounded-md border">
        <div className="flex h-24 items-center justify-center text-muted-foreground">
          No documents found.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
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
              className="hover:bg-muted/50 cursor-pointer"
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
  );
}


