# ProseMirror Sync Issue: Root Cause Analysis & Resolution Plan

## Executive Summary
The intermittent autosave functionality in our BlockNote editor is caused by conflicting ProseMirror/Tiptap versions between BlockNote's bundled dependencies and our Convex sync extension. Multiple ProseMirror instances with incompatible schemas are competing at runtime, causing the "Schema is missing its top node type ('doc')" error and preventing reliable transaction sync.

## High-Level Overview

### The Problem
1. **Version Conflict**: BlockNote 0.35 bundles its own Tiptap v2/ProseMirror versions, while `@convex-dev/prosemirror-sync` expects different versions
2. **Runtime Behavior**: Multiple ProseMirror instances create competing schemas, causing intermittent sync failures
3. **Symptoms**: 
   - Works sometimes on initial compile, fails after HMR
   - Missing transaction logs despite editor changes
   - "Schema is missing its top node type ('doc')" errors
   - Sync only works after specific user interactions

### Why Previous Fixes Failed
- Deleting node_modules doesn't resolve version range conflicts in package.json
- HMR creates new instances without proper cleanup
- The migration from prototype didn't preserve exact dependency versions

---

## Actionable Resolution Plan

### Phase 1: Diagnosis (30 min)
**Goal**: Confirm version mismatch hypothesis

1. **Audit Current Dependencies**
   ```bash
   npm ls prosemirror-model > deps-audit.txt
   npm ls @tiptap/pm >> deps-audit.txt
   npm ls @tiptap/core >> deps-audit.txt
   npm ls @blocknote/core >> deps-audit.txt
   ```
   - Look for multiple versions or "deduped" entries
   - Document any version conflicts found

2. **Compare with Working Prototype**
   - Extract exact versions from prototype's package-lock.json:
     - `@blocknote/core`
     - `@blocknote/react`
     - `@convex-dev/prosemirror-sync`
     - Any direct ProseMirror packages

3. **Test Production Build**
   ```bash
   npm run build && npm start
   ```
   - If this works consistently, confirms HMR/dev server issue
   - Document behavior difference

### Phase 2: Version Alignment (45 min)
**Goal**: Force single ProseMirror instance with compatible versions

1. **Create Rollback Point**
   ```bash
   git add -A
   git commit -m "Pre-prosemirror-fix checkpoint"
   git tag pre-pm-fix
   ```

2. **Update package.json with Exact Versions**
   ```json
   {
     "dependencies": {
       "@blocknote/core": "[exact-prototype-version]",
       "@blocknote/react": "[exact-prototype-version]",
       "@convex-dev/prosemirror-sync": "[exact-prototype-version]"
     },
     "overrides": {
       "prosemirror-model": "[single-version]",
       "prosemirror-state": "[single-version]",
       "prosemirror-view": "[single-version]",
       "prosemirror-transform": "[single-version]"
     }
   }
   ```

3. **Clean Install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm ls prosemirror-model  # Verify single version
   ```

### Phase 3: Bundler Configuration (30 min)
**Goal**: Ensure single ProseMirror context in development

1. **Update Next.js Config** (if webpack-based)
   ```javascript
   // next.config.js additions
   webpack: (config) => {
     config.resolve.alias = {
       ...config.resolve.alias,
       'prosemirror-model': require.resolve('prosemirror-model'),
       'prosemirror-state': require.resolve('prosemirror-state'),
       'prosemirror-view': require.resolve('prosemirror-view'),
     };
     return config;
   }
   ```

2. **Disable HMR for Editor** (temporary test)
   - Add `// @refresh reset` to editor component
   - This forces full remount on changes

### Phase 4: Validation (30 min)
**Goal**: Confirm fix works consistently

1. **Test Matrix**
   - [ ] Fresh start: `npm run dev` → create document → edit → verify autosave
   - [ ] HMR test: Make code change → verify editor still syncs
   - [ ] Multiple tabs: Open same doc in 2 tabs → verify real-time sync
   - [ ] Production build: `npm run build && npm start` → full test

2. **Monitor Logs**
   - Verify transaction logs appear
   - No "missing top node type" errors
   - Consistent sync behavior

### Phase 5: Rollback Plan
**If issues persist or worsen:**

1. **Immediate Rollback**
   ```bash
   git reset --hard pre-pm-fix
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Alternative Approach**
   - Consider removing BlockNote temporarily
   - Use raw Tiptap with prosemirror-sync
   - Port BlockNote features incrementally

---

## Success Criteria
- [ ] No "Schema is missing its top node type" errors
- [ ] Autosave works immediately on document edit
- [ ] Transaction logs visible in console
- [ ] Sync works across multiple tabs
- [ ] Survives HMR/dev server refreshes

## Risk Mitigation
- Git tag created before changes
- Each phase independently testable
- Can pause at any phase if issues arise
- Alternative path identified if primary fix fails

---

## Historical Context

### What We've Tried
1. **Provider Cleanup** - Removed duplicate Convex providers and auth layers
2. **Dynamic Import Removal** - Eliminated SSR: false patterns causing remounts
3. **Direct Tiptap Integration** - Attempted bypassing BlockNote wrapper
4. **Node Modules Rebuild** - Deleted and reinstalled dependencies

### Key Insights
- **Prototype worked consistently** - Had BlockNote + prosemirror-sync working together
- **Migration introduced issue** - Problem appeared after porting to main codebase
- **Intermittent nature** - Points to module resolution/bundling rather than logic bugs
- **HMR correlation** - Fresh compiles sometimes work, HMR consistently breaks

### The "Missing Top Node" Error
This specific error indicates:
- Multiple ProseMirror schema definitions exist
- The sync extension attaches to wrong PM instance
- Transactions from editor don't reach sync extension
- Schema mismatch prevents proper document structure

---

## Technical Details

### ProseMirror Architecture
- **Schema**: Defines document structure (nodes, marks, rules)
- **State**: Current document + selection + plugins
- **View**: DOM rendering and event handling
- **Transactions**: State changes that need syncing

### The Conflict
```
BlockNote (v0.35)
  └── @tiptap/core (v2.x)
      └── prosemirror-* (versions A)

@convex-dev/prosemirror-sync
  └── prosemirror-* (versions B)

Result: Two ProseMirror worlds that can't communicate
```

### Why Version Alignment Matters
- ProseMirror uses instanceof checks internally
- Different versions = different classes = failed checks
- Schemas from different versions are incompatible
- Transactions can't cross version boundaries

---

## Notes for Future Reference

### If This Happens Again
1. Always check for multiple PM versions first
2. Compare with last known working configuration
3. Test in production mode to isolate HMR issues
4. Consider using yarn's resolutions or npm's overrides
5. Document exact working versions for future migrations

### Lessons Learned
- BlockNote's convenience comes with dependency complexity
- Version mismatches can cause subtle, intermittent bugs
- HMR can mask or exacerbate underlying issues
- Always preserve exact versions when migrating working code

### Alternative Solutions (If Needed)
1. **Fork BlockNote** - Control exact PM versions
2. **Raw Tiptap** - More control, less convenience
3. **Different Editor** - Lexical, Slate, or others
4. **Custom Solution** - Direct PM implementation

---

## Manual Save Implementation Notes (Added 2025-01-20)

### Context
While debugging the autosave sync issues, we implemented a manual save button as a temporary workaround. This revealed additional insights about the underlying sync problems.

### Key Findings from Manual Save

1. **Formatting Triggers Version Conflicts**
   - Plain text saves work fine
   - Bold/italic/formatting creates rapid transactions that conflict
   - Error: "Snapshot at version X already exists with different content"
   - This confirms multiple ProseMirror instances are competing

2. **Version Conflicts Are the Real Issue**
   - Not a save failure, but competing saves from different PM instances
   - Retry logic makes it worse by creating more conflicts
   - Debouncing and conflict resolution are essential

### Integration Considerations for Autosave Fix

When implementing the ProseMirror version alignment fix:

1. **Keep Manual Save Functionality**
   - ✅ Users appreciate explicit save control
   - ✅ Acts as fallback if autosave has issues  
   - ✅ Provides "checkpoint" functionality
   - ✅ Currently working independently of sync issues

2. **Coordinate Save Systems** 
   - ✅ Manual save and autosave operate at different layers (CONFIRMED)
   - ✅ Autosave: Real-time collaboration protocol (ProseMirror format)
   - ✅ Manual save: Direct table storage (BlockNote format)
   - ⚠️  **IMPORTANT**: When autosave is fixed, adjust priority logic in `BlockNoteEditor.tsx`
   - 🔄 **TODO**: Switch back to "sync first, manual save fallback" once autosave works

3. **Priority Logic Update Needed**
   - **Current**: Manual save → Sync content → Empty (for broken sync)
   - **Future**: Sync content → Manual save → Empty (when sync works)
   - **File to update**: `src/components/editor/BlockNoteEditor.tsx` lines 97-141

4. **Testing Considerations**
   - ✅ Test with rapid formatting changes (WORKING with manual save)
   - 🔄 Verify no version conflicts with single PM instance (after fix)
   - ✅ Ensure manual save still works after autosave fix (separate systems)

### Manual Save Implementation Requirements

For the current manual save to work properly:
- Debounce saves (wait 500ms after last change)
- Handle version conflicts gracefully (fetch & merge)
- Prevent multiple simultaneous saves
- Only save if content actually changed
- Keep Cmd+S immediate (bypass debouncing)

These improvements make the system more robust and should remain even after fixing autosave.

### Current Manual Save Implementation (WORKING)

**Status**: ✅ **IMPLEMENTED AND WORKING**

**What was built**:
1. **Separate storage table** (`convex/manualSaves.ts`) - avoids schema conflicts
2. **Simple save mechanism** - stores BlockNote's native block format directly
3. **Priority loading system** - manual saves take precedence over sync content
4. **Fallback restoration** - loads manual saves when sync is broken/empty

**Key files modified**:
- `convex/manualSaves.ts` - New table for manual saves (no schema conflicts)
- `convex/schema.ts` - Added manualSaves table definition
- `src/components/editor/TopBar.tsx` - Save button with proper debouncing/mutex
- `src/components/editor/BlockNoteEditor.tsx` - Priority loading (manual save first, sync second)

**How it works**:
1. User saves → BlockNote blocks stored in `manualSaves` table
2. Page refresh → Editor checks manual save first, then sync content
3. Console logging shows which content source is used
4. No conflicts with broken sync system

**Critical insight discovered**: Manual save and sync operate at different layers:
- **Manual save**: BlockNote block format → separate table
- **Sync system**: ProseMirror doc format → prosemirror-sync protocol
- They don't interfere when properly separated

---

## 2025-01-23 Update: Root Cause Analysis Complete

### Dependencies Analysis Results

After thorough investigation comparing working prototype with current project:

#### ✅ No Version Conflicts Found
- Both projects use identical ProseMirror/Tiptap versions:
  - `@tiptap/core@2.26.1`
  - `@tiptap/pm@2.26.1`
  - `prosemirror-model@1.25.3`
  - `prosemirror-state@1.4.3`
  - `prosemirror-view@1.40.1`
- BlockNote versions match: `@blocknote/core@0.35.0`

#### 🔴 Issues Identified

1. **Extra Tiptap Extensions in Current Project**
   - Current has 6 extra Tiptap extensions for task descriptions RTE:
     - `@tiptap/extension-bullet-list@2.26.1`
     - `@tiptap/extension-document@2.26.1`
     - `@tiptap/extension-hard-break@2.26.1`
     - `@tiptap/extension-heading@2.26.1`
     - `@tiptap/extension-list-item@2.26.1`
     - `@tiptap/extension-ordered-list@2.26.1`
   - These could cause plugin registration conflicts even in separate editors
   - Prototype doesn't have these dependencies

2. **Minor prosemirror-sync Version Difference**
   - Prototype: `@convex-dev/prosemirror-sync@0.1.27`
   - Current: `@convex-dev/prosemirror-sync@0.1.28`
   - Published 1 week apart, minimal changes

3. **API Export Structure Issue (MOST LIKELY CAUSE)**
   - Prototype: Uses `api.example` which resolves to sync API object
   - Current: Uses `api.documentSyncApi` which is `undefined` at runtime
   - `useTiptapSync` expects an object with all sync methods, not a namespace
   - Convex's `anyApi` proxy doesn't create intermediate objects

---

## Action Plan: Three-Phase Resolution

### Phase 1: Clean Up Editor Dependencies
**Timeline**: 30 minutes  
**Risk**: Low  
**Likelihood of fixing issue**: Medium

**Steps**:
1. Find all Tiptap-based rich text editors in codebase
2. Replace with BlockNote in local-only mode (no sync)
3. Remove these from package.json:
   ```json
   "@tiptap/extension-bullet-list": "^2.26.1",
   "@tiptap/extension-document": "^2.26.1",
   "@tiptap/extension-hard-break": "^2.26.1",
   "@tiptap/extension-heading": "^2.26.1",
   "@tiptap/extension-list-item": "^2.26.1",
   "@tiptap/extension-ordered-list": "^2.26.1",
   ```
4. Run `rm -rf node_modules package-lock.json && npm install`
5. Test auto-save functionality

**Expected outcome**: Eliminate any ProseMirror plugin conflicts between editors

### Phase 2: Align prosemirror-sync Version
**Timeline**: 15 minutes  
**Risk**: Low  
**Likelihood of fixing issue**: Low

**Steps**:
1. Update package.json:
   ```json
   "@convex-dev/prosemirror-sync": "0.1.27"
   ```
2. Run `rm -rf node_modules package-lock.json && npm install`
3. Test auto-save functionality

**Expected outcome**: Match exact working prototype configuration

### Phase 3: Fix API Export Structure
**Timeline**: 30 minutes  
**Risk**: Medium  
**Likelihood of fixing issue**: HIGH

**Steps**:
1. Update BlockNoteEditor.tsx to create sync API object:
   ```typescript
   const syncApi = {
     getSnapshot: api.documentSyncApi.getSnapshot,
     submitSnapshot: api.documentSyncApi.submitSnapshot,
     latestVersion: api.documentSyncApi.latestVersion,
     getSteps: api.documentSyncApi.getSteps,
     submitSteps: api.documentSyncApi.submitSteps,
   };
   const tiptapSync = useTiptapSync(syncApi, docId, { snapshotDebounceMs: 1000 });
   ```
2. Remove debug logging for api.documentSyncApi
3. Test auto-save functionality thoroughly

**Expected outcome**: Sync extension properly initializes and auto-save works

### Success Criteria
- [ ] No "Schema is missing its top node type" errors
- [ ] Auto-save works immediately on document edit
- [ ] Transaction logs visible in console
- [ ] Sync works across multiple tabs
- [ ] Survives HMR/dev server refreshes
- [ ] Manual save can be removed or relegated to backup only

### Rollback Points
- Git tag before Phase 1: `pre-editor-cleanup`
- Git tag before Phase 2: `pre-sync-downgrade`
- Git tag before Phase 3: `pre-api-fix`

---

*Document created: 2025-01-20*
*Issue first observed: After migration from prototype*
*Updated: 2025-01-20 - Added manual save insights*
*Updated: 2025-01-23 - Root cause analysis and three-phase action plan*
*Related files: EditorBody.tsx, EditorShell.tsx, remote-cursor-plugin.ts, BlockNoteEditor.tsx*

## 2025-08-23 Second Opinion: Lifecycle/HMR-driven desync

### Executive takeaway
- The extension is present and initial content loads, but no transactions reach it after a refresh. This points to editor re-instantiation and dev-mode lifecycle (React Strict/HMR) causing the sync extension to bind to a different ProseMirror instance than the one processing transactions.
- The prototype avoids this because its editor creation path is simpler and re-instantiates less often; the extension stays attached to the single, live PM editor.

### Why this explains the symptoms
- “Works after a fresh compile, then breaks on refresh” is classic Strict/HMR double-mount + re-creation timing.
- Logs show: hasExtension=true, initialContent present, API wired, isLoading=false — yet server sees no submitSteps. That means the extension exists but is not attached to the PM instance emitting transactions.
- This predates manual-save; manual-save can amplify conflicts but isn’t the root cause.

### What’s different from the prototype
- Prototype editor creation depends only on `tiptapSync.initialContent` and a couple of stable values.
- Current editor creation depends on several signals (`manualSaveData`, `resolveUsers`, `threadStore`, `showRemoteCursors`) which can change frequently, leading to a new editor instance. Under Strict/HMR, this churn reliably de-wires the extension.

### Critical validations (run first)
1. Temporarily disable React Strict effects in dev (`reactStrictMode: false`). If sync stabilizes across refresh, the lifecycle/double-mount hypothesis is confirmed.
2. Dev without Turbopack (webpack dev). If this further stabilizes, HMR identity drift was exacerbating re-instantiation.
3. Minimal in-app route: render the prototype’s `block-note-editor` verbatim against `api.documentSyncApi` (no comments, presence, or manual-save). If stable, the current wrapper’s lifecycle is the culprit.
4. Inspect the live PM plugins of the editor that logs transactions. If the sync plugin isn’t in that plugin list (while it exists elsewhere), the extension is bound to the wrong editor instance.

Example browser checks on the active editor instance:
```js
// Assume editorInst is the BlockNote editor instance that logged a transaction
const ed = editorInst?.prosemirrorEditor;
ed?.state?.plugins?.map(p => p?.key?.key || p?.key || p?.constructor?.name);
ed?.state?.plugins?.filter(p => !!p?.spec?.appendTransaction)?.length; // should include sync
// Stability
tiptapSync?.extension?.name; tiptapSync?.extension?.constructor?.name;
```

### Implementation direction (phased)
Phase A — Confirm hypothesis
- Strict off test, webpack dev test, minimal route test, plugin inspection + server call counts for `submitSteps` during typing.

Phase B — Stabilize editor lifecycle
- Create the BlockNote editor once per `docId` and keep it in a ref. Do not re-create when `manualSaveData`, presence, comments, or toggles change.
- Create the Tiptap sync extension once per `docId` from a stable `syncApi` object; inject it only at creation time via `_tiptapOptions.extensions: [tiptapSync.extension]`.
- Import content in-place: when `tiptapSync.initialContent` or manual fallback arrives, convert and replace blocks on the existing editor instead of re-instantiating the editor.
- Keep presence/comments in refs and have plugins read from those refs (no editor re-creation on presence/comments changes).
- Guard initialization: if initialContent is null, still create an empty editor and update later.

Phase C — Dev ergonomics
- Optionally disable Strict around the editor subtree only, or keep a separate “minimal route” for debugging.
- Add an npm script that runs webpack dev (no Turbopack) to compare behavior.

Phase D — Validation matrix
- Fresh dev start, refresh, HMR change, two tabs, production build. Verify transactions hit server (`submitSteps`) on every keystroke set and no schema/duplicate-version errors occur.

### Risks & mitigations
- Private API `_tiptapOptions`: keep usage limited to creation time; avoid reinjecting the array.
- Content divergence at start: ensure only one source initializes visible content, the other updates in-place.
- HMR identity drift: prefer webpack dev when debugging lifecycle issues; keep extension/editor identities stable via memoization keyed strictly by `docId`.

---

### Cursor implementation prompt (phased)

Phase 0 — Guardrails and diagnostics
- Add targeted logs: on mount/unmount, when `tiptapSync.extension` changes identity, when editor instance is created, and when transactions fire. Log server `getSnapshot/latestVersion/submitSteps` counts per session.
- Add a dev-only helper to print the active PM plugin keys.
 - Client-side: after typing, log whether `collab.sendableSteps(editor.state)` is non-empty and gets cleared; correlate with server `submitSteps` counts to detect extension binding issues.
 - Assert single collab plugin on the live editor: log `editor.state.plugins` keys and ensure exactly one collab plugin is present alongside the sync extension.

Phase 1 — Minimal in-app replica
- Create a new route (e.g., `src/app/editor-min/[docId]/page.tsx`) that renders the prototype’s `block-note-editor` logic verbatim, wired to `api.documentSyncApi`, with no comments/presence/manual-save. Use the same `customSchema` and the same initial-content conversion, but only gate on `tiptapSync.initialContent`.
- Acceptance: typing submits steps reliably in dev and prod; refresh doesn’t break it.
 - Keep this route as a permanent golden reference for regressions even after the main editor is fixed.

Phase 2 — Stabilize lifecycle in the main editor
- In `src/components/editor/BlockNoteEditor.tsx`:
  - Create the editor once per `docId` (store in `useRef`). Do not include `manualSaveData`, `resolveUsers`, `threadStore`, or `showRemoteCursors` in the creation dependencies.
  - Create `syncApi` with stable identity and call `useTiptapSync` once per `docId`. Inject `tiptapSync.extension` only at creation.
  - Implement “update content in-place” helpers:
    - When `tiptapSync.initialContent` arrives, convert PM JSON to blocks and `replaceBlocks` on the existing editor.
    - If manual-save fallback is present and there’s no sync content yet, parse it and `replaceBlocks` similarly.
  - Keep presence/comments in refs; remote-cursor plugin reads from the ref and does not force editor re-creation.
- Acceptance: editor never re-creates after mount for the same `docId`; steps flow on every doc change in dev and prod; refresh preserves behavior.
 - Handle docId changes explicitly: before creating a new editor for a different `docId`, call `editorRef.current?.prosemirrorEditor?.destroy?.()` (or equivalent) and clear listeners/heartbeats; then set `editorRef.current = null` and create the new instance.
 - Content precedence and race guards: prefer sync snapshot over manual-save if both are available; maintain `appliedSourceRef` and a version/timestamp (e.g., `appliedVersionRef`) to avoid overwriting newer content with older. If two sources arrive close together, queue to a microtask and apply only the winner based on precedence and recency.
 - Hydration-safe initial apply: during the first content import, set a transient `hydratingRef` to skip triggering step submissions until the initial replace completes; clear immediately after.
 - onEditorReady continuity: ensure the callback fires exactly once per editor creation using a ref-based change detector, not on unrelated state changes.

Phase 3 — Dev ergonomics toggle
- Add a per-route Strict-mode-off wrapper for the editor (optional). Provide an npm script for webpack dev without Turbopack.
- Acceptance: with either switch, dev remains stable across HMR.

Phase 4 — Cleanup & validation
- Remove excess dependency-triggered recreations; keep memoization keyed strictly by `docId`.
- Run the full validation matrix; ensure server logs show steady `submitSteps` during typing, no duplicate-version/snapshot conflicts, and multi-tab consistency.
 - Verify lifecycle correctness: on unmount and on `docId` changes, confirm the previous editor is destroyed (the sync extension’s `onDestroy` should unsubscribe the watcher).

Success criteria
- Transactions from typing consistently reach server (`submitSteps`) in dev and prod.
- No “Schema missing top node type” or “snapshot already exists” after refresh/HMR.
- Single editor instance per `docId` across presence/comments/manual-save changes.

## 2025-08-24 Status Checkpoint: What we proved, what failed, what’s next

### What we’ve eliminated
- Convex sync stack works: A raw TipTap route (`/tiptap-min/<docId>`) synced and persisted after refresh, proving server endpoints, hook (`useTiptapSync`), and versions are fine.
- “Version mismatch” is not the blocker for current behavior. The persistent failure correlates with BlockNote integration, not package versions.
- Main-editor re-instantiation was a factor; we refactored toward single-instance lifecycles. The remaining issue persists even with a single instance.

### What consistently fails (BlockNote path)
- When injecting the TipTap sync extension via BlockNote’s private `_tiptapOptions`, the live ProseMirror EditorView ends up without the collab plugin after mount and/or view swaps.
- Forced dev-time plugin injection into the live view did not stick; BlockNote appears to rebuild the extension manager/state after our injection, dropping the sync plugin.
- Attaching transaction listeners to both the live `prosemirrorView` and BlockNote’s `_tiptapEditor` yielded no transaction logs for typing or even programmatic inserts/dispatch in these failing setups, confirming the extension isn’t in the active pipeline.

### Current experiment (in progress)
- Minimal BlockNote test page using the official hook: `useBlockNoteSync`.
- We observed a conversion error (“Node should be a bnBlock, but is instead: text”) when the hook converts PM JSON → BlockNote blocks. This indicates the snapshot shape isn’t exactly what BlockNote expects.
- Implemented a sanitizer on the bn-min route that preloads the server snapshot, normalizes it to `doc -> blockGroup -> [blocks...]`, and caches it in `sessionStorage` under `convex-sync-<docId>`. `useBlockNoteSync` prefers this cached state and should initialize cleanly with the collab plugin present.

Why this should work
- `useBlockNoteSync` is designed specifically to wire BlockNote + Convex, including creating the editor and attaching the sync extension in the correct lifecycle phase. By normalizing the snapshot shape to the expected BlockNote structure, we avoid conversion errors that previously derailed initialization.

### What we expect to validate
- On bn-min: typing produces transactions and server `submitSteps` for the same `docId`.
- Live PM plugin list (via dev helper) shows a collab plugin after mount.

### If this still fails
- Add targeted logs on bn-min to print:
  - plugin keys on the live `prosemirrorView`
  - whether `useBlockNoteSync` actually provided a non-null `editor`
  - TipTap events (`transaction`, `update`, `v3-update`) from the underlying `_tiptapEditor`
- If `useBlockNoteSync` initializes but collab is still missing, we’ll migrate the main editor to the `useBlockNoteSync` flow (with sanitizer) and remove `_tiptapOptions` entirely (the only supported, durable path), then reintroduce manual-save fallback after sync is proven.
- If even the official hook fails to attach collab on live EditorView after sanitized content, we will open an integration issue: BlockNote may be rebuilding its TipTap view after our hook attaches. As a workaround, we can:
  - wrap `useBlockNoteSync` and reapply extension plugins when `prosemirrorView` changes; or
  - temporarily switch to the raw TipTap editor for the main surface while preserving BlockNote UI features incrementally.

### Key takeaways so far
- The root cause is lifecycle/attachment within BlockNote: the sync extension is not present on the live EditorView that handles user input, which is why typing never yields steps, even though the extension object exists.
- The supported route is the BlockNote-specific sync hook. With sanitized input, this should restore autosave/sync behavior without fighting BlockNote’s internals.

## 2025-08-24 Breakthrough: bn-min syncing end-to-end

### What just worked
- On the bn-min route, switching to `useTiptapSync` + explicit PM→BlockNote conversion (headless BlockNote) + creating the BlockNote editor with `_tiptapOptions: { extensions: [extension] }` successfully produced:
  - “Adding collab plugin” logs
  - Continuous “Sending steps…” and server `submitSteps` with incrementing versions (synced)
  - Visible typed content in the editor

### Why this worked when others didn’t
- We avoided `useBlockNoteSync`’s internal conversion that was erroring on text nodes
- We created the BlockNote editor only after the sync extension was ready, and we injected the extension at creation, preventing it from being dropped by subsequent BlockNote view rebuilds
- We sanitized the initial PM JSON to BlockNote’s expected `doc -> blockGroup -> [blocks]` shape before conversion

### Implementation plan to bring this into the main editor
1) Replace `_tiptapOptions`-only approach with `useTiptapSync`-driven initialization
   - Build a stable `syncApi` mapping to `api.documentSyncApi.{getSnapshot,submitSnapshot,latestVersion,getSteps,submitSteps}`
   - Call `useTiptapSync(syncApi, docId, { snapshotDebounceMs: 1000 })`

2) PM snapshot handling
   - If `tiptapSync.initialContent` is available, sanitize it and convert to BlockNote blocks via a headless editor:
     - Strip unsupported marks (e.g., comment)
     - Ensure the JSON is shaped as `doc -> blockGroup -> [blocks]`
     - Traverse the `blockGroup` children; only feed block nodes into `nodeToBlock`

3) Single-instance BlockNote editor creation
   - Create the BlockNote editor once per `docId`, with:
     - `schema: customSchema`
     - `_tiptapOptions: { extensions: [tiptapSync.extension] }`
     - `initialContent: <converted blocks>` when present
   - Keep a ref to the editor; do not recreate it on presence/comments/manual-save changes

4) Late initial content & updates
   - If the editor exists and a sync snapshot arrives later, convert and replace blocks in-place (no re-instantiation)
   - Keep presence/comments in refs and re-render UI without touching the editor instance

5) Manual-save fallback
   - Temporarily disable manual-save as the initial content source to remove races during bring-up
   - After sync is validated, reintroduce manual-save strictly as a fallback (lower priority) and ensure it never overwrites fresher sync content

6) Diagnostics (dev-only)
   - Plugin checks on the live `prosemirrorView` to assert exactly one collab plugin
   - TipTap `transaction`/`update`/`v3-update` listener on `_tiptapEditor` to confirm typing produces TXNs
   - Server logs confirm `submitSteps` counts increment with typing

### Validation checklist
- Typing produces client TXNs and server `submitSteps` steadily
- Collab plugin present on the live view after mount
- Refresh/HMR does not drop the extension; typing continues to sync
- Production build behaves the same

### Rollback/alternatives
- If attaching via `_tiptapOptions` is still dropped by BlockNote's rebuilds, wrap the `prosemirrorView` mount step to re-apply the extension plugins when the view changes (dev-only diagnostic first)
- As a fallback, temporarily render the main surface with raw TipTap + sync, and layer back BlockNote features incrementally

### Additional Analysis (Claude's observations)

#### Root Cause Confirmed
The fundamental issue was **timing and lifecycle management**:
- **Problem**: Creating the BlockNote editor before the sync extension was ready, then attempting to inject it post-creation
- **Solution**: Wait for the extension to be ready, then create the editor with the extension included from the start

#### Why Previous Attempts Failed
1. **Post-creation injection doesn't work**: BlockNote rebuilds its internal state, dropping injected plugins
2. **useMemo recreation**: Dependencies like `manualSaveData` caused constant editor recreation, breaking the sync connection
3. **Schema mismatches**: Direct PM→BlockNote conversion without proper sanitization caused errors
4. **Extension binding**: The sync extension would attach to one PM instance while BlockNote used another

#### Critical Success Pattern
The working solution is actually simpler than our complex attempts:
1. **Wait for readiness**: Only create editor after `tiptapSync.extension` exists
2. **Proper conversion**: Use headless BlockNote for PM→BlockNote block conversion
3. **Single instance**: Create once per docId, update content in-place
4. **Clean initialization**: Pass extension via `_tiptapOptions` at creation, not after

#### Key Implementation Notes
- The headless BlockNote conversion is essential - it handles schema differences properly
- The single-instance pattern prevents the extension from being orphaned
- Content updates via `replaceBlocks` maintain the sync connection
- Removing recreation triggers (presence, comments, manual save) from dependencies is crucial

#### What This Proves
- BlockNote CAN work with prosemirror-sync, but timing is everything
- The sync extension must be present at editor creation time
- BlockNote's internal rebuilds will drop post-creation modifications
- A stable, single-instance editor is required for reliable sync


2025-08-25 Reality Check & Reset Plan


  Summary of where we landed

  • bn-min route is a proven baseline: useTiptapSync + sanitize PM JSON to doc -> blockGroup -> blocks + headless conversion +
    create BlockNote editor with the sync extension at creation time. Transactions and server submitSteps work.
  • Main editor intermittently works at creation (collab plugin verified), then TipTap EditorView is destroyed and rebuilt moments
    later (“destroying” → “Adding collab plugin…”). This tears down collab and listeners before any typing is observed.
  • We attempted two stabilization strategies:
    1. Manual mount of TipTap view into a host div: reduced parent churn impact and yielded stable TXNs but lost BlockNoteView’s UI
       integrations (formatting/slash) unless replicated manually.
    2. Restored BlockNoteView and added a parent “ready” gate: partly reduced churn but logs still show immediate unmount/remount
       cycles after create in the main app’s flow (likely a combination of Strict dev double-effects + parent flipping
       docId/subtree).


  Key findings

  • The collab extension and useTiptapSync are not the blockers; the pipeline initializes and verifies at creation on the main
    editor.
  • The core blocker is lifecycle: the parent removes/reinserts the editor subtree right after create (render → unmount → mount),
    destroying the TipTap EditorView. Under Strict dev, this doubles; HMR makes it worse.
  • Formatting/slash require BlockNoteView’s lifecycle. Manual mount stabilizes the view but bypasses some BlockNoteView wiring; to
    keep UX, the editor must be rendered via BlockNoteView and the parent must stop tearing it down during bring-up.


  Why attempts didn’t stick

  • Stabilization inside the child alone isn’t enough: any parent subtree removal causes TipTap destroy() (by design).
  • Plugin re-injection is not viable: ProseMirror forbids adding another keyed collab plugin (“different instances of a keyed
    plugin”).
  • Late wiring of cursors/comments at creation triggers additional reconfig; these should be added post-mount after sync is
    confirmed.


  Hard reset plan

  1. Freeze bn-min as the canonical baseline (do not change it).
  2. In the main editor parent (EditorBody), fully gate the editor render:
    • Only render <BlockNoteEditor docId={pageDocId} /> when:
      • pageDocId is final (not undefined/empty)
      • pages completed loading
    • Render a neutral placeholder view otherwise
    • Avoid flipping keys/props for the editor subtree after initial render
  3. In BlockNoteEditor (child), keep bn-min creation strictly:
    • Create once per docId when tiptapSync.extension is present
    • Sanitize PM JSON to doc -> blockGroup -> blocks, headless convert, set initialContent
    • Late-apply snapshot only if it arrives after create
    • Do not add cursors/comments at creation; add them in a post‑mount effect once sync is confirmed (and ensure doing so doesn’t
      force a view rebuild)
  4. Re-enable Strict Mode after success; first verify in dev without Strict to isolate parent churn.
  5. Only after typing and submitSteps are stable, reintroduce optional features (cursors/comments) one at a time post‑mount.


  What to roll back now

  • Remove manual mount code from BlockNoteEditor; restore BlockNoteView render.
  • Remove any dev-only plugin injection loops or brittle plugin key scans; use collab.getVersion(view.state) as the single source
    of truth.
  • Ensure no cursors/comments are attached at creation time; wire them in a separate effect after success.


  Next steps after reset

  • Implement the strict parent gating (step 2 above), then verify:
    • No “destroying” log after “Editor created…”
    • “Collab plugin verified…” present
    • “EDITOR UPDATE”/“EDITOR TRANSACTION” on typing
    • Server submitSteps increments
  • If “destroying” still appears immediately after creation even with gating, add a tiny debounce on docId in the parent (e.g.,
    render only after docId has remained unchanged for 50–100ms) and hard log parent renders to find the precise flip.


  Contingency (if the parent cannot be stabilized)

  • Use the raw TipTap editor (bn‑min approach) for the main surface temporarily and layer BlockNote-like features later.
  • Or manually replicate BlockNoteView integrations while manually mounting — but this path is more costly and error-prone.


  Final note

  • The blocker is not the sync extension but the component lifecycle. Fix the parent gating first, then the bn‑min-aligned editor
    (which already works in isolation) will behave identically in the main flow.