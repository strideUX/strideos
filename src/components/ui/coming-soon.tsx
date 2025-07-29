'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTool } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
  title: string;
  description?: string;
  expectedFeature?: string;
  showBackButton?: boolean;
}

export function ComingSoon({ 
  title, 
  description, 
  expectedFeature, 
  showBackButton = true 
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <IconTool className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            {description || 'This feature is currently under development and will be available soon.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {expectedFeature && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Expected in:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {expectedFeature}
              </p>
            </div>
          )}
          
          <div className="text-xs text-slate-500 dark:text-slate-400">
            We&apos;re working hard to bring you this feature. Check back soon!
          </div>

          {showBackButton && (
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full"
            >
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 