# PRD — User Story Map Manager (Outliner-First, Logseq-Style) for Agent-World

## 1) Summary

Build an **Electron desktop app** to **view, edit, and manage** the project’s **User Story Map** stored as **Markdown**. The primary editing experience is a **Logseq-style outliner** (keyboard-first, nested blocks), with a **right-side inspector** for structured fields (status/slug/doc refs). The app must **round-trip** the Markdown faithfully so manual editing remains viable.

## 2) Goals

* **Outliner-first editing** for Activities → Tasks → Stories.
* **Structured story fields** without abandoning Markdown:

  * `status` (`todo|doing|done`)
  * `slug` (unique)
  * doc references (REQ/PLAN/DONE with date + filename)
  * notes/tags (free text)
* **Fast navigation**: search, filters, saved queries, and “zoom into block”.
* **Doc workflow support**: open linked docs, create new docs from templates, and keep links consistent.
* **Reliability**: safe writes, undo/redo, change history.

## 3) Non-goals (v1)

* Multi-user collaboration / cloud sync
* Git operations (commit/push/branch management)
* Full Logseq graph database / backlinks across an entire vault
* A full Kanban implementation as the primary editor (cards can be a later derived view)

## 4) Target Users

* Engineers / PMs using the RPD workflow who want:

  * “Edit stories like notes” (outline)
  * Still keep structure for automation and linking to REQ/PLAN/DONE artifacts

## 5) Assumptions & Constraints

* Source of truth is a single Markdown file (e.g., `user-story-map.md`).
* App must preserve human-editability.
* Electron app, local filesystem access (workspace folder).
* No background daemon required.

---

## 6) User Experience (Latest Design)

### 6.1 Main Layout (3 panes)

**A) Left Sidebar**

* Pages (at minimum):

  * `User Story Map` (main)
  * optionally per-activity “pages” generated/linked
* Saved Queries:

  * Doing
  * No Docs
  * Touched Recently
  * By Status
* Drafts/Inbox (optional v1.1)

**B) Center: Outliner**

* Nested blocks:

  * Activity block

    * Task block

      * Story block(s)
* Inline chips on story lines:

  * `[todo|doing|done]` status pill
  * `slug: ...` small mono
  * `REQ/PLAN/DONE` chips when doc refs exist
* Keyboard-first editing:

  * Enter: new sibling block
  * Tab / Shift+Tab: indent/outdent (re-parent)
  * Drag & drop: reorder / move between tasks/activities

**C) Right: Inspector**

* Opens when selecting a Story block
* Edits:

  * Title
  * Status dropdown
  * Slug (unique validation)
  * Doc refs list (type/date/file + open)
  * Notes (multiline)
* Actions:

  * Mark Done
  * Move (picker)
  * Duplicate
  * Create REQ/PLAN/DONE doc from template
  * Copy as Markdown block

### 6.2 Zoom / Focus Mode (Block zoom)

* Clicking an Activity or Task opens a focused view showing:

  * its children blocks only
  * progress summary (counts by status)
  * docs coverage summary (has docs / missing docs)
  * aggregated doc refs list (clickable)

### 6.3 Query Views (Derived lists)

Queries render results as an outline (grouped), not cards:

* “Doing stories grouped by Activity”
* “Stories missing REQ/PLAN”
* “Timeline by doc date” (v1.1 if time)

---

## 7) Markdown Data Format

### 7.1 Canonical hierarchy

* H1: `# User Story Map` (optional but supported)
* Activity: heading or bullet block
* Task: nested under activity
* Story: nested under task

### 7.2 Story fields encoding (two acceptable forms)

To support round-trip with minimal friction, we support **both**:

**Form A — Inline properties (Logseq-like)**

* `status:: todo|doing|done`
* `slug:: some-slug`
* `req:: 2026-02-25/req-something.md`
* `plan:: 2026-02-25/plan-something.md`
* `done:: 2026-02-26/done-something.md`

**Form B — Current file’s structure (existing)**

* If your current file uses patterns like `status:`, `slug:`, and explicit doc lines, the parser should map them to the internal model and the writer should preserve the original style as much as possible.

> Implementation note: Provide a “Format Mode” setting:
>
> * “Preserve Existing” (default): keep original layout/wording if possible.
> * “Normalize to Properties”: rewrite stories into Form A on save.

### 7.3 Doc ref model

Each doc ref includes:

* type: `REQ | PLAN | DONE`
* date: `YYYY-MM-DD`
* filename: string
* optional: relative path base (project-configured)

---

## 8) Functional Requirements

### 8.1 File operations

* Open workspace folder
* Choose story map markdown file
* Load → parse → render outline
* Save changes:

  * atomic write (write temp + rename)
  * create `.bak` backup on each save (configurable)
* Detect external modifications:

  * prompt to reload / merge (v1 can “reload with warning”; merge can be v1.1)

### 8.2 Outliner editing

* Create/edit/delete blocks at any level
* Indent/outdent (re-parent)
* Drag-drop reorder within same parent
* Move blocks across tasks/activities
* Undo/redo (at least in-session; optional persistent history)

### 8.3 Story editing (Inspector)

* Edit title, status, slug, notes
* Slug validation:

  * uniqueness across all stories
  * allowed characters (recommend: `a-z0-9-`)
* Doc refs:

  * add/remove/edit
  * open doc in editor (system default or internal viewer)
  * copy relative path

### 8.4 Search & filters

* Search: title, slug, notes, doc filenames
* Filters:

  * status multi-select
  * has docs (none / has req / has plan / has done)
  * “only tasks with unfinished stories”
* Persist filter presets

### 8.5 Doc templates (v1)

* “Create REQ/PLAN/DONE doc from template”

  * generates filename based on slug: e.g. `req-{slug}.md`
  * places under `{date}/` folder (today’s date by default)
  * inserts a link/doc ref into the story
* Templates are configurable (simple markdown templates)

### 8.6 Progress metrics (in UI)

* Activity and Task nodes show:

  * counts by status
  * percent done
* Query view “Doing” and “No Docs”

---

## 9) Non-functional Requirements

* **Performance**: handle 2k–10k blocks with responsive editing (target < 50ms interaction latency typical)
* **Reliability**: never corrupt the markdown file; always recoverable via backup
* **Portability**: macOS/Windows/Linux
* **Offline-first**: no network required
* **Accessibility**: keyboard-first navigation and editing

---

## 10) Data & Architecture

### 10.1 Internal model (in-memory)

* Activity { id, title, order }
* Task { id, activityId, title, order }
* Story { id, taskId, title, status, slug, notes, order }
* DocRef { id, storyId, type, date, filename }

### 10.2 Parser/Writer strategy

* Parse markdown into an AST (recommended: `remark` / `mdast`)
* Identify hierarchy by headings/bullets indentation
* Extract fields from:

  * `key:: value` properties
  * legacy patterns (status/slug/docs)
* Writer:

  * preserve formatting where feasible
  * keep stable ordering
  * minimize diff churn (important for Git)

### 10.3 Electron app structure

* Main process:

  * file system operations (open/save/watch)
  * OS “open file” integration
* Renderer:

  * outliner editor UI
  * inspector panel UI
  * search/filter UI
* State management:

  * single source of truth store (document + selection + filters + undo stack)

---

## 11) Acceptance Criteria (v1)

1. Open an existing `user-story-map.md`, render Activities/Tasks/Stories correctly.
2. Edit a story status/slug/docs via Inspector, save, and the markdown remains human-readable and consistent.
3. Indent/outdent and drag-drop move stories between tasks; save reflects new structure.
4. Search and filter by status and “missing docs”.
5. Create a REQ or PLAN doc from template and automatically link it into the story.
6. Atomic saves + backup ensures file is never corrupted even on crash.

---

## 12) Success Metrics

* Time-to-update a story (status + doc link) under 10 seconds (keyboard-first)
* < 5% of saves produce “unwanted large diffs” (measured by user feedback)
* Zero reports of file corruption
* User adoption: used as primary editor over manual markdown editing by at least 70% of active sessions (self-reported)

---

## 13) Milestones

**M0 — Foundations**

* Electron scaffold, workspace open, file load/save, basic renderer

**M1 — Outliner core**

* Nested blocks editing, indent/outdent, reorder, undo/redo

**M2 — Inspector + validation**

* Story properties editing, slug uniqueness, doc refs

**M3 — Search/filters + queries**

* Doing / No Docs / By Status views

**M4 — Templates**

* Create REQ/PLAN/DONE, link back, open docs

**M5 — Polish**

* External file change warning, backups config, keyboard shortcuts cheat sheet

---

## 14) Risks & Mitigations

* **Markdown round-trip drift** (rewriter changes style too much)
  Mitigate: “Preserve Existing” mode + minimal-diff writer + golden test fixtures.
* **Ambiguous parsing** (users edit markdown freely)
  Mitigate: tolerant parser, clear error panel, and “best-effort import” with warnings.
* **Performance on large files**
  Mitigate: virtualized list rendering + incremental parsing on change (later).
* **Cross-platform file watching issues**
  Mitigate: debounced watch + explicit “Reload” UX.

---

## 15) Open Questions (for team to decide during implementation)

* Do we enforce a single canonical markdown format on save, or default to preserve?
* Do we embed a markdown viewer/editor for linked docs, or always open external editor?
* Do we store persistent history (timeline) or only in-session undo/redo for v1?

If you want, I can also produce a **dev-facing spec** with:

* exact markdown grammar examples,
* parser edge cases and test fixtures,
* and a concrete keyboard shortcut map (Logseq-like).
