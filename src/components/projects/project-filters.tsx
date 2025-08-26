import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';

interface ProjectFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function ProjectFilters({
  searchTerm,
  setSearchTerm,
}: ProjectFiltersProps) {
  return (
    <div className="relative">
      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
      <Input
        placeholder="Search projects by name, client, or status..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  );
}
