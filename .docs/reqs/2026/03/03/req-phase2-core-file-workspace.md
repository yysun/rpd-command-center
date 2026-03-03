# REQ — Core: File & Workspace (Phase 2)

**Date:** 2026-03-03
**Phase:** 2 — Core: File & Workspace
**Source:** `docs/req-story-map-manager.md`
**Status:** Draft

---

## Context

Phase 2 adds the Electron main-process and headless workspace capabilities that sit between the renderer UI and the Phase 1 `core/` parser/serializer/I/O library.

This phase is responsible for:
- File and workspace lifecycle actions (open folder, choose story-map file, read/save/watch)
- Query and filtering logic used by future UI phases
- Validation and aggregate metrics required by inspector and focus views

The output remains local-first and offline, with the Markdown file as the only source of truth.

---

## Scope

### In Scope

- Main-process IPC contracts for workspace and story-map file operations
- External modification detection and reload signaling
- Headless search/filter/query computation over parsed story-map data
- Slug validation and uniqueness checks
- Progress and document-coverage aggregate metrics

### Out of Scope

- Renderer UI rendering and interactions
- Persistent settings UI
- Git operations and collaboration workflows
- Multi-file story-map data stores

---

## Functional Requirements

### FR-W1: Workspace and File Lifecycle IPC

- **FR-W1.1** The app must allow selecting a workspace folder through an OS-native dialog.
- **FR-W1.2** The app must allow selecting one Markdown file within the workspace as the active story map.
- **FR-W1.3** The app must return enough metadata for the renderer to identify selected workspace and active file.
- **FR-W1.4** The app must load and parse the active story-map file and return a structured `StoryMap` payload.
- **FR-W1.5** Save operations must serialize the in-memory `StoryMap` using caller-selected format mode (`preserve` or `normalize`).
- **FR-W1.6** Save operations must use atomic write semantics and optional backup behavior.
- **FR-W1.7** Save failure responses must contain actionable error information without corrupting the source file.

### FR-W2: External Change Detection

- **FR-W2.1** The app must monitor the active story-map file for external modifications while it is open.
- **FR-W2.2** On external change, the app must notify the renderer through an asynchronous event channel.
- **FR-W2.3** Notifications must include file identity so the renderer can confirm it applies to the current file.
- **FR-W2.4** The app must support stopping or replacing active watchers when switching files/workspaces.
- **FR-W2.5** File watch failures must be surfaced to the renderer as recoverable errors/events.

### FR-W3: Full-Text Search

- **FR-W3.1** Search must operate over story `title`, `slug`, `notes`, and doc-ref filenames.
- **FR-W3.2** Search must be case-insensitive.
- **FR-W3.3** Search results must identify matching story IDs and allow deterministic ordering.
- **FR-W3.4** Empty search input must be treated as no text filter.

### FR-W4: Status and Doc-Coverage Filters

- **FR-W4.1** Status filters must support multi-select for `todo`, `doing`, and `done`.
- **FR-W4.2** Doc-coverage filters must support: `none`, `has-req`, `has-plan`, `has-done`.
- **FR-W4.3** Filters must compose with text search (logical AND behavior).
- **FR-W4.4** The system must support an unfinished-work filter that retains only tasks with at least one non-done story.

### FR-W5: Slug Validation

- **FR-W5.1** Slug format validation must enforce allowed characters: `a-z0-9-`.
- **FR-W5.2** Slug uniqueness validation must be evaluated across all stories in the active story map.
- **FR-W5.3** Validation responses must identify the conflicting story IDs for duplicate slugs.
- **FR-W5.4** Validation behavior must support create/edit flows (ability to exclude the current story ID during uniqueness checks).

### FR-W6: Progress and Coverage Metrics

- **FR-W6.1** The system must compute status counts (`todo`, `doing`, `done`) for Activity and Task levels.
- **FR-W6.2** The system must compute percent-done metrics for Activity and Task levels.
- **FR-W6.3** Percent-done must be based on total story count at that node scope.
- **FR-W6.4** The system must compute doc-coverage summaries (stories with docs vs missing docs) for Activity and Task levels.
- **FR-W6.5** Metrics output must be deterministic and stable for equivalent input model data.

### FR-W7: IPC Contract Quality

- **FR-W7.1** IPC APIs must provide typed request/response shapes suitable for renderer integration.
- **FR-W7.2** Business-logic APIs must be UI-agnostic and testable in a Node environment.
- **FR-W7.3** The API surface must include explicit success/error results for all file and compute operations.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-W1 | All Phase 2 capabilities run fully offline with no network dependency |
| NFR-W2 | External-change detection event delivery should feel near real-time for local edits |
| NFR-W3 | Search/filter operations must remain interactive for files in the target range (2k-10k blocks) |
| NFR-W4 | File operations must never leave a partially written story-map file |
| NFR-W5 | Headless business logic remains independent of renderer framework concerns |
| NFR-W6 | IPC and logic modules are covered by automated tests in Node/Vitest |
| NFR-W7 | File-watch notifications should be coalesced for rapid save bursts to avoid duplicate reload prompts |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-W1 | User can pick a workspace folder and select a Markdown story-map file through IPC contracts |
| AC-W2 | Loading returns a parsed `StoryMap` model from the selected file |
| AC-W3 | Saving with chosen format mode uses atomic semantics and optional backup behavior |
| AC-W4 | External edits to the selected file trigger a renderer-consumable reload notification |
| AC-W5 | Search across title/slug/notes/doc filenames returns correct story matches |
| AC-W6 | Combined status/doc/text filters return correct reduced story sets |
| AC-W7 | Slug validation flags invalid characters and duplicates with conflict identity |
| AC-W8 | Activity and Task metrics expose status counts and percent-done correctly |
| AC-W9 | Phase 2 test suite verifies IPC contracts and headless logic behavior |

---

## Open Questions

1. What default coalescing window should be used for rapid file-watch event bursts (for example: 150-300 ms)?

---

## AR Decisions (2026-03-03)

- `percent-done` for zero-story nodes is defined as `0`.
- Doc-coverage filters are strict and type-specific:
	- `none` = story has zero doc refs.
	- `has-req` = story has at least one `REQ` doc ref.
	- `has-plan` = story has at least one `PLAN` doc ref.
	- `has-done` = story has at least one `DONE` doc ref.
- Search and filter output ordering must be deterministic and stable by story-map hierarchy order.
