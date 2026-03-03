# REQ — Electron Frontend: Three-Panel Layout

**Date:** 2026-03-02
**Scope:** Electron renderer UI shell
**Source:** `docs/ui.pen` (`User Story Map`, id `s2j1W`)
**Status:** Draft

---

## Context

The Electron renderer must adopt a production-ready three-panel workspace layout aligned with the design source in `docs/ui.pen`.

The target layout is a full-height application shell with:
- Left navigation rail
- Center workspace
- Optional right utility panel

This requirement defines **what** the UI must provide, including structure, behavior expectations, and acceptance criteria. Implementation details are intentionally excluded.

---

## Functional Requirements

### FR-UI1: Design Source Alignment

- **FR-UI1.1** The renderer layout must be derived from `docs/ui.pen`, specifically frame `User Story Map` (`s2j1W`).
- **FR-UI1.2** The shell must preserve the three top-level regions represented by:
  - Left Sidebar (`HM2Bw`)
  - Center Area (`Fm0Z8`)
  - Inspector Panel (`wWbvv`)
- **FR-UI1.3** The visual hierarchy must match the referenced design intent: navigation and context on the left, primary editing/browsing in the center, and detail/properties on the right.

### FR-UI2: Panel Geometry and Layout Contract

- **FR-UI2.1** The shell must render as a single-row, three-panel structure across the app viewport.
- **FR-UI2.2** Baseline panel widths must align to the design frame proportions in `s2j1W`:
  - Sidebar: `240px`
  - Outliner: `880px` in a 1440px baseline canvas and functionally treated as the flexible primary panel
  - Inspector: `320px`
- **FR-UI2.3** The shell must support full viewport height usage, with each panel extending vertically as a persistent column.
- **FR-UI2.4** The center outliner must remain the primary flexible area as window width changes.
- **FR-UI2.5** The right utility panel must be optional at runtime and may be hidden without breaking center workspace usability.

### FR-UI3: Desktop Title Bar Treatment

- **FR-UI3.1** Desktop renderer must use a custom frameless-style title bar treatment with explicit draggable and non-draggable regions.
- **FR-UI3.2** Broad header/background surfaces must be marked draggable so window movement feels natural.
- **FR-UI3.3** Interactive controls in draggable regions must be explicitly marked non-draggable, including the sidebar collapse toggle.
- **FR-UI3.4** Title-bar controls must be visually integrated into the app header surface instead of appearing as a separate OS-chrome strip.
- **FR-UI3.5** Drag treatment must be mirrored across both:
  - Main top header strip
  - Any left-edge header strip
  So users can drag from multiple top-left interaction zones.

### FR-UI4: Panel Internal Regions

- **FR-UI4.1** Sidebar must include distinct top/header and content sections, matching the structural intent visible in `HM2Bw`.
- **FR-UI4.2** Outliner must include a top/header row and a main content area, matching the structural intent visible in `Fm0Z8`.
- **FR-UI4.3** Inspector must include a top/header row and a details/content area, matching the structural intent visible in `wWbvv`.

### FR-UI5: Left Navigation Zone Behavior

- **FR-UI5.1** Left navigation must be collapsible with two densities:
  - Expanded density: full labels, metadata, and actions.
  - Collapsed density: icon-first quick access.
- **FR-UI5.2** Left-side secondary paneling must be slide-in and mode-driven, not route-driven.
- **FR-UI5.3** Mode system must support at least `system-settings` mode.

### FR-UI6: Styling System Requirement

- **FR-UI6.1** The renderer styling system must use **Tailwind CSS v4**.
- **FR-UI6.2** The three-panel shell and all immediate layout primitives (panel containers, headers, content zones) must be styled through Tailwind v4 utility classes and/or Tailwind v4-compatible global tokens.
- **FR-UI6.3** The implementation must remain compatible with the existing design-token direction implied by `ui.pen` variables (background, border, sidebar-related tokens), without requiring exact 1:1 variable naming.

### FR-UI7: Responsiveness and Usability

- **FR-UI7.1** The layout must be usable at desktop widths and remain functionally readable at reduced widths.
- **FR-UI7.2** At constrained widths, panel behavior must prioritize preserving center outliner usability while maintaining discoverable sidebar/inspector access.
- **FR-UI7.3** Panel boundaries and section grouping must remain visually clear via spacing, borders, and/or background separation.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-UI1 | Shell must render without layout shift loops or overflow that blocks core interaction at normal desktop sizes |
| NFR-UI2 | Styling approach must be maintainable and consistent with Tailwind v4 conventions |
| NFR-UI3 | Structure should be implementation-ready for future wiring to Electron IPC/data model without redesigning the shell |
| NFR-UI4 | Draggable/non-draggable region boundaries must be explicit and consistent to avoid accidental control interaction during drag |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-UI1 | The renderer displays a three-zone shell matching sidebar/outliner/inspector intent from `ui.pen`, with an optional right utility panel |
| AC-UI2 | Width contract is met at baseline desktop size: 240px left, flexible center based on design baseline, and 320px right when utility panel is enabled |
| AC-UI3 | Each panel contains a distinct header and content area |
| AC-UI4 | Tailwind CSS v4 is the active styling system for this shell implementation |
| AC-UI5 | Layout remains usable on narrower windows with center panel prioritized |
| AC-UI6 | Visual separation between panels and sections is clear and consistent |
| AC-UI7 | Right utility panel can be hidden while center workspace remains fully usable |
| AC-UI8 | Desktop title-bar drag regions are present on both top header and left-edge header strip, while interactive controls are non-draggable |
| AC-UI9 | Sidebar supports expanded and collapsed densities with expected information density differences |
| AC-UI10 | Slide-in left side panel is driven by mode state and supports `system-settings` mode |

---

## Out of Scope

- Wiring real business data into the panels
- Implementing outliner editing interactions beyond static layout scaffolding
- Inspector form logic and persistence
- IPC command execution and backend integration
- Theming parity for all `ui.pen` theme variants
