# Hours-Based Task Sizing Implementation Plan

## Overview
Transition from days-based size enum (XS, S, M, L, XL) to flexible hours-based number system for more accurate capacity planning and future display preferences.

## Current State
- **Schema**: Tasks have `size` as enum (XS, S, M, L, XL) with day mappings
- **UI**: Size dropdown with day labels  
- **Capacity**: Based on story points derived from size
- **Display**: Shows size labels throughout (task tables, sprint planning)

## Target State
- **Schema**: `size` as optional number (hours)
- **UI**: Simple number input for hours (optional field)
- **Capacity**: Direct hours-based calculations
- **Display**: Hours everywhere with future display preferences
- **Business Logic**: PM creates task, assignee sizes it (warnings for unsized tasks)

## Migration Mapping
- XS → 4 hours (0.5 days)
- S → 16 hours (2 days) 
- M → 32 hours (4 days)
- L → 48 hours (6 days)
- XL → 64 hours (8 days)

## Implementation Phases

### Phase 1: Schema & Migration
- Update tasks schema: `size` from enum to `v.optional(v.number())`
- Create migration script to convert existing size values
- Test migration safety and rollback procedures

### Phase 2: UI Updates
- Replace size dropdown with number input in TaskFormDialog
- Update task table displays to show hours format
- Modify sprint planning UI for hours-based display
- Add warnings for unsized tasks (future business logic)

### Phase 3: Backend Logic Updates
- Update capacity calculations to use hours directly
- Modify sprint statistics to be hours-based
- Update team workload calculations
- Remove story points logic in favor of hours

### Phase 4: Display Consistency
- Update all task lists across the app
- Modify sprint dashboard to show hours
- Update team dashboard capacity displays
- Ensure consistent hour formatting throughout

## Validation & Constraints
- **Input Validation**: Minimum 1 hour, integer values, reasonable maximum
- **Optional Field**: Size not required (PM workflow support)
- **Migration Safety**: Backup, dev testing, rollback plan
- **Future Extensibility**: Framework for display preferences and decimal hours

## Business Logic Considerations
- PM creates tasks without sizing requirement
- Assignees will size tasks (future workflow implementation)
- UI warnings for unsized tasks in capacity planning views
- Graceful handling of null/undefined size values

## Files Affected
- `convex/schema.ts` - Size field update
- `convex/migrations.ts` - Migration script
- `convex/tasks.ts` - Task mutations
- `convex/sprints.ts` - Capacity calculations
- `src/components/admin/TaskFormDialog.tsx` - Size input
- All task table components - Display format
- Sprint planning components - Capacity display
- Team dashboard components - Workload display

## Testing Checklist
- [ ] Migration converts sizes correctly
- [ ] Task creation with/without hours works
- [ ] Sprint capacity calculations accurate with optional sizing
- [ ] Team workload handles unsized tasks gracefully
- [ ] All task tables show proper hour format or "Unestimated"
- [ ] No broken references to old size enum
- [ ] Null/undefined size handling throughout app

## Future Enhancements
- Display preferences (hours/days toggle)
- Decimal hour support
- Advanced input formats (e.g., "2d", "1w")
- Automatic sizing suggestions
- Capacity planning warnings and recommendations

---

*Created: January 2025*  
*Status: Planning Phase*