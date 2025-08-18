"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();
  const documents = useQuery(api.documents.list, {}) ?? [];
  const createDocument = useMutation(api.documents.create);
  const createPage = useMutation(api.pages.create);
  
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDocument = async () => {
    try {
      setIsCreating(true);
      const title = prompt("Document title", "Untitled Document") || "Untitled Document";
      const documentId = await createDocument({ title });
      
      // Create first page
      const { docId } = await createPage({ 
        documentId: documentId as any, 
        title: "Untitled" 
      });
      
      // Navigate to the new document editor
      router.push(`/docs/${documentId}?page=${docId}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-2">Manage your collaborative documents</p>
          </div>
          <Button 
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "New Document"}
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Create your first document to get started</p>
            <Button onClick={handleCreateDocument} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc: any) => (
              <div
                key={doc._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/docs/${doc._id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <span className="text-xs text-gray-500">{doc.documentType || "document"}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(doc._creationTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {doc.createdBy}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}