import { toast as sonnerToast } from "sonner";

// This hook provides compatibility with shadcn/ui components that expect useToast
// while using sonner as the underlying toast system

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export const useToast = () => {
  const toast = ({ title, description, variant = "default", duration, ...props }: ToastProps) => {
    const message = title && description ? `${title}: ${description}` : title || description || "";
    
    if (variant === "destructive") {
      return sonnerToast.error(message, { duration });
    }
    
    return sonnerToast(message, { duration });
  };

  return { toast };
};

// Export individual toast functions for convenience
export const toast = {
  success: (message: string, options?: { duration?: number }) => 
    sonnerToast.success(message, options),
  error: (message: string, options?: { duration?: number }) => 
    sonnerToast.error(message, options),
  info: (message: string, options?: { duration?: number }) => 
    sonnerToast.info(message, options),
  warning: (message: string, options?: { duration?: number }) => 
    sonnerToast.warning(message, options),
  default: (message: string, options?: { duration?: number }) => 
    sonnerToast(message, options),
};