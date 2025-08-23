"use client";
import { BlockNoteEditor } from '@/components/editor/BlockNoteEditor';

export default function TestSyncPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sync Test Page</h1>
      <p>Testing sync without app infrastructure</p>
      <p>Using existing page docId: mej09qz9-p0znysxj</p>
      <BlockNoteEditor
        docId="mej09qz9-p0znysxj"
        showRemoteCursors={false}
      />
    </div>
  );
}