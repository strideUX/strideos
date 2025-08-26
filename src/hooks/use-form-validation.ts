import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => string | null;
  required?: boolean;
}

export interface FormValidationState<T> {
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  hasErrors: boolean;
}

/**
 * useFormValidation - Manages form validation state and error handling
 * 
 * @param rules - Array of validation rules for form fields
 * @returns Form validation state and methods
 */
export function useFormValidation<T extends Record<string, any>>(rules: ValidationRule<T>[]) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;
    
    if (rule.required && (!value || value === '')) {
      return `${String(field)} is required`;
    }
    
    if (value !== undefined && value !== '') {
      return rule.validator(value);
    }
    
    return null;
  }, [rules]);
  
  const validateForm = useCallback((data: T): Partial<Record<keyof T, string>> => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    rules.forEach(rule => {
      const error = validateField(rule.field, data[rule.field]);
      if (error) {
        newErrors[rule.field] = error;
      }
    });
    
    setErrors(newErrors);
    return newErrors;
  }, [rules, validateField]);
  
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);
  
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);
  
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  
  return useMemo(() => ({
    errors,
    isValid,
    hasErrors,
    isSubmitting,
    setIsSubmitting,
    validateField,
    validateForm,
    clearErrors,
    setFieldError,
    clearFieldError,
  }), [
    errors,
    isValid,
    hasErrors,
    isSubmitting,
    validateField,
    validateForm,
    clearErrors,
    setFieldError,
    clearFieldError,
  ]);
}
