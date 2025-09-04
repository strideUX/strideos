/**
 * Input - Form input component with consistent styling and accessibility
 *
 * @remarks
 * Provides a styled input field with focus states, validation styling, and accessibility features.
 * Uses Tailwind CSS for consistent design system integration and supports all standard input props.
 *
 * @example
 * ```tsx
 * <Input 
 *   type="text" 
 *   placeholder="Enter your name" 
 *   className="w-full"
 * />
 * <Input 
 *   type="email" 
 *   aria-invalid={true}
 *   placeholder="Enter email address"
 * />
 * ```
 */

// 1. External imports
import React, { memo } from 'react';

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Types
interface InputProps extends React.ComponentProps<"input"> {
  // Inherits all standard input props
}

// 4. Component definition
export const Input = memo(function Input({ 
  className, 
  type, 
  ...props 
}: InputProps) {
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
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
});
