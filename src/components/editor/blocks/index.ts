import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { tasksBlockSpec } from './TasksBlockNew';

// Create extended schema with custom blocks
export const extendedBlockSpecs = {
  ...defaultBlockSpecs,
  tasks: tasksBlockSpec,
} as const;

// Create the extended schema
export const extendedSchema = BlockNoteSchema.create({
  blockSpecs: extendedBlockSpecs,
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

// Export individual blocks
export { tasksBlockSpec } from './TasksBlockNew';