import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * useDialogState - Manages dialog open/close state with proper cleanup
 * 
 * @param initialState - Initial open state (default: false)
 * @returns Dialog state management object
 */
export function useDialogState(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  // Reset state when component unmounts
  useEffect(() => {
    return () => setIsOpen(false);
  }, []);
  
  return useMemo(() => ({
    isOpen,
    open,
    close,
    toggle,
    onOpenChange: setIsOpen,
  }), [isOpen, open, close, toggle]);
}
