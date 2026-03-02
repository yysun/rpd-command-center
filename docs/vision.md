# Vision — Outliner-First Story & RPD Command Center (Electron)

## Why this exists

Our RPD workflow is powerful, but the “source of truth” (Markdown user stories + REQ/PLAN/DONE artifacts) becomes hard to maintain as volume grows. Manual edits are slow, inconsistent, and easy to break. We need a tool that keeps **Markdown as the truth**, while making updates **as fast and fluid as a notebook**.

## Vision

Build an Electron desktop app that feels like **Logseq for product + engineering execution**: an **outliner-first** workspace where Activities → Tasks → Stories are edited as nested blocks, with structured fields (status/slug/docs) and instant access to the RPD artifact trail (REQ/PLAN/DONE). Editing is frictionless, but the output stays plain Markdown and Git-friendly.

## North Star Experience

A developer/PM opens the workspace and can:

* Update a story’s status, add a REQ/PLAN link, and move it to another task **in under 10 seconds** using keyboard-first flows.
* Zoom into any task and instantly see what’s blocked, what’s missing docs, and what changed recently.
* Generate a REQ/PLAN/DONE doc from a template and have the story auto-link to it—no file hunting, no naming mistakes.
* Trust that the Markdown remains readable, diff-minimal, and safe to edit manually when needed.

## Principles

1. **Markdown is the truth**
   The app is an editor and navigator, not a new proprietary system.

2. **Outliner-first, keyboard-first**
   Structure emerges from indentation and blocks; mouse is optional.

3. **Structured where it matters**
   Status, slug, doc refs, and validation live in the UI, but serialize cleanly to Markdown.

4. **Minimal diff, maximum clarity**
   Saving should not “reformat the world.” Preserve style and keep Git diffs small.

5. **RPD traceability is default**
   Every story can be traced through REQ → PLAN → DONE without hunting.

6. **Local-first and reliable**
   No network dependency. Atomic saves and backups. Never corrupt files.

## What it becomes over time

### Phase 1 — Story Map Manager (Foundation)

* Outliner for story map
* Inspector for structured fields
* Search, filters, saved queries
* Doc templates and linking

### Phase 2 — RPD Command Center

* Integrated REQ/PLAN/DONE browsing
* “Work queues” (Doing, Missing Docs, Needs Review)
* Task-level dashboards: progress + doc coverage
* Lightweight history: what changed and when

### Phase 3 — Agent Orchestration Hub (Optional, aligned with your direction)

* From any story: “Ask agent to draft REQ”, “Generate PLAN”, “Propose tests”, etc.
* Agents operate on the same Markdown artifacts, producing auditable diffs
* Human-in-the-loop approvals baked into the workflow

## What success looks like

* Maintaining the user story map is no longer “a document chore.”
* People consistently attach REQ/PLAN/DONE links because it’s effortless.
* Story movement and status updates reflect reality daily (not weekly).
* The story map becomes a living execution surface: **structured enough for automation**, **free enough for humans**.

## Target users

* PM/Tech Lead: manage scope, priorities, and traceability
* Developers: find the right story fast, understand intent, open related docs instantly
* Team leads: see progress and bottlenecks without spreadsheets

## Key differentiator

Most tools force you into a database, tickets, or JSON/YAML. This tool makes **Markdown feel like a product system**—with the ergonomics of an outliner and the rigor of a structured workflow—without sacrificing portability or manual control.

## Non-negotiables

* Markdown round-trip integrity (manual edits stay valid)
* Slug uniqueness + basic validation to prevent link rot
* Atomic save + backup safety
* Cross-platform Electron delivery

## The promise

If you can write nested bullet points, you can run a serious product workflow—and you never lose ownership of your artifacts.
