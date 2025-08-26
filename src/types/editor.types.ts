/**
 * Editor-related type definitions
 * 
 * @remarks
 * Types for the BlockNote editor, sync functionality, and document management.
 * These types are critical for the editor functionality that must be preserved.
 */

import type { Id } from '@/convex/_generated/dataModel';

/** Document page structure for editor */
export interface DocumentPage {
  _id: Id<'documentPages'>;
  _creationTime: number;
  title: string;
  documentId: Id<'documents'>;
  docId: string; // ProseMirror document ID
  order: number;
  parentPageId?: Id<'documentPages'>;
  icon?: string;
  createdAt: number;
}

/** Document structure */
export interface Document {
  _id: Id<'documents'>;
  _creationTime: number;
  title: string;
  status: DocumentStatus;
  documentType: DocumentType;
  projectId?: Id<'projects'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  createdBy?: Id<'users'>;
  createdAt: number;
  updatedAt: number;
  modifiedBy?: Id<'users'>;
  modifiedAt: number;
  metadata?: DocumentMetadata;
}

/** Document status enumeration */
export type DocumentStatus = 'draft' | 'published' | 'archived';

/** Document type enumeration */
export type DocumentType = 
  | 'project_brief' 
  | 'meeting_notes' 
  | 'wiki_article' 
  | 'resource_doc' 
  | 'retrospective' 
  | 'blank';

/** Document metadata */
export interface DocumentMetadata {
  projectId?: Id<'projects'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  tags?: string[];
  category?: string;
}

/** Save status for editor */
export type SaveStatus = 'ready' | 'saving' | 'saved' | 'error';

/** Comment thread structure */
export interface CommentThread {
  id: string;
  docId?: string;
  blockId?: string;
  taskId?: Id<'tasks'>;
  entityType: CommentEntityType;
  createdAt: number;
  resolved: boolean;
  creatorId: Id<'users'>;
}

/** Comment entity type */
export type CommentEntityType = 'document_block' | 'task';

/** Individual comment */
export interface Comment {
  _id: Id<'comments'>;
  docId?: string;
  blockId?: string;
  taskId?: Id<'tasks'>;
  entityType: CommentEntityType;
  threadId: string;
  content: string;
  authorId: Id<'users'>;
  mentions: CommentMention[];
  createdAt: number;
  updatedAt: number;
  parentCommentId?: Id<'comments'>;
  resolved?: boolean;
}

/** Comment mention structure */
export interface CommentMention {
  userId: string;
  position: number;
  length: number;
}

/** Presence information for collaborative editing */
export interface UserPresence {
  userId: string;
  docId: string;
  cursor: string;
  name: string;
  color: string;
  lastSeen: number;
}

/** Manual save data structure */
export interface ManualSave {
  _id: Id<'manualSaves'>;
  docId: string;
  content: string;
  savedAt: number;
  userId: Id<'users'>;
}

/** Type guard for checking if a value is a Document */
export function isDocument(value: unknown): value is Document {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'title' in value &&
    'status' in value
  );
}

/** Type guard for checking if a value is a DocumentPage */
export function isDocumentPage(value: unknown): value is DocumentPage {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    'title' in value &&
    'docId' in value &&
    'documentId' in value
  );
}