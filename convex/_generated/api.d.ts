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
import type * as auth from "../auth.js";
import type * as clients from "../clients.js";
import type * as counters from "../counters.js";
import type * as demo from "../demo.js";
import type * as departments from "../departments.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as projects from "../projects.js";
import type * as sections from "../sections.js";
import type * as seed from "../seed.js";
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
  auth: typeof auth;
  clients: typeof clients;
  counters: typeof counters;
  demo: typeof demo;
  departments: typeof departments;
  documentTemplates: typeof documentTemplates;
  documents: typeof documents;
  http: typeof http;
  projects: typeof projects;
  sections: typeof sections;
  seed: typeof seed;
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
