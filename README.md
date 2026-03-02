# RPD Command Center

Outliner-first Story and RPD Command Center for teams that want Markdown to remain the source of truth.

This project is an Electron desktop app designed to make story-map and RPD artifact maintenance feel as fast as a notebook, while keeping files Git-friendly and manually editable.

RPD Loop is a structured software delivery framework designed to manage the high velocity of AI-driven development. This system replaces informal "vibe coding" with a disciplined cycle of Requirements (R), Plan (P), and Done (D) to ensure architectural consistency and prevent knowledge loss. By requiring explicit artifacts and review gates at every stage, the methodology transforms AI agents from unpredictable code generators into reliable delivery engines. 

"Spec-driven helps you start correctly. RPD Loop helps you finish correctly—and get smarter every time".

## Vision

RPD workflows are strong, but story maps and REQ/PLAN/DONE artifacts become hard to maintain at scale when edited manually. This app solves that by combining:

- Outliner-first editing (Activities -> Tasks -> Stories)
- Structured fields where needed (status, slug, doc links)
- Reliable Markdown round-trip serialization
- Local-first safety (atomic writes and backups)

The goal is to make updates, linking, and movement of stories frictionless without introducing a proprietary format.

## North Star Experience

With the app, a PM or developer should be able to:

- Update a story status, attach REQ/PLAN links, and move it to a new task in seconds
- Zoom into a task and instantly spot blockers, missing docs, and recent changes
- Generate REQ/PLAN/DONE docs from templates with automatic story linking
- Trust that Markdown output stays readable and diff-minimal

## Product Principles

- Markdown is the truth
- Outliner-first, keyboard-first
- Structured where it matters
- Minimal diff, maximum clarity
- RPD traceability by default
- Local-first reliability

## RPD References:

- RPD repository: `https://github.com/yysun/rpd`
- Full skill doc: `https://github.com/yysun/rpd/blob/main/SKILL.md`
- Quick reference: `https://github.com/yysun/rpd/blob/main/QUICK_REFERENCE.md`

## Roadmap

### Phase 1: Story Map Manager

- Story map outliner
- Inspector for structured fields
- Search, filters, and saved queries
- Doc templates and linking

### Phase 2: RPD Command Center

- Integrated REQ/PLAN/DONE browsing
- Work queues (Doing, Missing Docs, Needs Review)
- Task-level progress and doc coverage dashboards
- Lightweight change history

### Phase 3: Agent Orchestration Hub (Optional)

- Story-scoped agent actions (draft REQ, generate PLAN, propose tests)
- Agent outputs as auditable Markdown diffs
- Human-in-the-loop approvals

## Target Users

- PM / Tech Lead: manage scope, priorities, and traceability
- Developers: find stories quickly and open linked docs fast
- Team Leads: monitor progress and bottlenecks without spreadsheets

## Non-negotiables

- Markdown round-trip integrity
- Unique story slugs with basic validation
- Atomic save + backup safety
- Cross-platform Electron delivery

## Repository Structure

- `core/`: parsing, serialization, and safe file I/O
- `electron/`: Electron main, preload, and renderer app
- `docs/`: vision, PRD, and story-map artifacts

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Start development app:

```bash
npm run dev
```

## Source Vision

This README is based on `docs/vision.md` and is intended as a concise entry point for contributors and stakeholders.
