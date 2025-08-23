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

Phase 1 — Minimal in-app replica
- Create a new route (e.g., `src/app/editor-min/[docId]/page.tsx`) that renders the prototype’s `block-note-editor` logic verbatim, wired to `api.documentSyncApi`, with no comments/presence/manual-save. Use the same `customSchema` and the same initial-content conversion, but only gate on `tiptapSync.initialContent`.
- Acceptance: typing submits steps reliably in dev and prod; refresh doesn’t break it.

Phase 2 — Stabilize lifecycle in the main editor
- In `src/components/editor/BlockNoteEditor.tsx`:
  - Create the editor once per `docId` (store in `useRef`). Do not include `manualSaveData`, `resolveUsers`, `threadStore`, or `showRemoteCursors` in the creation dependencies.
  - Create `syncApi` with stable identity and call `useTiptapSync` once per `docId`. Inject `tiptapSync.extension` only at creation.
  - Implement “update content in-place” helpers:
    - When `tiptapSync.initialContent` arrives, convert PM JSON to blocks and `replaceBlocks` on the existing editor.
    - If manual-save fallback is present and there’s no sync content yet, parse it and `replaceBlocks` similarly.
  - Keep presence/comments in refs; remote-cursor plugin reads from the ref and does not force editor re-creation.
- Acceptance: editor never re-creates after mount for the same `docId`; steps flow on every doc change in dev and prod; refresh preserves behavior.

Phase 3 — Dev ergonomics toggle
- Add a per-route Strict-mode-off wrapper for the editor (optional). Provide an npm script for webpack dev without Turbopack.
- Acceptance: with either switch, dev remains stable across HMR.

Phase 4 — Cleanup & validation
- Remove excess dependency-triggered recreations; keep memoization keyed strictly by `docId`.
- Run the full validation matrix; ensure server logs show steady `submitSteps` during typing, no duplicate-version/snapshot conflicts, and multi-tab consistency.

Success criteria
- Transactions from typing consistently reach server (`submitSteps`) in dev and prod.
- No “Schema missing top node type” or “snapshot already exists” after refresh/HMR.
- Single editor instance per `docId` across presence/comments/manual-save changes.
