"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  /** Source URL for the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image */
  width: number;
  /** Height of the image */
  height: number;
  /** CSS classes for styling */
  className?: string;
  /** Whether to show a loading skeleton */
  showSkeleton?: boolean;
  /** Fallback content when image fails to load */
  fallback?: React.ReactNode;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
  /** Image quality (1-100) */
  quality?: number;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Whether to enable lazy loading */
  lazy?: boolean;
}

/**
 * OptimizedImage - Performance-optimized image component with lazy loading
 * 
 * @remarks
 * Provides consistent image optimization across the application with:
 * - Next.js Image optimization
 * - Lazy loading by default
 * - Loading skeletons
 * - Error fallbacks
 * - Proper sizing and quality settings
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/logo.png"
 *   alt="Company Logo"
 *   width={200}
 *   height={100}
 *   className="rounded-lg"
 *   showSkeleton={true}
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  showSkeleton = true,
  fallback,
  priority = false,
  quality = 85,
  objectFit = 'cover',
  lazy = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle loading state
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle error state
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Show fallback if image failed to load
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Show fallback or skeleton if image failed to load
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading skeleton */}
      {showSkeleton && isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      
      {/* Optimized image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{ objectFit }}
        priority={priority}
        quality={quality}
        loading={lazy ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * AvatarImage - Optimized avatar image component
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      showSkeleton={false}
      fallback={
        <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground rounded-full text-sm font-medium">
          {alt.charAt(0).toUpperCase()}
        </div>
      }
    />
  );
}

/**
 * ClientLogo - Optimized client logo component
 */
export function ClientLogo({
  src,
  name,
  size = 32,
  className,
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={cn("rounded-md", className)}
      showSkeleton={false}
      fallback={
        <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground rounded-md text-xs font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
      }
    />
  );
}
