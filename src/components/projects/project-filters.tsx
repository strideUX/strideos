/**
 * ProjectFilters - Search and filtering interface for project management
 *
 * @remarks
 * Provides a search input field for filtering projects by name, client, or status.
 * Integrates with project management workflow for dynamic filtering and search functionality.
 *
 * @example
 * ```tsx
 * <ProjectFilters
 *   searchTerm={searchQuery}
 *   setSearchTerm={setSearchQuery}
 * />
 * ```
 */

// 1. External imports
import React, { useCallback, memo } from 'react';
import { IconSearch } from '@tabler/icons-react';

// 2. Internal imports
import { Input } from '@/components/ui/input';

// 3. Types
interface ProjectFiltersProps {
  /** Current search term value */
  searchTerm: string;
  /** Callback for updating search term */
  setSearchTerm: (term: string) => void;
}

// 4. Component definition
export const ProjectFilters = memo(function ProjectFilters({
  searchTerm,
  setSearchTerm,
}: ProjectFiltersProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="relative">
      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
      <Input
        placeholder="Search projects by name, client, or status..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="pl-10 w-full"
      />
    </div>
  );
});
