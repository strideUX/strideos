/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addSlugs from "../addSlugs.js";
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as comments from "../comments.js";
import type * as departments from "../departments.js";
import type * as documentSyncApi from "../documentSyncApi.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as fixProjectSlugs from "../fixProjectSlugs.js";
import type * as http from "../http.js";
import type * as legacy_legacyComments from "../legacy/legacyComments.js";
import type * as legacy_legacyDocumentSections from "../legacy/legacyDocumentSections.js";
import type * as legacy_legacyDocumentTemplates from "../legacy/legacyDocumentTemplates.js";
import type * as legacy_legacyDocuments from "../legacy/legacyDocuments.js";
import type * as manualSaves from "../manualSaves.js";
import type * as migrateToClientKeys from "../migrateToClientKeys.js";
import type * as migrations_addSlugs from "../migrations/addSlugs.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as pages from "../pages.js";
import type * as presence from "../presence.js";
import type * as projectKeys from "../projectKeys.js";
import type * as projects from "../projects.js";
import type * as resetSlugs from "../resetSlugs.js";
import type * as seed from "../seed.js";
import type * as slugs from "../slugs.js";
import type * as slugsSimplified from "../slugsSimplified.js";
import type * as sprints from "../sprints.js";
import type * as tasks from "../tasks.js";
import type * as updateClientKeys from "../updateClientKeys.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addSlugs: typeof addSlugs;
  auth: typeof auth;
  clients: typeof clients;
  comments: typeof comments;
  departments: typeof departments;
  documentSyncApi: typeof documentSyncApi;
  documentTemplates: typeof documentTemplates;
  documents: typeof documents;
  email: typeof email;
  fixProjectSlugs: typeof fixProjectSlugs;
  http: typeof http;
  "legacy/legacyComments": typeof legacy_legacyComments;
  "legacy/legacyDocumentSections": typeof legacy_legacyDocumentSections;
  "legacy/legacyDocumentTemplates": typeof legacy_legacyDocumentTemplates;
  "legacy/legacyDocuments": typeof legacy_legacyDocuments;
  manualSaves: typeof manualSaves;
  migrateToClientKeys: typeof migrateToClientKeys;
  "migrations/addSlugs": typeof migrations_addSlugs;
  notifications: typeof notifications;
  organizations: typeof organizations;
  pages: typeof pages;
  presence: typeof presence;
  projectKeys: typeof projectKeys;
  projects: typeof projects;
  resetSlugs: typeof resetSlugs;
  seed: typeof seed;
  slugs: typeof slugs;
  slugsSimplified: typeof slugsSimplified;
  sprints: typeof sprints;
  tasks: typeof tasks;
  updateClientKeys: typeof updateClientKeys;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  prosemirrorSync: {
    lib: {
      deleteDocument: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        null
      >;
      deleteSnapshots: FunctionReference<
        "mutation",
        "internal",
        { afterVersion?: number; beforeVersion?: number; id: string },
        null
      >;
      deleteSteps: FunctionReference<
        "mutation",
        "internal",
        {
          afterVersion?: number;
          beforeTs: number;
          deleteNewerThanLatestSnapshot?: boolean;
          id: string;
        },
        null
      >;
      getSnapshot: FunctionReference<
        "query",
        "internal",
        { id: string; version?: number },
        { content: null } | { content: string; version: number }
      >;
      getSteps: FunctionReference<
        "query",
        "internal",
        { id: string; version: number },
        {
          clientIds: Array<string | number>;
          steps: Array<string>;
          version: number;
        }
      >;
      latestVersion: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | number
      >;
      submitSnapshot: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          id: string;
          pruneSnapshots?: boolean;
          version: number;
        },
        null
      >;
      submitSteps: FunctionReference<
        "mutation",
        "internal",
        {
          clientId: string | number;
          id: string;
          steps: Array<string>;
          version: number;
        },
        | {
            clientIds: Array<string | number>;
            status: "needs-rebase";
            steps: Array<string>;
          }
        | { status: "synced" }
      >;
    };
  };
};
