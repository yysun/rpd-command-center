# REQ — Frontend: Outliner (Phase 5)

**Date:** 2026-03-03
**Phase:** 5 — Frontend: Outliner
**Source:** `docs/req-story-map-manager.md`
**Status:** Draft

---

## Context

Phase 5 delivers the interactive outliner experience for editing story-map hierarchy directly in the renderer.

This phase must make outliner interactions feel keyboard-first and structurally safe while remaining local-first and in-session.

---

## Scope

### In Scope

- Interactive nested outliner rendering for hierarchy blocks
- Inline chips on rendered blocks and row-level expand/collapse behavior
- Inline title editing and keyboard-driven block creation/deletion flows
- Hierarchy restructuring by keyboard indentation and drag-drop movement
- In-session undo/redo for outliner edit operations

### Out of Scope

- Persistent undo/redo across app restarts
- Inspector-side metadata editing workflows beyond what is shown inline in outliner chips
- Template generation (REQ/PLAN/DONE) and file authoring workflows
- Search/filter/focus enhancements not required for base outliner editing

---

## Functional Requirements

### FR-OL1: Nested Outliner Rendering

- **FR-OL1.1** The renderer must present activities, tasks, and stories as interactive nested outliner blocks.
- **FR-OL1.2** Each block row must expose hierarchical depth visually and remain selectable.
- **FR-OL1.3** Rows that contain child blocks must support collapse/expand toggling.
- **FR-OL1.4** Collapse state must hide descendants while preserving hierarchy integrity.

### FR-OL2: Inline Block Chips

- **FR-OL2.1** Story rows must render inline chips for key metadata visible in outliner context.
- **FR-OL2.2** Chips must include at minimum status, slug, and doc-reference indicators when available.
- **FR-OL2.3** Chip rendering must remain stable during edits, collapse/expand, and restructure actions.

### FR-OL3: Block Editing Basics

- **FR-OL3.1** Users must be able to edit block titles inline in the outliner.
- **FR-OL3.2** Pressing Enter on a focused block must create a new sibling block at the same hierarchy level.
- **FR-OL3.3** Deleting a block must require an explicit user confirmation step.
- **FR-OL3.4** Delete confirmation must clearly communicate whether descendants are affected.

### FR-OL4: Block Restructuring

- **FR-OL4.1** Pressing Tab on a focused block must indent the block (move under previous valid sibling when allowed).
- **FR-OL4.2** Pressing Shift+Tab on a focused block must outdent the block (move to parent peer level when allowed).
- **FR-OL4.3** Users must be able to drag and drop blocks to reorder within the same parent.
- **FR-OL4.4** Drag and drop must support cross-parent moves where type/order constraints allow.
- **FR-OL4.5** Restructure operations must preserve block identity and associated metadata.

### FR-OL5: Undo/Redo (In-Session)

- **FR-OL5.1** Outliner edits in this phase must support undo during the current session.
- **FR-OL5.2** Outliner edits in this phase must support redo during the current session.
- **FR-OL5.3** Undo/redo coverage must include create, title edit, delete, indent/outdent, and drag-drop moves.
- **FR-OL5.4** Performing a new edit after undo must clear the redo branch for deterministic state.

### FR-OL6: Interaction Safety and Feedback

- **FR-OL6.1** Invalid restructure actions (for example impossible indent/outdent) must fail safely without data loss.
- **FR-OL6.2** Keyboard and drag-drop actions must update visible hierarchy immediately after successful operations.
- **FR-OL6.3** Confirmation and error/invalid-action feedback must be clear and non-blocking to continued editing.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-OL1 | Keyboard editing interactions should feel immediate for typical map sizes used in v1 |
| NFR-OL2 | Outliner view state must remain consistent after repeated edit/restructure/undo cycles |
| NFR-OL3 | In-session undo/redo stack behavior must be deterministic and reversible |
| NFR-OL4 | No Phase 5 behavior may require network access |
| NFR-OL5 | Outliner behavior must run on macOS, Windows, and Linux in the Electron app model |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-OL1 | User can expand/collapse nested blocks and descendants hide/show correctly |
| AC-OL2 | Story rows display inline chips for status/slug/doc refs when data exists |
| AC-OL3 | User can inline-edit a block title and see the update immediately |
| AC-OL4 | Pressing Enter creates a sibling block at the same level |
| AC-OL5 | Deleting a block requires confirmation before removal |
| AC-OL6 | Tab and Shift+Tab indent/outdent blocks when valid |
| AC-OL7 | Drag-drop supports same-parent reorder and valid cross-parent moves |
| AC-OL8 | Undo/redo restores and reapplies create/edit/delete/restructure actions in-session |
| AC-OL9 | New edits after undo clear redo history and continue from current state |

---

## Dependencies

- Phase 4 renderer shell and hierarchy rendering are available as baseline.
- Core model identity for activities/tasks/stories is stable for move/edit operations.

---

## Phase 5 Decisions

1. `Enter` creates a sibling of the currently focused block at the same hierarchy level and preserves the focused block kind semantics.
2. Delete confirmation copy includes explicit descendant impact context. For non-leaf blocks, this includes descendant counts.
3. Drag-drop exposes explicit insertion affordances (drop markers/targets) for same-parent and valid cross-parent moves.
