'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { Authenticated, Unauthenticated } from 'convex/react';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Trash2,
  Edit,
  Eye,
  Building,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { signOut } = useAuthActions();
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<Id<'clients'> | ''>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<Id<'departments'> | ''>('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch data
  const documents = useQuery(api.documents.listDocuments, {});
  const clients = useQuery(api.clients.listClients, {});
  const allDepartments = useQuery(api.departments.listAllDepartments, {});
  
  // Mutations
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const seedDatabase = useMutation(api.seed.seedDatabase);

  // Filter departments by selected client
  const filteredDepartments = allDepartments?.filter((dept: any) => 
    selectedClientId ? dept.clientId === selectedClientId : true
  ) || [];

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId as Id<'clients'>);
    setSelectedDepartmentId(''); // Reset department when client changes
  };

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase();
      toast.success('Database seeded with sample data!');
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Failed to seed database. Make sure you are an admin.');
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    if (!selectedDepartmentId) {
      toast.error('Please select a department');
      return;
    }

    setIsCreating(true);
    try {
      await createDocument({
        title: newDocTitle.trim(),
        clientId: selectedClientId,
        departmentId: selectedDepartmentId,
        documentType: 'project_brief',
        content: { type: 'doc', content: [] },
      });
      
      // Reset form
      setNewDocTitle('');
      setSelectedClientId('');
      setSelectedDepartmentId('');
      
      toast.success('Document created successfully');
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (documentId: Id<'documents'>) => {
    try {
      await deleteDocument({ documentId });
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getClientName = (clientId: Id<'clients'>) => {
    return clients?.find(c => c._id === clientId)?.name || 'Unknown Client';
  };

  const getDepartmentName = (departmentId: Id<'departments'>) => {
    return allDepartments?.find((d: any) => d._id === departmentId)?.name || 'Unknown Department';
  };

  const isLoading = documents === undefined || clients === undefined || allDepartments === undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-600 mt-2">Manage your project documents</p>
            </div>
            <div className="flex items-center gap-2">
              {(!clients || clients.length === 0) && (
                <Button onClick={handleSeedDatabase} variant="outline">
                  Seed Database
                </Button>
              )}
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Create Document Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Document
              </CardTitle>
              <CardDescription>
                Start a new project document with the Novel.js editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Document Title */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Document Title
                  </label>
                  <Input
                    placeholder="Enter document title..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateDocument()}
                  />
                </div>

                {/* Client and Department Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Client
                    </label>
                    <Select value={selectedClientId} onValueChange={handleClientChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {client.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Department
                    </label>
                    <Select 
                      value={selectedDepartmentId} 
                      onValueChange={(value) => setSelectedDepartmentId(value as Id<'departments'>)}
                      disabled={!selectedClientId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                                                 {filteredDepartments.map((department: any) => (
                          <SelectItem key={department._id} value={department._id}>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              {department.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Create Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreateDocument}
                    disabled={isCreating || !newDocTitle.trim() || !selectedClientId || !selectedDepartmentId}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreating ? 'Creating...' : 'Create Document'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-600">Create your first document to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents.map((document) => (
                  <Card key={document._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {document.title}
                            </h3>
                            <div className="flex gap-2">
                              <Badge variant={document.status === 'active' ? 'default' : 'secondary'}>
                                {document.status}
                              </Badge>
                              <Badge variant="outline">
                                {document.documentType.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {getClientName(document.clientId)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {getDepartmentName(document.departmentId)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Created: {formatDate(document.createdAt)}
                            </div>
                            {document.creator && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                By: {document.creator.name}
                              </div>
                            )}
                            <div>Version {document.version}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => toast.info('Editor integration coming next!')}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => toast.info('Editor integration coming next!')}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDeleteDocument(document._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please sign in to access documents</p>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
    </div>
  );
} 