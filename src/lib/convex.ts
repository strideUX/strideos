import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Create a Convex client
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

// Validate that the Convex URL is set
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    'NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables.'
  );
}

// Export the ConvexProvider for use in the app
export { ConvexProvider }; 