import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-sidebar">
        <div className="p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2 p-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1">
        {/* Header skeleton */}
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        
        {/* Content area skeleton */}
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-64" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}