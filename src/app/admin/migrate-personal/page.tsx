'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

export default function MigratePersonalPage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  
  const convertPersonalToStride = useMutation(api.clients.convertPersonalToStride);

  const handleMigration = async () => {
    if (!confirm('This will convert the "Personal" client to "Stride" and mark it as internal. Continue?')) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await convertPersonalToStride({});
      setMigrationResult(result);
      if (result.success) {
        toast.success('Migration completed! Personal client converted to Stride.');
      } else {
        toast.error(result.message || 'Migration failed.');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed. Check console for details.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Convert Personal to Stride</CardTitle>
            <CardDescription>
              Convert the existing "Personal" client to "Stride" and mark it as an internal organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This migration will:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Find the existing "Personal" client</li>
              <li>Rename it to "Stride"</li>
              <li>Mark it as internal (isInternal: true)</li>
              <li>Update the timestamp</li>
            </ul>
            
            <Button 
              onClick={handleMigration} 
              disabled={isMigrating}
              className="w-full"
            >
              {isMigrating ? 'Migrating...' : 'Run Migration'}
            </Button>

            {migrationResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Migration Results:</h3>
                <pre className="text-sm">
                  {JSON.stringify(migrationResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
