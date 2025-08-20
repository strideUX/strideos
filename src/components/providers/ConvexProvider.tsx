'use client';

import { ReactNode, useMemo, type ReactElement } from 'react';
import { ConvexProvider as ConvexClientProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';

export function ConvexProvider({ children }: { children: ReactNode }): ReactElement {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3210';
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return (
    <ConvexAuthProvider client={client}>
      <ConvexClientProvider client={client}>{children}</ConvexClientProvider>
    </ConvexAuthProvider>
  );
}