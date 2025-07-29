'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Save,
  Users,
  Building,
  Calendar,
  Target,
  FileText,
  Settings,
  Edit3,
  List
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.id as Id<'projects'>;
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'review' | 'complete' | 'archived'>('draft');
  const [showToc, setShowToc] = useState(true);

  // Fetch project data
  const project = useQuery(api.projects.getProject, { projectId });
  const updateProject = useMutation(api.projects.updateProject);

  // Initialize form data when project loads
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      
      // Convert document content to simple text for now (until Novel.js is working)
      if (project.documentContent) {
        setDocumentContent(extractTextFromDocument(project.documentContent));
      }
    }
  }, [project]);

  const handleSave = async () => {
    if (!project) return;

    try {
      await updateProject({
        projectId: project._id,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        // For now, store as simple text - will enhance with Novel.js later
        documentContent: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: documentContent }]
            }
          ]
        }
      });

      toast.success('Project updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const extractTextFromDocument = (doc: unknown): string => {
    if (!doc || typeof doc !== 'object' || !('content' in doc)) return '';
    
    let text = '';
    const traverse = (content: unknown[]) => {
      content.forEach((node: unknown) => {
        if (typeof node === 'object' && node !== null) {
          if ('type' in node && 'text' in node && node.type === 'text') {
            text += (node as { text: string }).text;
                     } else if ('content' in node && Array.isArray((node as { content: unknown }).content)) {
             traverse((node as { content: unknown[] }).content);
           }
          if ('type' in node && (node.type === 'paragraph' || node.type === 'heading')) {
            text += '\n';
          }
        }
      });
    };
    
    traverse((doc as { content: unknown[] }).content);
    return text.trim();
  };

  if (!user) {
    return null;
  }

  if (!project) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-96 bg-slate-200 rounded"></div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const sections = project.sections || [];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Building className="h-3 w-3" />
                    <span>{project.client?.name}</span>
                    <span>•</span>
                    <span>{project.department?.name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                {isEditing ? 'Save Changes' : 'Edit Project'}
              </Button>
              {isEditing && (
                <Button onClick={handleSave} disabled={!title.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Table of Contents */}
            {showToc && sections.length > 0 && (
              <div className="col-span-3">
                <Card className="sticky top-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Table of Contents</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowToc(false)}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-1">
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            className={`block w-full text-left px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors ${
                              section.level === 1 ? 'font-medium' : 
                              section.level === 2 ? 'ml-2 text-slate-700 dark:text-slate-300' : 
                              'ml-4 text-slate-600 dark:text-slate-400'
                            }`}
                            onClick={() => {
                              const element = document.getElementById(section.anchor);
                              element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            {section.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <div className={showToc && sections.length > 0 ? "col-span-9" : "col-span-12"}>
              <div className="space-y-4">
                {/* Project Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Project Title
                        </label>
                        {isEditing ? (
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter project title"
                          />
                        ) : (
                          <p className="text-sm text-slate-900 dark:text-white">{project.title}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Status
                        </label>
                        {isEditing ? (
                          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="complete">Complete</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description
                      </label>
                      {isEditing ? (
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Project description"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {project.description || 'No description provided'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>PM: {project.projectManager?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-400" />
                        <span>Template: {project.template.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        placeholder="Enter project document content..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="prose max-w-none">
                        {documentContent ? (
                          <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {documentContent}
                          </pre>
                        ) : (
                          <p className="text-slate-500 italic">
                            No content yet. Click &quot;Edit Project&quot; to add content.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

ProjectDetailPage.displayName = 'ProjectDetailPage'; 