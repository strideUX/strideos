'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DebugCommentsPage() {
  const { user } = useAuth();
  
  const testResult = useQuery(api.comments.testCommentSystem);

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Comments</h1>
        <p>Please sign in to view debug information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Comments System</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {testResult ? (
            <div className="space-y-4">
              <div>
                <strong>Total Comments:</strong> {testResult.totalComments}
              </div>
              <div>
                <strong>Total Documents:</strong> {testResult.totalDocuments}
              </div>
              
              <div>
                <strong>Comments:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult.comments, null, 2)}
                </pre>
              </div>
              
              <div>
                <strong>Documents:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult.documents, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>
      
      <Button onClick={() => window.location.href = '/editor-demo'}>
        Go to Editor Demo
      </Button>
    </div>
  );
} 