import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { simpleTestBlockSpec } from './SimpleTestBlock';

// Create extended schema with custom blocks - TEMPORARILY using simple test block
export const extendedBlockSpecs = {
  ...defaultBlockSpecs,
  simpletest: simpleTestBlockSpec,
} as const;

// Create the extended schema
export const extendedSchema = BlockNoteSchema.create({
  blockSpecs: extendedBlockSpecs,
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

// Export individual blocks
export { simpleTestBlockSpec } from './SimpleTestBlock';