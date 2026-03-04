# REQ — Frontend: User Story Map View (Phase 9)

**Date:** 2026-03-03
**Phase:** 9 — Frontend: User Story Map View
**Source:** `docs/req-story-map-manager.md`, attached Phase 9 wireframe
**Status:** Draft

---

## Context

Phase 9 introduces a planning-oriented story map board that complements the outliner and inspector workflows.

The board visual model is lane-based and must reflect the hierarchy and sequencing intent in the wireframe: Activities on top, Tasks in the middle lane, and Release Slice cards below tasks for sequencing.

---

## Scope

### In Scope

- User Story Map board screen with three visual lanes
- Activities rendered in the top lane as grouped/high-level map items
- Tasks rendered in the middle lane (terminology replaces Backbone in UI)
- Release Slice cards rendered below and aligned under related Tasks
- Card click behavior that focuses the related node context in outliner and inspector
- Horizontal navigation support for large maps that exceed viewport width

### Out of Scope

- Automatic release planning suggestions or AI-based sequencing
- Multi-user collaborative lane editing
- Timeline analytics embedded directly in the board
- New metadata schema beyond existing story-map model fields required for lane mapping

---

## Functional Requirements

### FR-SM1: Board Lane Structure

- **FR-SM1.1** The board must render three lanes in this exact top-to-bottom order: `Activities`, `Tasks`, `Release Slice`.
- **FR-SM1.2** Lane headers must remain visible and clearly labeled while users scroll through map content.
- **FR-SM1.3** The middle lane label in this phase must be `Tasks` (not `Backbone`).

### FR-SM2: Activities Lane (Top)

- **FR-SM2.1** Activities must appear as top-lane cards representing major user journey groupings.
- **FR-SM2.2** Activity cards must align to the same horizontal planning grid used by task/release lanes.
- **FR-SM2.3** Activity cards must preserve stable identity so selection/focus can map to source nodes.

### FR-SM3: Tasks Lane (Middle)

- **FR-SM3.1** Tasks must render as middle-lane cards associated with their parent Activities.
- **FR-SM3.2** Tasks must visually communicate sequence across the horizontal axis.
- **FR-SM3.3** Task cards must be selectable as navigation anchors for downstream release slice context.

### FR-SM4: Release Slice Lane (Bottom)

- **FR-SM4.1** Release Slice cards must render in one or more rows beneath the Tasks lane.
- **FR-SM4.2** Each Release Slice card must be horizontally aligned under its related Task card.
- **FR-SM4.3** The board must support sparse/uneven release distribution where some tasks have multiple slices and others have none.
- **FR-SM4.4** Vertical stacking for multiple slices under the same task must preserve horizontal task alignment.

### FR-SM5: Map-to-Outliner/Inspector Focus Handoff

- **FR-SM5.1** Clicking an Activity, Task, or Release Slice card must focus the corresponding node in the outliner.
- **FR-SM5.2** If the clicked card maps to a story-level item, the inspector must open and display that node context.
- **FR-SM5.3** Focus handoff must expand any collapsed outliner ancestors required to reveal the target node.
- **FR-SM5.4** Focus handoff must preserve stable node identity and avoid ambiguous matching.

### FR-SM6: Board Navigation and View Behavior

- **FR-SM6.1** The board must support horizontal scrolling for large maps while keeping lane readability.
- **FR-SM6.2** Card spacing and sizing must remain legible at desktop and typical laptop viewport widths.
- **FR-SM6.3** Empty lane states (for example no release slices yet) must remain structurally visible.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-SM1 | Card click-to-focus should feel immediate for normal project map sizes in local desktop use |
| NFR-SM2 | Board rendering must remain deterministic across repeated map/outliner focus transitions |
| NFR-SM3 | Lane labeling and card semantics must remain consistent with existing Activity/Task/Story model terminology |
| NFR-SM4 | Feature must operate fully offline in the Electron desktop app |
| NFR-SM5 | Layout must remain usable on both desktop and constrained laptop widths via scrollable board content |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-SM1 | Board displays three lanes in order: Activities, Tasks, Release Slice |
| AC-SM2 | Middle lane label uses `Tasks` and does not display `Backbone` |
| AC-SM3 | Release Slice cards appear below and horizontally aligned to related Task cards |
| AC-SM4 | Tasks with no slices render correctly without breaking board alignment |
| AC-SM5 | Clicking any map card focuses the corresponding outliner node |
| AC-SM6 | Clicking a story-level card opens inspector context for that selected node |
| AC-SM7 | Focus handoff expands collapsed parents as needed to reveal target node |
| AC-SM8 | Wide maps remain navigable through horizontal scrolling while lane labels stay clear |

---

## Dependencies

- Phase 5 outliner selection/focus mechanics are available and stable.
- Phase 6 inspector panel selection binding is available for story-level focus.
- Stable node IDs from core/renderer data flow are available for card-to-node mapping.

---

## Open Decisions

1. Release Slice grouping semantics: confirm whether a slice card maps directly to Story nodes, or to a separate release grouping entity that references stories.
2. Board entry point: confirm whether the board is a dedicated view toggle, tab, or split mode within existing shell navigation.
3. Default ordering policy: confirm whether ordering follows source file order strictly or allows board-local reorder interactions in this phase.