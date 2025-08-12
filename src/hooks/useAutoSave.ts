import { useCallback, useRef, useEffect } from 'react';

interface UseAutoSaveOptions<T> {
  onSave: (content: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ 
  onSave, 
  debounceMs = 3000, 
  enabled = true 
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  const triggerSave = useCallback(async (content: T) => {
    if (!enabled || isSavingRef.current) return;

    // Compare content to prevent unnecessary saves
    const contentChanged = JSON.stringify(content) !== JSON.stringify(lastContentRef.current);
    
    if (!contentChanged) return;

    try {
      isSavingRef.current = true;
      await onSave(content);
      lastContentRef.current = content;
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, enabled]);

  const scheduleSave = useCallback((content: T) => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      triggerSave(content);
    }, debounceMs);
  }, [triggerSave, debounceMs, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleSave,
    triggerSave,
    isSaving: isSavingRef.current,
  };
} 