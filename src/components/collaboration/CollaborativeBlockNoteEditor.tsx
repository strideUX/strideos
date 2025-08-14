'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Block } from '@blocknote/core';
import { YDocProvider, useYDoc, useYjsProvider } from '@y-sweet/react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { useTheme } from 'next-themes';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useHybridSync } from '@/hooks/useHybridSync';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { collaborativeSchema } from './collaborativeSchema';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';

interface CollaborativeBlockNoteEditorProps {
	docId: string;
	sectionId: string;
	convexSectionId: Id<'documentSections'>;
	documentId: Id<'documents'>;
	initialContent?: Block[];
	onChange?: (content: Block[]) => void;
	editable?: boolean;
	className?: string;
	user: {
		id: string;
		name: string;
		displayName?: string;
		color: string;
		image?: string;
	};
}

function CollaborativeEditorInner({
	sectionId,
	convexSectionId,
	documentId,
	initialContent = [],
	onChange,
	editable = true,
	className,
	user
}: Omit<CollaborativeBlockNoteEditorProps, 'docId'>) {
	const provider = useYjsProvider();
	const doc = useYDoc();
	const { theme } = useTheme();
	
	// Debug logging
	useEffect(() => {
		console.log('CollaborativeEditor initialized:', {
			provider: !!provider,
			doc: !!doc,
			user: user.name,
			sectionId,
		});
	}, [provider, doc, user.name, sectionId]);

	// Load existing content from Convex
	const existingContent = useQuery(api.documentSections.getDocumentSection,
		{ sectionId: convexSectionId }
	);

  const initialBlocks = useMemo(() => {
    if (Array.isArray(existingContent?.content) && existingContent.content.length > 0) {
      return existingContent.content;
    }
    return initialContent.length > 0 ? initialContent : [{ type: 'paragraph', content: [] }];
  }, [existingContent?.content, initialContent]);

  // Process content: Remove custom blocks for Y-sweet, keep text blocks
  const processedInitialBlocks = useMemo(() => {
    const standardBlockTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem', 'table', 'image', 'video', 'audio', 'file', 'codeBlock'];
    const source = Array.isArray(initialBlocks) ? initialBlocks : [{ type: 'paragraph', content: [] } as any];
    return source.filter((block: any) => standardBlockTypes.includes(block.type));
  }, [initialBlocks]);

	const [connectionStatus, actions] = useConnectionStatus({ provider });

  // Create editor with Y-sweet collaboration - STANDARD BLOCKS ONLY
  const editor = useCreateBlockNote({
    initialContent: processedInitialBlocks as any,
    collaboration: provider ? {
      provider,
      fragment: (doc as any).getXmlFragment('blocknote'),
      user: {
        name: user.displayName || user.name,
        color: user.color,
      },
    } : undefined,
    schema: collaborativeSchema,
  });

	// Load content when available (graceful degradation)
	const hasLoadedContent = useRef(false);
	useEffect(() => {
		if (!editor || !existingContent?.content || hasLoadedContent.current) return;

		const currentBlocks = editor.document;
		const newBlocks = existingContent.content as Block[];

		const isCurrentEmpty = currentBlocks.length === 1 &&
			(currentBlocks[0] as any).type === 'paragraph' &&
			(!(currentBlocks[0] as any).content || (currentBlocks[0] as any).content.length === 0);

		if (isCurrentEmpty && newBlocks.length > 0) {
			editor.replaceBlocks(editor.document, newBlocks as any);
			hasLoadedContent.current = true;
		}
	}, [editor, existingContent?.content]);

  // Handle editor changes - only sync standard blocks
  useEffect(() => {
    if (!editor || !onChange) return;
    const handleChange = () => {
      const standardBlockTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem', 'table', 'image', 'video', 'audio', 'file', 'codeBlock'];
      const currentBlocks = (editor as any).document as any[];
      const standardBlocks = currentBlocks.filter(block => standardBlockTypes.includes(block.type));
      onChange(standardBlocks as unknown as Block[]);
    };
    (editor as any).onChange(handleChange);
  }, [editor, onChange]);

	// Hybrid sync
	const editorRef = useRef(editor);
	editorRef.current = editor;

	useHybridSync({
		yDoc: doc as any,
		documentId: documentId as unknown as string,
		sectionId: convexSectionId as unknown as string,
		connectionStatus,
		getCurrentContent: () => (editorRef.current as any)?.document || initialBlocks,
    enableConvexBackup: false,
		enableLocalBuffer: true,
		onConvexSynced: () => actions.markConvexSynced(),
	});

	// Update Convex connection state
	useEffect(() => {
		if (existingContent === undefined) {
			actions.setConvexState('connecting');
		} else {
			actions.setConvexState('connected');
		}
	}, [existingContent, actions]);

	return (
		<BlockNoteView
			editor={editor as any}
			editable={editable}
			className={className}
			theme={theme === 'dark' ? 'dark' : 'light'}
		/>
	);
}

export function CollaborativeBlockNoteEditor(props: CollaborativeBlockNoteEditorProps) {
	const endpoint = process.env.NEXT_PUBLIC_Y_SWEET_ENDPOINT || 'https://demos.y-sweet.dev/api/auth';
	
	console.log('CollaborativeBlockNoteEditor mounting:', {
		docId: props.docId,
		endpoint,
		user: props.user.name,
	});

	return (
		<YDocProvider docId={props.docId} authEndpoint={endpoint}>
			<CollaborativeEditorInner {...props} />
		</YDocProvider>
	);
}
