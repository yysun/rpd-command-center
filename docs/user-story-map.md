# User Story Map — RPD Command Center

- Core: Foundations #activity
  - Project Setup #task
    - Define requirements #story
      status:: done
      slug:: define-requirements
      - 2026-03-02 → req-story-map-manager.md
    - Scaffold monorepo and core package #story
      status:: todo
      slug:: scaffold-core-package
    - Configure core build toolchain #story
      status:: todo
      slug:: configure-core-build
  - Data Model & Types #task
    - Define Activity / Task / Story type hierarchy #story
      status:: todo
      slug:: define-type-hierarchy
    - Define Story fields schema (status, slug, notes, doc refs) #story
      status:: todo
      slug:: define-story-fields-schema
  - Parser #task
    - Parse markdown outline into internal model #story
      status:: todo
      slug:: parse-markdown-to-model
    - Parse Form A inline properties (key:: value) #story
      status:: todo
      slug:: parse-form-a-properties
    - Parse Form B legacy property patterns #story
      status:: todo
      slug:: parse-form-b-legacy
    - Round-trip fidelity tests #story
      status:: todo
      slug:: parser-round-trip-tests
  - Serializer #task
    - Serialize model to Markdown (Preserve Existing mode) #story
      status:: todo
      slug:: serialize-preserve-existing
    - Serialize model to Markdown (Normalize mode) #story
      status:: todo
      slug:: serialize-normalize
    - Atomic write (write-temp + rename) #story
      status:: todo
      slug:: atomic-save
    - Create .bak backup on save #story
      status:: todo
      slug:: backup-on-save

- Core: File & Workspace #activity
  - IPC Handlers #task
    - IPC: open workspace folder #story
      status:: todo
      slug:: ipc-open-workspace
    - IPC: watch file for external changes #story
      status:: todo
      slug:: ipc-watch-file
    - IPC: atomic save and backup #story
      status:: todo
      slug:: ipc-atomic-save
  - Business Logic #task
    - Full-text search algorithm (title, slug, notes, doc filenames) #story
      status:: todo
      slug:: search-algorithm
    - Status and doc-coverage filter logic #story
      status:: todo
      slug:: filter-logic
    - Slug uniqueness validation #story
      status:: todo
      slug:: slug-validation-logic
    - Progress metrics (counts, percent-done) #story
      status:: todo
      slug:: metrics-logic

- Frontend Design #activity
  - Layout & Design System #task
    - Define three-panel layout (sidebar / outliner / inspector) #story
      status:: todo
      slug:: design-three-panel-layout
    - Choose color palette and typography #story
      status:: todo
      slug:: design-color-typography
    - Design component library (chips, dropdowns, buttons) #story
      status:: todo
      slug:: design-component-library
  - Outliner & Inspector Wireframes #task
    - Outliner block row design (activity, task, story with chips) #story
      status:: todo
      slug:: wireframe-outliner-block
    - Inspector panel field layout #story
      status:: todo
      slug:: wireframe-inspector-panel
    - Collapsed and expanded node states #story
      status:: todo
      slug:: wireframe-collapse-expand
  - Search & Focus Wireframes #task
    - Search bar and filter panel design #story
      status:: todo
      slug:: wireframe-search-filter
    - Focus mode / zoom view layout #story
      status:: todo
      slug:: wireframe-focus-mode
    - Progress summary card design #story
      status:: todo
      slug:: wireframe-progress-summary

- Frontend: App Shell #activity
  - Electron Setup #task
    - Scaffold Electron app #story
      status:: todo
      slug:: scaffold-electron-app
    - Configure renderer build toolchain #story
      status:: todo
      slug:: configure-build-toolchain
    - Set up IPC preload bridge #story
      status:: todo
      slug:: setup-ipc-preload
  - Workspace & File Loading UI #task
    - Open workspace folder dialog #story
      status:: todo
      slug:: open-workspace-folder
    - Choose story map file UI #story
      status:: todo
      slug:: choose-story-map-file
    - Render basic story hierarchy #story
      status:: todo
      slug:: render-basic-hierarchy
    - Detect external file changes and prompt reload #story
      status:: todo
      slug:: detect-external-file-change

- Frontend: Outliner #activity
  - Block Rendering #task
    - Display nested Activity → Task → Story outline #story
      status:: todo
      slug:: render-nested-outline
    - Show inline chips on story lines #story
      status:: todo
      slug:: story-inline-chips
    - Collapse and expand activity/task nodes #story
      status:: todo
      slug:: collapse-expand-nodes
  - Block Editing #task
    - Create new sibling block with Enter #story
      status:: todo
      slug:: create-sibling-block
    - Delete block with confirmation for non-empty nodes #story
      status:: todo
      slug:: delete-block-confirm
    - Edit block title inline #story
      status:: todo
      slug:: edit-block-inline
  - Block Restructuring #task
    - Indent block (Tab to re-parent as child) #story
      status:: todo
      slug:: indent-block
    - Outdent block (Shift+Tab) #story
      status:: todo
      slug:: outdent-block
    - Drag-and-drop reorder within same parent #story
      status:: todo
      slug:: drag-drop-reorder
    - Move block across tasks and activities #story
      status:: todo
      slug:: move-block-cross-parent
  - Undo / Redo #task
    - Undo last outliner edit #story
      status:: todo
      slug:: undo-edit
    - Redo undone edit #story
      status:: todo
      slug:: redo-edit

- Frontend: Inspector & Validation #activity
  - Inspector Panel #task
    - Open inspector when story block is selected #story
      status:: todo
      slug:: open-inspector-on-select
    - Edit story title from inspector #story
      status:: todo
      slug:: inspector-edit-title
    - Change story status via dropdown #story
      status:: todo
      slug:: inspector-edit-status
    - Edit story notes (multiline) #story
      status:: todo
      slug:: inspector-edit-notes
  - Slug Management #task
    - Edit slug from inspector #story
      status:: todo
      slug:: inspector-edit-slug
    - Validate slug uniqueness across all stories #story
      status:: todo
      slug:: validate-slug-uniqueness
    - Restrict slug to a-z0-9- characters #story
      status:: todo
      slug:: validate-slug-chars
  - Doc Refs #task
    - Add doc ref to a story #story
      status:: todo
      slug:: add-doc-ref
    - Edit existing doc ref #story
      status:: todo
      slug:: edit-doc-ref
    - Remove doc ref from a story #story
      status:: todo
      slug:: remove-doc-ref
    - Open linked doc in system default editor #story
      status:: todo
      slug:: open-doc-external
    - Copy doc ref path to clipboard #story
      status:: todo
      slug:: copy-doc-ref-path
  - Inspector Actions #task
    - Mark story as done from inspector #story
      status:: todo
      slug:: inspector-mark-done
    - Move story via task/activity picker #story
      status:: todo
      slug:: inspector-move-story
    - Duplicate story block #story
      status:: todo
      slug:: inspector-duplicate-story
    - Copy story as Markdown block #story
      status:: todo
      slug:: inspector-copy-as-markdown

- Frontend: Search & Filters #activity
  - Search #task
    - Full-text search across title, slug, notes, doc filenames #story
      status:: todo
      slug:: full-text-search
    - Highlight matching text in results #story
      status:: todo
      slug:: search-highlight-results
  - Filters #task
    - Filter stories by status (multi-select) #story
      status:: todo
      slug:: filter-by-status
    - Filter by doc coverage (none / has REQ / has PLAN / has DONE) #story
      status:: todo
      slug:: filter-by-doc-coverage
    - Filter to tasks with unfinished stories only #story
      status:: todo
      slug:: filter-unfinished-tasks
    - Save named filter presets #story
      status:: todo
      slug:: save-filter-presets
  - Saved Queries #task
    - Built-in "Doing" query #story
      status:: todo
      slug:: query-doing
    - Built-in "No Docs" query #story
      status:: todo
      slug:: query-no-docs
    - Built-in "Touched Recently" query #story
      status:: todo
      slug:: query-touched-recently
    - Built-in "By Status" query #story
      status:: todo
      slug:: query-by-status

- Frontend: Zoom & Focus Mode #activity
  - Focused View #task
    - Click activity or task to enter focused view #story
      status:: todo
      slug:: enter-focus-mode
    - Show only children of focused node #story
      status:: todo
      slug:: focus-show-children
    - Navigate back to full outline from focus mode #story
      status:: todo
      slug:: focus-back-navigation
  - Focus Summaries #task
    - Display status counts in focused view #story
      status:: todo
      slug:: focus-status-counts
    - Display percent-done in focused view #story
      status:: todo
      slug:: focus-percent-done
    - Display doc-coverage summary in focused view #story
      status:: todo
      slug:: focus-doc-coverage
    - List aggregated clickable doc refs in focused view #story
      status:: todo
      slug:: focus-doc-refs-list

- Frontend: Doc Templates #activity
  - Template Workflow #task
    - Create REQ doc from template via inspector action #story
      status:: todo
      slug:: create-req-from-template
    - Create PLAN doc from template via inspector action #story
      status:: todo
      slug:: create-plan-from-template
    - Create DONE doc from template via inspector action #story
      status:: todo
      slug:: create-done-from-template
    - Auto-insert doc ref into story after creation #story
      status:: todo
      slug:: auto-link-doc-ref
  - Template Configuration #task
    - Generate filename as {type}-{slug}.md #story
      status:: todo
      slug:: template-filename-gen
    - Place generated doc under {date}/ folder #story
      status:: todo
      slug:: template-date-folder
    - Allow user to configure custom Markdown templates #story
      status:: todo
      slug:: configurable-templates

- Polish & Configuration #activity
  - Format Mode #task
    - Add "Format Mode" setting (Preserve Existing / Normalize) #story
      status:: todo
      slug:: format-mode-setting
    - Preserve Existing: minimize diff churn on save #story
      status:: todo
      slug:: preserve-existing-format
    - Normalize to Properties: rewrite fields to key:: value on save #story
      status:: todo
      slug:: normalize-to-properties
    - Persist format mode preference across sessions #story
      status:: todo
      slug:: persist-format-mode
  - Progress Metrics #task
    - Show status counts on activity and task nodes #story
      status:: todo
      slug:: node-status-counts
    - Show percent-done indicator on activity and task nodes #story
      status:: todo
      slug:: node-percent-done
  - Reliability & UX #task
    - Configurable backup-on-save toggle #story
      status:: todo
      slug:: configurable-backup
    - Keyboard shortcuts cheat sheet overlay #story
      status:: todo
      slug:: keyboard-shortcut-cheatsheet
    - Error panel for parse warnings and import issues #story
      status:: todo
      slug:: parse-error-panel
