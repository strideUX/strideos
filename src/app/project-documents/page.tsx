'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus,
  FileText,
  Search,
  Filter,
  Calendar,
  Users,
  Building,
  ArrowRight,
  Edit3,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Id<'clients'> | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<Id<'departments'> | 'all'>('all');
  const [documentType, setDocumentType] = useState<string>('all');

  // Fetch data
  const documents = useQuery(api.documents.listDocuments, {
    clientId: selectedClient === 'all' ? undefined : selectedClient,
    departmentId: selectedDepartment === 'all' ? undefined : selectedDepartment,
  });
  
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listAllDepartments, {});
  const createDocument = useMutation(api.documents.createDocument);

  // Filter documents based on search term and document type
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = documentType === 'all' || doc.documentType === documentType;
    return matchesSearch && matchesType;
  }) || [];

  const handleCreateDocument = async () => {
    if (!user) return;

    try {
      const documentId = await createDocument({
        title: 'New Project Document',
        clientId: selectedClient === 'all' ? (clients?.[0]?._id || 'unassigned' as Id<'clients'>) : (selectedClient as Id<'clients'>),
        departmentId: selectedDepartment === 'all' ? (departments?.[0]?._id || 'unassigned' as Id<'departments'>) : (selectedDepartment as Id<'departments'>),
        documentType: 'project_brief',
      });

      toast.success('Document created successfully');
      router.push(`/editor/${documentId}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'project_brief': return <FileText className="h-4 w-4" />;
      case 'meeting_notes': return <Calendar className="h-4 w-4" />;
      case 'wiki_article': return <FileText className="h-4 w-4" />;
      case 'resource_doc': return <FileText className="h-4 w-4" />;
      case 'retrospective': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Project Documents</h1>
                  <p className="text-muted-foreground">
                    Access all project documentation, specifications, and deliverables.
                  </p>
                </div>
                <Button onClick={handleCreateDocument} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Document
                </Button>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Client Filter */}
                    <Select value={selectedClient} onValueChange={(value) => setSelectedClient(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients?.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Department Filter */}
                    <Select value={selectedDepartment} onValueChange={(value) => setSelectedDepartment(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Document Type Filter */}
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="project_brief">Project Brief</SelectItem>
                        <SelectItem value="meeting_notes">Meeting Notes</SelectItem>
                        <SelectItem value="wiki_article">Wiki Article</SelectItem>
                        <SelectItem value="resource_doc">Resource Doc</SelectItem>
                        <SelectItem value="retrospective">Retrospective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document) => (
                  <Card key={document._id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getDocumentTypeIcon(document.documentType)}
                          <div>
                            <CardTitle className="text-lg">{document.title}</CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                              {document.documentType.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span>Client: {clients?.find(c => c._id === document.clientId)?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Department: {departments?.find(d => d._id === document.departmentId)?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Updated: {new Date(document.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => router.push(`/editor/${document._id}`)}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => router.push(`/editor/${document._id}`)}
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Button>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredDocuments.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedClient !== 'all' || selectedDepartment !== 'all' || documentType !== 'all'
                        ? 'Try adjusting your filters to see more documents.'
                        : 'Get started by creating your first project document.'}
                    </p>
                    <Button onClick={handleCreateDocument} className="flex items-center gap-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      Create Document
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 