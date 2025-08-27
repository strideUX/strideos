/**
 * Textarea - Multi-line text input component with consistent styling
 *
 * @remarks
 * Provides a styled textarea field with focus states, validation styling, and accessibility features.
 * Uses Tailwind CSS for consistent design system integration and supports all standard textarea props.
 *
 * @example
 * ```tsx
 * <Textarea 
 *   placeholder="Enter your description" 
 *   className="w-full"
 *   rows={4}
 * />
 * <Textarea 
 *   aria-invalid={true}
 *   placeholder="Enter feedback"
 * />
 * ```
 */

// 1. External imports
import React, { memo } from 'react';

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Types
interface TextareaProps extends React.ComponentProps<"textarea"> {
  // Inherits all standard textarea props
}

// 4. Component definition
export const Textarea = memo(function Textarea({ 
  className, 
  ...props 
}: TextareaProps) {
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
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
});
