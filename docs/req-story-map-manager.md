# REQ — User Story Map Manager

**Date:** 2026-03-02  
**Source:** `docs/prd.md`  
**Status:** Draft

---

## Target Users

Engineers and PMs using the RPD workflow who want to edit stories with the fluidity of a note-taking tool (outline) while preserving enough structure for automation and linking to REQ/PLAN/DONE artifacts.

---

## Assumptions & Constraints

- Source of truth is a **single Markdown file** (e.g., `user-story-map.md`); multi-file vaults are out of scope for v1.
- The file must remain **human-editable** in any text editor at all times.
- The app runs as a local **Electron desktop application**; no server or background daemon is required.
- No network access is required for any v1 feature.

---

## Overview

A desktop application for viewing, editing, and managing a project's User Story Map stored as a Markdown file. The editing experience is outliner-first (keyboard-driven, nested blocks) with a structural inspector panel for story metadata. The app must faithfully round-trip the source Markdown so the file remains human-editable outside the app.

---

## Scope

### In Scope (v1)
- Open a local workspace folder and select a Markdown story map file
- Render the story hierarchy as an interactive nested outliner
- Edit story metadata through a side inspector panel
- Search and filter stories
- Generate REQ/PLAN/DONE documents from templates and link them into stories
- Atomic file saves with backup
- Detect external file changes and prompt reload

### Out of Scope (v1)
- Multi-user collaboration or cloud sync
- Git commit/push/branch management
- Full Logseq graph database or cross-file backlinks
- Kanban board view as primary editor

---

## Development Phases

The project is split into three layers — **Core**, **Frontend Design**, and **Frontend Implementation** — so the data/logic layer can be built and tested independently before any UI work begins.

### Phase 1 — Core: Foundations
Pure TypeScript library (`core/` package). No Electron or UI dependencies.
- Define `Activity / Task / Story` type hierarchy and Story fields schema
- Markdown parser supporting Form A (`key:: value`) and Form B legacy patterns
- Markdown serializer with Preserve Existing and Normalize modes
- Atomic write (write-temp + rename) and `.bak` backup logic

### Phase 2 — Core: File & Workspace
Electron main-process IPC handlers and headless business logic.
- IPC handlers: open workspace folder, watch file for external changes, atomic save
- Full-text search algorithm, status/doc-coverage filter logic
- Slug uniqueness validation, progress metrics (counts, percent-done)

### Phase 3 — Frontend Design
Design deliverables that drive Phase 4–9 implementation (can run in parallel with Phase 2).
- Three-panel layout definition (sidebar / outliner / inspector)
- Color palette, typography, and component library (chips, dropdowns, buttons)
- Wireframes: outliner block rows, inspector field layout, collapsed/expanded states
- Wireframes: search/filter panel, timeline view, and user story map board

### Phase 4 — Frontend: App Shell
Electron + Vite + React renderer scaffold wired to the core IPC layer.
- Scaffold Electron app, configure renderer build toolchain
- IPC preload bridge
- Workspace folder dialog, story map file picker, basic hierarchy render
- External-file-change prompt (reload dialog)

### Phase 5 — Frontend: Outliner
Interactive nested outliner (FR-2).
- Block rendering with inline chips; collapse/expand
- Block editing: Enter to add sibling, inline title edit, delete with confirmation
- Block restructuring: Tab/Shift+Tab indent/outdent, drag-drop, cross-parent move
- Undo/redo (in-session)

### Phase 6 — Frontend: Inspector & Validation
Right-side inspector panel and slug/doc-ref validation (FR-3).
- Inspector panel with Title, Status, Slug, Notes, Doc Refs fields
- Slug uniqueness and character validation surfaced in UI
- Doc ref CRUD; open in system editor; copy path
- Inspector actions: Mark Done, Move, Duplicate, Copy as Markdown

### Phase 7 — Frontend: Search & Filters
Search bar, filter panel, and saved queries (FR-4).
- Full-text search with highlight
- Multi-select status filter, doc-coverage filter, unfinished-tasks filter
- Named filter presets; built-in queries (Doing, No Docs, Touched Recently, By Status)

### Phase 8 — Frontend: Timeline View
Logseq-journal-like chronological workflow for story work tracking (FR-5).
- Timeline view grouped by date (journal-style)
- Show story/task updates as chronological entries with quick jump-to-node
- Date navigation (previous/next/today) and timeline filtering

### Phase 9 — Frontend: User Story Map View
Story map board view based on Activities -> Tasks -> Release Slice (FR-8).
- Visual lanes with Activities at top and Tasks as the middle lane (instead of Backbone)
- Release Slice cards aligned under Tasks for planning and sequencing
- Click-to-focus from map cards back to outliner/inspector context

### Phase 10 — Polish & Configuration
Format mode setting, progress metrics display, and UX reliability (FR-6b, FR-7).
- Format Mode setting (Preserve Existing / Normalize) persisted across sessions
- Status counts and percent-done indicators on Activity/Task nodes
- Configurable backup toggle, keyboard shortcuts overlay, parse-error panel

---

## Data Model

The source of truth is a single Markdown file (e.g., `user-story-map.md`).

### Hierarchy
```
User Story Map
└── Activity
    └── Task
        └── Story
```

### Story Fields
Each story carries:
| Field | Values / Format |
|-------|----------------|
| `title` | Free text |
| `status` | `todo \| doing \| done` |
| `slug` | `a-z0-9-`, unique across all stories |
| `notes` | Free text (multiline) |
| `doc refs` | One or more: `{ type: REQ\|PLAN\|DONE, date: YYYY-MM-DD, filename: string }` |

### Markdown Encoding (two supported forms)
- **Form A — Inline properties:** `key:: value` (Logseq-style)
  ```
  status:: doing
  slug:: user-login
  req:: 2026-02-25/req-user-login.md
  ```
- **Form B — Legacy/existing patterns:** `status:`, `slug:`, doc lines as found in pre-existing files

A **Format Mode** setting controls behavior on save:
- `Preserve Existing` (default): retain original style/layout
- `Normalize to Properties`: rewrite all stories to Form A

---

## Functional Requirements

### FR-1: File Management
- **FR-1.1** Open a workspace folder from the OS file dialog
- **FR-1.2** Choose which Markdown file is the active story map
- **FR-1.3** Parse the chosen file and render the story hierarchy
- **FR-1.4** Save changes atomically (write to temp file, then rename)
- **FR-1.5** Create a `.bak` backup on each save (configurable on/off)
- **FR-1.6** Detect external file modifications; prompt the user to reload
- **FR-1.7** Never leave the file in a corrupted or partially-written state

### FR-2: Outliner Editing
- **FR-2.1** Display stories in a nested outline: Activity → Task → Story
- **FR-2.2** Each story line shows inline chips: status pill, slug, and doc-ref chips (REQ/PLAN/DONE)
- **FR-2.3** Create a new sibling block with **Enter**
- **FR-2.4** Indent (re-parent as child) with **Tab**; outdent with **Shift+Tab**
- **FR-2.5** Drag and drop to reorder blocks within the same parent
- **FR-2.6** Move blocks across tasks or activities
- **FR-2.7** Delete blocks (with confirmation when block has children)
- **FR-2.8** Undo/redo for all outliner edits (in-session; persistent undo is post-v1)

### FR-3: Inspector Panel
- **FR-3.1** Opens when a Story block is selected (right-side panel)
- **FR-3.2** Editable fields: Title, Status (dropdown), Slug, Notes (multiline)
- **FR-3.3** Slug validation: unique across all stories; characters restricted to `a-z0-9-`
- **FR-3.4** Doc refs list: add, edit, remove; each entry shows type/date/filename
- **FR-3.5** Open a linked doc in the system default editor or internal viewer
- **FR-3.6** Copy a doc ref path to clipboard
- **FR-3.7** Inspector actions: Mark Done, Move (task/activity picker), Duplicate, Copy as Markdown block

### FR-4: Search and Filters
- **FR-4.1** Full-text search across title, slug, notes, and doc filenames
- **FR-4.2** Filter by status (multi-select: todo / doing / done)
- **FR-4.3** Filter by doc coverage: none / has REQ / has PLAN / has DONE
- **FR-4.4** Filter to show only tasks with unfinished stories
- **FR-4.5** Save and recall named filter presets
- **FR-4.6** Built-in saved queries: "Doing", "No Docs", "Touched Recently", "By Status"

### FR-5: Timeline View
- **FR-5.1** Render a journal-style timeline grouped by date (most recent first)
- **FR-5.2** Each timeline entry links back to its source Activity/Task/Story node
- **FR-5.3** Timeline entries include key change metadata (status change, doc ref added, title edit)
- **FR-5.4** Date navigation supports previous day, next day, and jump to today
- **FR-5.5** Timeline view supports filters by status and doc coverage

### FR-6: Doc Template Workflow
- **FR-6.1** "Create REQ/PLAN/DONE doc" action available from the Inspector
- **FR-6.2** Generated filename format: `{type}-{slug}.md` (e.g., `req-user-login.md`)
- **FR-6.3** File is placed under `{today's-date}/` folder by default (configurable)
- **FR-6.4** After creation the doc ref is automatically inserted into the story
- **FR-6.5** Templates are user-configurable (plain Markdown template files)

### FR-6b: Format Mode Setting
- **FR-6b.1** A user-accessible "Format Mode" setting controls how stories are serialized on save
- **FR-6b.2** `Preserve Existing` (default): retain the original Markdown style/layout as closely as possible; minimize diff churn
- **FR-6b.3** `Normalize to Properties`: rewrite all story fields to Form A (`key:: value`) on save
- **FR-6b.4** The setting is persisted across sessions

### FR-7: Progress Metrics
- **FR-7.1** Activity and Task nodes display status counts (todo / doing / done) inline
- **FR-7.2** Percent-done indicator visible on Activity and Task nodes
- **FR-7.3** Query views for "Doing" and "No Docs" render as grouped outlines (not cards)

### FR-8: User Story Map View
- **FR-8.1** Provide a board layout with lanes in this order: Activities (top), Tasks (middle), Release Slice (bottom)
- **FR-8.2** Tasks lane replaces the traditional Backbone lane terminology in UI labels
- **FR-8.3** Release Slice cards are positioned under related Tasks for planning sequence visibility
- **FR-8.4** Clicking a card opens the corresponding node context in outliner/inspector
- **FR-8.5** Board supports horizontal scrolling for larger maps while preserving lane headers

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Interaction latency < 50 ms for typical edits (target file size: 2k–10k blocks) |
| NFR-2 | Never corrupt the markdown file; always recoverable via backup |
| NFR-3 | Runs on macOS, Windows, and Linux |
| NFR-4 | Fully offline; no network connection required |
| NFR-5 | Keyboard-first navigation throughout; all core actions reachable without a mouse |

---

## UI Layout

```
┌────────────┬──────────────────────────┬─────────────────┐
│  Sidebar   │        Outliner          │   Inspector     │
│            │                          │   (story sel.)  │
│ - Pages    │  ▶ Activity              │                 │
│ - Queries  │    ▶ Task                │  Title: ______  │
│            │      • Story [doing]     │  Status: doing  │
│            │        slug: foo         │  Slug: foo      │
│            │      • Story [todo]      │  Docs: ...      │
│            │                          │  Notes: ______  │
└────────────┴──────────────────────────┴─────────────────┘
```

- **Left sidebar:** page list + saved query links
- **Center outliner:** nested Activity → Task → Story blocks with inline chips
- **Right inspector:** structured fields for selected Story block

### Phase 9 Wireframe — User Story Map View

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Activities                                                                                         │
│  [Activity A]   [Activity B]              [Activity C]                    [Activity D]             │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tasks                                                                                              │
│  [Task A1] [Task A2] [Task B1] [Task C1] [Task C2] [Task D1] [Task D2]                            │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Release Slice                                                                                      │
│  [R1]      [R1]      [R1]      [R1]      [R2]      [R2]      [R2]                                 │
│  [R2]      [R2]      [R2]      [R2]                [R3]      [R3]                                 │
│            [R3]                                            [R4]                                     │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Lane 1:** Activities are high-level journey blocks
- **Lane 2:** Tasks are the backbone-equivalent planning lane label for this product
- **Lane 3:** Release Slice cards group delivery increments under related Tasks

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | Open `user-story-map.md` and correctly render Activities, Tasks, and Stories |
| AC-2 | Edit story status/slug/doc refs via Inspector, save, and the Markdown remains human-readable and structurally consistent |
| AC-3 | Indent/outdent and drag-drop correctly move stories between tasks; saved file reflects new structure |
| AC-4 | Search and filter by status and "missing docs" return correct results |
| AC-5 | Timeline view renders date-grouped entries and each entry can navigate to its source node |
| AC-6 | User Story Map view renders Activities/Tasks/Release Slice lanes with Tasks as the middle lane label |
| AC-7 | Create a REQ or PLAN doc from template; link is automatically added to the story |
| AC-8 | Atomic saves + backup guarantee the file is never corrupted, even on an unclean shutdown |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to update a story (status + doc link) | < 10 seconds (keyboard-first path) |
| Saves producing unwanted large diffs | < 5% (user-reported) |
| File corruption incidents | Zero |
| User adoption over manual Markdown editing | ≥ 70% of active sessions (self-reported) |

---

## Open Questions

1. Single canonical Markdown format on save, or default to "Preserve Existing" (already recommended in PRD)?
2. Embed a minimal Markdown viewer for linked docs inside the app, or always delegate to the system editor?
3. Persistent undo history (across sessions) or in-session only for v1?
