'use client';

import { useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { YDocProvider, useYDoc, useYjsProvider } from '@y-sweet/react';

export interface CollaborativeEditorProps {
  docId: string;
  user: { name: string; color: string };
  className?: string;
  authEndpoint?: string;
  headerSlot?: React.ReactNode;
}

export function CollaborativeEditorInner({ user, headerSlot }: { user: { name: string; color: string }; headerSlot?: React.ReactNode }) {
  const provider = useYjsProvider();
  const doc = useYDoc();

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('blocknote'),
      user,
    },
  });

  return (
    <div className="space-y-2">
      {headerSlot}
      <BlockNoteView editor={editor} />
    </div>
  );
}

export function CollaborativeEditor({ docId, user, className, authEndpoint, headerSlot }: CollaborativeEditorProps) {
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
        <CollaborativeEditorInner user={user} headerSlot={headerSlot} />
      </YDocProvider>
    </div>
  );
}
