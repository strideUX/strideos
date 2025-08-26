import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { tasksBlockSpec } from './tasks-block-new';
import { projectInfoBlockSpec } from './project-info-block';

// Create extended schema with custom blocks
export const extendedBlockSpecs = {
  ...defaultBlockSpecs,
  tasks: tasksBlockSpec,
  projectInfo: projectInfoBlockSpec,
} as const;

// Create the extended schema
export const extendedSchema = BlockNoteSchema.create({
  blockSpecs: extendedBlockSpecs,
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: defaultStyleSpecs,
});

// Export individual blocks
export { tasksBlockSpec } from './tasks-block-new';
export { projectInfoBlockSpec } from './project-info-block';