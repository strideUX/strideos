'use client';

import { createReactBlockSpec } from '@blocknote/react';

// Simplified tasks block schema to debug the parse issue
export const tasksBlockSpec = createReactBlockSpec({
  type: 'tasks' as const,
  propSchema: {
    title: {
      default: "Tasks",
    },
  },
  content: 'none',
  group: 'strideOS',
});

// Simplified Tasks block component for debugging
export function TasksBlock({ block, editor }: { 
  block: any; 
  editor: any; 
}) {
  // Simple props parsing
  const title = block?.props?.title || "Tasks";

  // Basic render - no complex logic for now
  if (!block || !block.props) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Error: Invalid tasks block</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-800">{title}</h3>
      <p className="text-blue-600 text-sm">Tasks block is working! ✅</p>
    </div>
  );
}