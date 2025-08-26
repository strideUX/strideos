import { useState, useCallback, useMemo } from 'react';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: File[];
}

export interface UploadOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
  onProgress?: (progress: number) => void;
  onSuccess?: (files: File[]) => void;
  onError?: (error: string) => void;
}

/**
 * useFileUpload - Manages file upload state and operations
 * 
 * @param options - Upload configuration options
 * @returns File upload state and methods
 */
export function useFileUpload(options: UploadOptions = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    maxFiles = 1,
    onProgress,
    onSuccess,
    onError,
  } = options;
  
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: [],
  });
  
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
    }
    
    // Check file type if restrictions are set
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    
    return null;
  }, [maxFileSize, allowedTypes]);
  
  const validateFiles = useCallback((files: File[]): string | null => {
    // Check number of files
    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`;
    }
    
    // Validate each file
    for (const file of files) {
      const error = validateFile(file);
      if (error) return error;
    }
    
    return null;
  }, [maxFiles, validateFile]);
  
  const uploadFiles = useCallback(async (files: File[]) => {
    // Validate files first
    const validationError = validateFiles(files);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      onError?.(validationError);
      return;
    }
    
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
    }));
    
    try {
      // Simulate upload progress (replace with actual upload logic)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setState(prev => ({ ...prev, progress: i }));
        onProgress?.(i);
      }
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...files],
      }));
      
      onSuccess?.(files);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  }, [validateFiles, onProgress, onSuccess, onError]);
  
  const removeFile = useCallback((fileToRemove: File) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(file => file !== fileToRemove),
    }));
  }, []);
  
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadedFiles: [],
      error: null,
    }));
  }, []);
  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFiles: [],
    });
  }, []);
  
  return useMemo(() => ({
    // State
    ...state,
    
    // Computed values
    hasFiles: state.uploadedFiles.length > 0,
    totalFileSize: state.uploadedFiles.reduce((sum, file) => sum + file.size, 0),
    
    // Actions
    uploadFiles,
    removeFile,
    clearFiles,
    clearError,
    reset,
    validateFile,
    validateFiles,
  }), [
    state,
    uploadFiles,
    removeFile,
    clearFiles,
    clearError,
    reset,
    validateFile,
    validateFiles,
  ]);
}
