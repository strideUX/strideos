import { Skeleton } from "@/components/ui/skeleton";

export default function MyWorkLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        
        {/* Task columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, columnIndex) => (
            <div key={columnIndex} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, taskIndex) => (
                  <div key={taskIndex} className="border rounded-lg p-3 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}