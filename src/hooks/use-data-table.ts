import { useState, useMemo, useCallback } from 'react';

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export interface FilterConfig<T> {
  key: keyof T;
  value: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
}

export interface DataTableState<T> {
  data: T[];
  filteredData: T[];
  sortConfig: SortConfig<T> | null;
  filters: FilterConfig<T>[];
  searchTerm: string;
  currentPage: number;
  pageSize: number;
}

/**
 * useDataTable - Manages table data with sorting, filtering, and pagination
 * 
 * @param data - Array of data items
 * @param initialPageSize - Initial page size (default: 10)
 * @returns Table state management object
 */
export function useDataTable<T extends Record<string, any>>(
  data: T[],
  initialPageSize: number = 10
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [filters, setFilters] = useState<FilterConfig<T>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // Apply search term to all string fields
  const searchFilteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm]);
  
  // Apply custom filters
  const filteredData = useMemo(() => {
    let result = searchFilteredData;
    
    filters.forEach(filter => {
      result = result.filter(item => {
        const value = item[filter.key];
        if (value === undefined || value === null) return false;
        
        const stringValue = String(value).toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return stringValue.includes(filterValue);
          case 'equals':
            return stringValue === filterValue;
          case 'startsWith':
            return stringValue.startsWith(filterValue);
          case 'endsWith':
            return stringValue.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
    
    return result;
  }, [searchFilteredData, filters]);
  
  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);
  
  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);
  
  const totalPages = Math.ceil(sortedData.length / pageSize);
  
  // Actions
  const setSorting = useCallback((key: keyof T) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1); // Reset to first page when sorting
  }, []);
  
  const addFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters(current => [...current.filter(f => f.key !== filter.key), filter]);
    setCurrentPage(1);
  }, []);
  
  const removeFilter = useCallback((key: keyof T) => {
    setFilters(current => current.filter(f => f.key !== key));
    setCurrentPage(1);
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters([]);
    setCurrentPage(1);
  }, []);
  
  const setSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setCurrentPage(current => Math.max(current - 1, 1));
  }, []);
  
  return useMemo(() => ({
    // Data
    data: paginatedData,
    allData: sortedData,
    totalItems: sortedData.length,
    
    // State
    sortConfig,
    filters,
    searchTerm,
    currentPage,
    pageSize,
    totalPages,
    
    // Actions
    setSorting,
    addFilter,
    removeFilter,
    clearFilters,
    setSearch,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage,
  }), [
    paginatedData,
    sortedData,
    sortConfig,
    filters,
    searchTerm,
    currentPage,
    pageSize,
    totalPages,
    setSorting,
    addFilter,
    removeFilter,
    clearFilters,
    setSearch,
    goToPage,
    nextPage,
    prevPage,
  ]);
}
