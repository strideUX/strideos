'use client';

import { useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';
import { useTheme } from 'next-themes';
import { YDocProvider, useYDoc, useYjsProvider } from '@y-sweet/react';
import { useHybridSync } from '@/hooks/useHybridSync';
import { NetworkDemo } from './network-demo';
import { PresenceList } from './presence-list';

export interface CollaborativeEditorProps {
  docId: string;
  user: { name: string; color: string };
  className?: string;
  authEndpoint?: string;
  headerSlot?: React.ReactNode;
  readOnly?: boolean;
  documentId?: string;
  sectionId?: string;
}

export function CollaborativeEditorInner({ user, headerSlot, readOnly, documentId, sectionId }: { user: { name: string; color: string }; headerSlot?: React.ReactNode; readOnly?: boolean; documentId?: string; sectionId?: string }) {
  const provider = useYjsProvider();
  const doc = useYDoc();
  const { theme } = useTheme();

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('blocknote'),
      user,
    },
  });

  // Non-destructive hybrid sync foundation (logging only)
  useHybridSync(doc, documentId, sectionId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NetworkDemo />
          <PresenceList />
        </div>
        {headerSlot}
      </div>
      <BlockNoteView
        editor={editor}
        editable={readOnly ? false : true}
        className="bn-editor"
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}

export function CollaborativeEditor({ docId, user, className, authEndpoint, headerSlot, readOnly, documentId, sectionId }: CollaborativeEditorProps) {
  const endpoint = useMemo(() => {
    if (authEndpoint) return authEndpoint;
    if (process.env.NODE_ENV === 'development') {
      return 'https://demos.y-sweet.dev/api/auth';
    }
    if (process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT) {
      return process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT as string;
    }
    return 'https://demos.y-sweet.dev/api/auth';
  }, [authEndpoint]);

  return (
    <div className={className}>
      <YDocProvider docId={docId} authEndpoint={endpoint}>
        <CollaborativeEditorInner user={user} headerSlot={headerSlot} readOnly={readOnly} documentId={documentId} sectionId={sectionId} />
      </YDocProvider>
    </div>
  );
}
