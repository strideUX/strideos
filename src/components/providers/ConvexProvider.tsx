'use client';

import { ConvexProvider as ConvexProviderBase, ConvexReactClient } from 'convex/react';

// Create a Convex client
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

// Validate that the Convex URL is set
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables.'
  );
}

interface ConvexProviderProps {
  children: React.ReactNode;
}

export function ConvexProvider({ children }: ConvexProviderProps) {
  return (
    <ConvexProviderBase client={convex}>
      {children}
    </ConvexProviderBase>
  );
} 