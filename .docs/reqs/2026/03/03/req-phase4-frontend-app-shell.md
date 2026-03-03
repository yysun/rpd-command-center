# REQ — Frontend: App Shell (Phase 4)

**Date:** 2026-03-03
**Phase:** 4 — Frontend: App Shell
**Source:** `docs/req-story-map-manager.md`
**Status:** Draft

---

## Context

Phase 4 establishes the first usable renderer shell for the User Story Map Manager by wiring the Electron renderer to the existing core IPC surface.

This phase delivers the minimum end-to-end user flow needed to move from static shell to data-backed shell:
- Open a workspace folder
- Select an active story-map Markdown file
- Load and render the story hierarchy
- Detect external file changes and let the user reload

---

## Scope

### In Scope

- Electron + Vite + React renderer scaffold usable as the app shell
- Preload bridge contract available to renderer for Phase 4 file-management operations
- Workspace folder picker flow from renderer
- Story map file picker/selector flow from renderer
- Basic hierarchy render of Activity -> Task -> Story from parsed model
- External-file-change prompt with explicit reload decision

### Out of Scope

- Outliner editing commands (create/delete/reorder/indent/outdent)
- Inspector editing and validation workflows
- Search, filters, focus mode, and template generation
- Persistent UI preferences/configuration screens beyond shell needs

---

## Functional Requirements

### FR-SH1: App Shell Availability

- **FR-SH1.1** The desktop app must launch to a renderer shell that is ready for workspace/file actions.
- **FR-SH1.2** The shell must include clear UI affordances to open a workspace and choose an active story-map file.
- **FR-SH1.3** The shell must expose loading and error states so users can understand current file/workspace status.

### FR-SH2: Renderer-to-Core IPC Wiring

- **FR-SH2.1** The renderer must use the preload-exposed API for Phase 4 operations; direct Node/Electron access from renderer must not be required.
- **FR-SH2.2** The preload API used by the shell must support at minimum:
  - workspace open
  - story-map load
  - watcher start/stop
  - watch-event subscription for external changes
- **FR-SH2.3** IPC responses must support success and structured failure states consumable by renderer UI.

### FR-SH3: Workspace Folder Dialog

- **FR-SH3.1** Users must be able to open an OS-native folder picker from the shell.
- **FR-SH3.2** When a workspace is selected, the app must present available Markdown file candidates for user selection.
- **FR-SH3.3** If workspace selection is canceled, the app must remain stable and keep previous context unchanged.

### FR-SH4: Story Map File Selection and Load

- **FR-SH4.1** Users must be able to select one Markdown file as the active story map.
- **FR-SH4.2** Selecting a file must trigger load/parse through core-backed IPC and return structured story-map data.
- **FR-SH4.3** The shell must display the active workspace and active file identity.
- **FR-SH4.4** File-load errors must be shown in the UI with actionable messaging.

### FR-SH5: Basic Hierarchy Rendering

- **FR-SH5.1** The shell must render hierarchy in nested order: Activity -> Task -> Story.
- **FR-SH5.2** Rendered hierarchy must reflect current parsed data after each successful file load.
- **FR-SH5.3** Empty-state handling must be present for:
  - no workspace selected
  - no Markdown candidates found
  - no activities/tasks/stories parsed

### FR-SH6: External File Change Prompt (Reload Dialog)

- **FR-SH6.1** After active file selection, the shell must start watching that file for external modifications.
- **FR-SH6.2** On external change event, the shell must prompt the user with a reload decision.
- **FR-SH6.3** Prompt actions must include:
  - reload active file now
  - dismiss for now
- **FR-SH6.4** Reload action must refresh hierarchy from disk and reflect latest content.
- **FR-SH6.5** Watcher lifecycle must handle file switches by stopping/replacing previous watch context.

### FR-SH7: Stability and UX Guarantees

- **FR-SH7.1** Cancellation paths (workspace or file selection) must not crash or lock the shell.
- **FR-SH7.2** Repeated workspace/file switching must not accumulate duplicate watch prompts for stale files.
- **FR-SH7.3** Shell behavior must remain fully offline and local-first.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-SH1 | App shell interactions for open/select/load should feel responsive for target story-map size range |
| NFR-SH2 | UI state must remain deterministic and recoverable across cancellation and load failures |
| NFR-SH3 | Watch-triggered reload prompts should avoid noisy duplicate notifications for bursty file changes |
| NFR-SH4 | Phase 4 shell must run on macOS, Windows, and Linux under the Electron app model |
| NFR-SH5 | No Phase 4 behavior may require network access |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-SH1 | User can open a workspace folder from the shell via OS-native dialog |
| AC-SH2 | User can choose an active Markdown story-map file from workspace candidates |
| AC-SH3 | Loading selected file renders Activity -> Task -> Story hierarchy in the renderer |
| AC-SH4 | Shell visibly shows current workspace and active file context |
| AC-SH5 | External edits to the active file trigger a reload prompt |
| AC-SH6 | Choosing reload updates rendered hierarchy to latest disk content |
| AC-SH7 | Canceling dialogs or hitting load errors keeps app stable and usable |
| AC-SH8 | Switching active file/workspace does not produce stale watcher prompts from previous files |

---

## Dependencies

- Phase 1 core parser/serializer/types are available and stable for load/render contracts.
- Phase 2 IPC file/workspace/watch contracts are available for renderer integration.

---

## Open Questions

1. Should the reload prompt offer a third action (for example: "always auto-reload for this session") in Phase 4, or remain a strict two-action dialog?
2. For multi-candidate workspaces, should file selection default to the most recently used file when available?
