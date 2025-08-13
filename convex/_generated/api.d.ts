/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addSlugs from "../addSlugs.js";
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as comments from "../comments.js";
import type * as departments from "../departments.js";
import type * as documentSections from "../documentSections.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as migrations_addSlugs from "../migrations/addSlugs.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as projectKeys from "../projectKeys.js";
import type * as projects from "../projects.js";
import type * as resetSlugs from "../resetSlugs.js";
import type * as seed from "../seed.js";
import type * as slugs from "../slugs.js";
import type * as sprints from "../sprints.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

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
  documentSections: typeof documentSections;
  documentTemplates: typeof documentTemplates;
  documents: typeof documents;
  email: typeof email;
  http: typeof http;
  "migrations/addSlugs": typeof migrations_addSlugs;
  notifications: typeof notifications;
  organizations: typeof organizations;
  projectKeys: typeof projectKeys;
  projects: typeof projects;
  resetSlugs: typeof resetSlugs;
  seed: typeof seed;
  slugs: typeof slugs;
  sprints: typeof sprints;
  tasks: typeof tasks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
