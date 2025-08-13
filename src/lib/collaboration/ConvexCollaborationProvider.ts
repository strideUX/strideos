import type { Id } from '@/convex/_generated/dataModel';
import type { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';

export class ConvexCollaborationProvider {
  private listeners: Array<(update: unknown) => void> = [];
  private unsubscribe: (() => void) | null = null;

  constructor(
    private convex: ConvexReactClient,
    private documentId: Id<'documents'>,
    private sectionId: Id<'documentSections'>
  ) {}

  async sendUpdate(update: unknown): Promise<void> {
    try {
      // Placeholder: apply naive update by patching content directly
      await this.convex.mutation(api.documentSections.updateDocumentSectionContent, {
        sectionId: this.sectionId,
        content: update as any,
      });
    } catch (err) {
      // Swallow errors for now
    }
  }

  onUpdate(callback: (update: unknown) => void): () => void {
    this.listeners.push(callback);

    // Basic subscription: re-fetch section content and emit as update
    if (!this.unsubscribe) {
      // Using Convex React in components is typical; for non-react, skip live subscription
      // Callbacks will be invoked by the host component using existing queries
      this.unsubscribe = () => {
        // no-op placeholder
      };
    }

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
      if (this.listeners.length === 0 && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    };
  }

  emitExternalUpdate(update: unknown) {
    for (const cb of this.listeners) cb(update);
  }
}