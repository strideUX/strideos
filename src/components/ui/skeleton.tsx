/**
 * Skeleton - Loading placeholder component with pulse animation
 *
 * @remarks
 * Provides a simple loading skeleton with customizable styling.
 * Uses Tailwind CSS classes for consistent design system integration.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-20 w-full" />
 * <Skeleton className="h-4 w-32" />
 * ```
 */

// 1. External imports
import React, { memo } from 'react';

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Types
interface SkeletonProps extends React.ComponentProps<"div"> {
  // Inherits all standard div props
}

// 4. Component definition
export const Skeleton = memo(function Skeleton({ 
  className, 
  ...props 
}: SkeletonProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No computations needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
});
