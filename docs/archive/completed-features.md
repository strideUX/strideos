# Completed Features Archive

## Feature 17.3 – JIRA-Style Slug Identifiers (January 2025)
**Status:** ✅ PRODUCTION READY

**Summary:** Implemented human-readable identifiers for tasks, projects, and sprints using per-client/department project keys with atomic counters and UI surfacing.

**Backend:**
- `projectKeys` table with `by_key`, `by_client`, `by_department`, `by_project`, `by_default` indexes
- Slug fields + indexes on `tasks`, `projects`, `sprints`; `clients.projectKey` with index
- `convex/slugs.ts`: `generateProjectKey`, `generateTaskSlug`, `generateSprintSlug`, `generateProjectSlug`, `getBySlug`
- Creation-flow hooks via `ctx.scheduler.runAfter` to assign slugs post-insert
- Migration script `convex/migrations/addSlugs.ts` to backfill keys/slugs

**Frontend:**
- Slug chips with copy in `ProjectTasksTab`, `ProjectsTable`, `SprintsTable`, `SprintKanban`, `SprintTaskTable`
- Admin `ProjectKeysTab` for listing/updating keys

**Decisions:**
- Slugs are immutable
- Counters are per key; atomic increment to avoid duplicates
- Projects use year-based slug pattern with dedupe suffix; tasks/sprints use numeric counters

**Next:** Global search quick-jump and slug-based routing

---

## Feature 17.2.7 – Client View UI Iteration & Polish
**Status:** ✅ COMPLETED (December 2024)

**Summary:** Refined the Client dashboard with a full tab-based layout, polished spacing, consistent components, and improved empty/loading states. Updated KPI cards to: Active Sprint Capacity, Total Projects, Projects At Risk, Team Members. Ensured hook order stability via inner tab components. Styled tab bar full width and aligned spacing with system patterns.

**Acceptance Criteria Met:**
- Header spacing and typography aligned with global patterns
- Tab labels and counts consistent and accessible
- Empty states refined for all cards (active/upcoming)
- Consistent icon sizing, paddings, and button variants
- No regressions in existing behavior

**Implementation Notes:**
- Page: `src/app/(dashboard)/clients/[id]/page.tsx` tab layout (Active Sprints, Planning, Completed, Projects, Team)
- Components: `ClientActiveSprintsKanban`, inner tab components for queries, `ProjectsTable` wrapped in `Card`
- KPI: `src/components/clients/ClientStatsCards.tsx` updated; backend `clients.getClientDashboardById` extended with capacity and at‑risk metrics

---
