import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { simpleTestBlockSpec } from './SimpleTestBlock';
import { tasksBlockSpec } from './TasksBlockNew';

// Create extended schema with custom blocks
export const extendedBlockSpecs = {
  ...defaultBlockSpecs,
  simpletest: simpleTestBlockSpec,
  tasks: tasksBlockSpec,
} as const;

// Create the extended schema
export const extendedSchema = BlockNoteSchema.create({
  blockSpecs: extendedBlockSpecs,
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

// Export individual blocks
export { simpleTestBlockSpec } from './SimpleTestBlock';
export { tasksBlockSpec } from './TasksBlockNew';