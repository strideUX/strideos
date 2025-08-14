import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';

// Y-sweet compatible schema - only standard blocks
export const collaborativeSchema = BlockNoteSchema.create({
	blockSpecs: defaultBlockSpecs,
	inlineContentSpecs: defaultInlineContentSpecs,
	styleSpecs: defaultStyleSpecs,
});

// Type for collaborative editor content
// Note: We intentionally avoid exporting a narrow block type here to keep
// compatibility with various BlockNote versions.


