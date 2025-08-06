'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

export default function MigratePage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  
  const migrateClientData = useMutation(api.clients.migrateClientData);

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateClientData({});
      setMigrationResult(result);
      toast.success(`Migration completed! Updated ${result.updatedCount} clients.`);
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
            <CardTitle>Client Data Migration</CardTitle>
            <CardDescription>
              Clean up existing client data to match the new simplified schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This will remove old fields (description, industry, size, contactEmail, etc.) 
              from existing client records to match the new simplified schema.
            </p>
            
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
