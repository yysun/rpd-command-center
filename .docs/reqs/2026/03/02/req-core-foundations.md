# REQ — Core: Foundations (Phase 1)

**Date:** 2026-03-02
**Phase:** 1 — Core: Foundations
**Source:** `docs/req-story-map-manager.md`, `docs/user-story-map.md`
**Status:** Draft

---

## Context

Phase 1 delivers the pure TypeScript `core/` library — the data model, markdown parser, and serializer. It has **no Electron, DOM, or UI dependencies** and is tested in isolation. All subsequent phases depend on this library as their sole data layer.

The existing `core/` package has scaffold stubs for `parse()` and `serialize()`. Phase 1 replaces those stubs with full implementations.

---

## Stories

| Slug | Title |
|------|-------|
| `scaffold-core-package` | Scaffold monorepo and core package |
| `configure-core-build` | Configure core build toolchain |
| `define-type-hierarchy` | Define Activity / Task / Story type hierarchy |
| `define-story-fields-schema` | Define Story fields schema |
| `parse-markdown-to-model` | Parse markdown outline into internal model |
| `parse-form-a-properties` | Parse Form A inline properties (`key:: value`) |
| `parse-form-b-legacy` | Parse Form B legacy property patterns |
| `parser-round-trip-tests` | Round-trip fidelity tests |
| `serialize-preserve-existing` | Serialize model to Markdown (Preserve Existing mode) |
| `serialize-normalize` | Serialize model to Markdown (Normalize mode) |
| `atomic-save` | Atomic write (write-temp + rename) |
| `backup-on-save` | Create `.bak` backup on save |

---

## Functional Requirements

### FR-C1: Monorepo & Build Setup

- **FR-C1.1** The `core/` package must be a standalone TypeScript library publishable without Electron or any browser/Node.js runtime globals.
- **FR-C1.2** The package must export a stable public API surface: all types, `parse()`, `serialize()`, and the atomic-write/backup utilities.
- **FR-C1.3** Tests must run via `vitest` in a pure Node environment (no DOM, no jsdom).
- **FR-C1.4** The build toolchain must produce type declarations (`.d.ts`) alongside compiled output.

---

### FR-C2: Data Model

#### Hierarchy

The model represents a three-level hierarchy:

```
StoryMap
└── Activity  (1…n)
    └── Task  (1…n per Activity)
        └── Story  (1…n per Task)
```

#### FR-C2.1 — StoryMap
- Has a `title` (string, free text).
- Has an ordered list of `Activity` nodes.

#### FR-C2.2 — Activity
- Has an `id` (stable unique string within a parse session; generated during parse and not persisted to Markdown in Phase 1).
- Has a `title` (string, free text).
- Has an `order` integer (position among siblings).
- Has an ordered list of `Task` nodes.

#### FR-C2.3 — Task
- Has an `id` (stable unique string within a parse session; generated during parse and not persisted to Markdown in Phase 1).
- Has a `activityId` reference to its parent Activity.
- Has a `title` (string, free text).
- Has an `order` integer.
- Has an ordered list of `Story` nodes.

#### FR-C2.4 — Story
- Has an `id` (stable unique string, generated from `slug` on first parse and persisted as an `id::` property in Markdown so it survives re-reads and renames without change).
- Has a `taskId` reference to its parent Task.
- Has the following editable fields:

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | string | Free text |
| `status` | `'todo' \| 'doing' \| 'done'` | Required; defaults to `'todo'` |
| `slug` | string | Characters: `a-z0-9-` only; empty string allowed; when non-empty it must be unique across all stories in the map |
| `notes` | string | Free text, may be multiline; optional (defaults to empty string) |
| `docRefs` | `DocRef[]` | Zero or more references to linked documents |
| `order` | number | Position among siblings |
| `updatedAt` | number | Unix ms timestamp; updated on every mutation |

#### FR-C2.5 — DocRef
Each doc-ref entry has:

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Stable unique string |
| `type` | `'REQ' \| 'PLAN' \| 'DONE'` | Required |
| `date` | string | Format: `YYYY-MM-DD` |
| `filename` | string | Relative filename, e.g. `req-user-login.md` |

---

### FR-C3: Parser

The parser converts a raw Markdown string into a `StoryMap` in-memory model.

#### FR-C3.1 — Outline structure detection
- The parser must detect the three-level hierarchy by Markdown heading and list indentation levels as used in `user-story-map.md`:
  - Top-level list item tagged `#activity` → Activity node.
  - Second-level list item tagged `#task` → Task node under the current Activity.
  - Third-level list item tagged `#story` → Story node under the current Task.
- Items without a recognized tag are parsed as their nearest matching ancestor type based on indentation depth.

#### FR-C3.2 — Form A property parsing (`key:: value`)
- Below a `#story` line, indented lines matching `key:: value` (Logseq inline-property style) are parsed as story fields.
- Recognized keys: `status`, `slug`, `notes`. A `notes::` property value is the text on that same line. If multiple `notes::` lines appear they are concatenated with `\n` to form the full notes string.
- Doc-ref keys: `req`, `plan`, `done` — value is `{date}/{filename}` (e.g. `2026-02-25/req-user-login.md`). Multiple lines with the same key are accumulated as separate `DocRef` entries.
- Unrecognized keys are preserved as-is and must round-trip unchanged.

#### FR-C3.3 — Form B legacy property parsing
- Support legacy single-colon patterns: `status: todo`, `slug: foo`.
- Support doc-ref lines of the form `- {date} → {filename}` nested under a story (the `→` separator indicates a doc ref).
- The inferred `DocRefType` is derived from the filename prefix (`req-*` → `REQ`, `plan-*` → `PLAN`, `done-*` → `DONE`; unknown prefix → `DONE`).

#### FR-C3.4 — Defaults
- `status` defaults to `'todo'` if absent.
- `slug` defaults to an empty string if absent.
- `notes` defaults to `''` if absent.
- `docRefs` defaults to `[]` if absent.
- `id` is read from the `id::` property if present; otherwise it is generated from `slug` and then persisted as `id::` by the serializer.
- ID generation rule on first creation:
  - If `slug` is non-empty and unique among story IDs, set `id = slug`.
  - If `slug` collides with an existing story ID, set `id = <slug>-<shortSuffix>`.
  - If `slug` is empty, set `id = story-<shortSuffix>`.
- Once an `id` exists, it is immutable even if `slug` changes later.

#### FR-C3.5 — Title parsing
- The map title is taken from the first `# Heading` line, if present. If absent, defaults to `'User Story Map'`.
- Activity/Task/Story titles are the text of the list item after stripping the `#tag` marker and leading/trailing whitespace.

#### FR-C3.6 — Robustness
- Unknown or malformed property lines within a story block must be tolerated without crashing; they are captured in a raw `unknownProps` pass-through bag and must survive round-trip serialization.
- Non-standard inline tags on Activity and Task lines (beyond `#activity`, `#task`) are likewise preserved verbatim in the serialized output.
- An empty or whitespace-only input must return a `StoryMap` with an empty `activities` array.

---

### FR-C4: Serializer

The serializer converts an in-memory `StoryMap` back to a Markdown string. It is controlled by a `FormatMode` parameter.

#### FR-C4.1 — `preserve` mode (default)
- Retain the original Markdown structure, indentation style, and property form of each story (Form A or Form B) as it was parsed.
- Only modified fields are rewritten; unmodified lines are emitted verbatim.
- Unknown/unrecognized property lines are re-emitted unchanged and in their original order.
- The goal is minimal diff churn: no whitespace changes to unedited lines.

#### FR-C4.2 — `normalize` mode
- Rewrite every story's properties to Form A (`key:: value`), regardless of how they were originally encoded.
- Canonical field order within a story block: `id`, `status`, `slug`, `notes` (omitted if empty), doc-ref lines (`req`, `plan`, `done`), then any unknown props.
- Activity and Task titles are preserved verbatim; only story property blocks are reformatted.

#### FR-C4.3 — Round-trip invariant
- `parse(serialize(parse(markdown), 'preserve'))` must produce a model that is deeply equal to `parse(markdown)` for any valid input.
- No stories, tasks, activities, or property lines may be silently dropped during a round-trip in either mode.

#### FR-C4.4 — Tag and marker preservation
- `#activity`, `#task`, `#story` markers must be preserved in the serialized output.
- List indentation levels must be maintained at their original depth.

---

### FR-C5: Atomic File Write & Backup

These utilities are part of the `core/` library (pure Node.js `fs` operations, no Electron dependency).

#### FR-C5.1 — `atomicWrite(filePath, content)` — atomic write
- Writing a file must proceed by: write content to `{original-path}.tmp` → rename `.tmp` over `{original-path}`.
- If the rename fails, the `.tmp` file is cleaned up and an error is thrown; the original file must remain unmodified.
- The function signature: `atomicWrite(filePath: string, content: string): Promise<void>`.

#### FR-C5.2 — `writeWithBackup(filePath, content)` — backup + write
- A convenience wrapper that: (1) copies the existing file to `{original-path}.bak`, then (2) calls `atomicWrite`.
- If the source file does not exist, step 1 is skipped and the write proceeds normally.
- A failure during the backup copy must abort the write and throw; `atomicWrite` is not called.
- The function signature: `writeWithBackup(filePath: string, content: string): Promise<void>`.

#### FR-C5.3 — Error contract
- All I/O errors surface as thrown `Error` instances with a descriptive `message`; no silent failures.

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-C1 | Zero runtime dependencies on Electron, DOM APIs, or browser globals |
| NFR-C2 | Parse a 2 000-story map in < 200 ms on a modern laptop |
| NFR-C3 | Serialize a 2 000-story map in < 100 ms |
| NFR-C4 | Full round-trip test coverage; no story fields silently dropped |
| NFR-C5 | The public API surface is fully typed with TypeScript strict mode enabled |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-C1 | `parse(rawMarkdown)` returns a `StoryMap` with the correct Activity → Task → Story hierarchy for `user-story-map.md` |
| AC-C2 | All Form A (`key:: value`) and Form B (single-colon / `→`) property patterns are parsed to the correct Story fields |
| AC-C3 | `serialize(parse(md), 'preserve')` produces output where `parse()` of that output is deeply equal to `parse(md)` |
| AC-C4 | `serialize(map, 'normalize')` outputs all story properties in Form A canonical order |
| AC-C5 | `atomicWrite(path, content)` never leaves the file in a partial state; `.tmp` is cleaned up on failure |
| AC-C6 | `writeWithBackup(path, content)` creates a `.bak` before writing; aborting if backup fails |
| AC-C7 | All tests pass via `vitest` with no DOM or Electron environment required |

---

## Out of Scope for Phase 1

- IPC handlers, Electron integration, or any `ipcMain`/`ipcRenderer` usage
- File system watchers (covered in Phase 2)
- Search, filter, or metrics algorithms (covered in Phase 2)
- Any UI, renderer, or React components
- Persistent undo/redo history
