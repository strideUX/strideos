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

*Document created: 2025-01-20*
*Issue first observed: After migration from prototype*
*Related files: EditorBody.tsx, EditorShell.tsx, remote-cursor-plugin.ts*