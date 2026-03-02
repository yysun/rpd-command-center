import { describe, it, expect } from 'vitest'
import { parse } from '../src/index'

function story(md: string) {
  return parse(md).activities[0].tasks[0].stories[0]
}

describe('parser outline detection', () => {
  it('1G-1 parse empty', () => {
    const map = parse('')
    expect(map).toMatchObject({ title: 'User Story Map', activities: [] })
  })

  it('1G-2 parse whitespace only', () => {
    expect(parse('  \n\t\n').activities).toHaveLength(0)
  })

  it('1G-3 parses single hierarchy', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n')
    expect(map.activities[0].tasks[0].stories[0].title).toBe('S')
  })

  it('1G-4 activities ordered by insertion', () => {
    const map = parse('# User Story Map\n\n- A #activity\n- B #activity\n')
    expect(map.activities.map((a) => a.order)).toEqual([0, 1])
  })

  it('1G-5 tasks ordered and activityId assigned', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T1 #task\n  - T2 #task\n')
    expect(map.activities[0].tasks[1].activityId).toBe(map.activities[0].id)
    expect(map.activities[0].tasks.map((t) => t.order)).toEqual([0, 1])
  })

  it('1G-6 stories ordered and taskId assigned', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S1 #story\n    - S2 #story\n')
    expect(map.activities[0].tasks[0].stories[1].taskId).toBe(map.activities[0].tasks[0].id)
    expect(map.activities[0].tasks[0].stories.map((s) => s.order)).toEqual([0, 1])
  })

  it('1G-7 heading title fallback', () => {
    expect(parse('# Project X\n\n- A #activity\n').title).toBe('Project X')
    expect(parse('- A #activity\n').title).toBe('User Story Map')
  })

  it('1G-8 strips known tags', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n')
    expect(map.activities[0].title).toBe('A')
    expect(map.activities[0].tasks[0].title).toBe('T')
    expect(map.activities[0].tasks[0].stories[0].title).toBe('S')
  })

  it('1G-9 preserves non-standard tags in rawLine', () => {
    const map = parse('# User Story Map\n\n- A #activity #custom\n  - T #task #other\n    - S #story\n')
    expect(map.activities[0].rawLine).toContain('#custom')
    expect(map.activities[0].tasks[0].rawLine).toContain('#other')
  })

  it('1G-10 parses project fixture with activities/tasks/stories', async () => {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const md = await readFile(join(__dirname, '../../docs/user-story-map.md'), 'utf8')
    const map = parse(md)
    expect(map.activities.length).toBeGreaterThan(0)
    expect(map.activities.some((a) => a.tasks.length > 0)).toBe(true)
  })
})

describe('parser form A properties', () => {
  it('1G-11 parses status:: doing', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status:: doing\n').status).toBe('doing')
  })

  it('1G-12 parses slug::', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      slug:: my-slug\n').slug).toBe('my-slug')
  })

  it('1G-13 keeps explicit id::', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: my-id\n      slug:: my-slug\n').id).toBe('my-id')
  })

  it('1G-14 parses single notes::', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      notes:: one\n').notes).toBe('one')
  })

  it('1G-15 joins multiple notes:: with newline', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      notes:: one\n      notes:: two\n').notes).toBe('one\ntwo')
  })

  it('1G-16 parses req:: docref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      req:: 2026-01-01/req-foo.md\n').docRefs[0]).toMatchObject({ type: 'REQ', date: '2026-01-01', filename: 'req-foo.md' })
  })

  it('1G-17 parses plan:: docref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      plan:: 2026-02-01/plan-bar.md\n').docRefs[0].type).toBe('PLAN')
  })

  it('1G-18 parses done:: docref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      done:: 2026-03-01/done-baz.md\n').docRefs[0].type).toBe('DONE')
  })

  it('1G-19 keeps multiple same docref keys', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      req:: 2026-01-01/req-a.md\n      req:: 2026-01-02/req-b.md\n').docRefs).toHaveLength(2)
  })

  it('1G-20 unknown key goes to unknownProps', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      foo:: bar\n').unknownProps).toContain('foo:: bar')
  })

  it('1G-21 preserves unknownProps order', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      a:: 1\n      b:: 2\n').unknownProps).toEqual(['a:: 1', 'b:: 2'])
  })
})

describe('parser form B and defaults', () => {
  it('1G-22 parses status:', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: done\n').status).toBe('done')
  })

  it('1G-23 parses slug:', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      slug: old\n').slug).toBe('old')
  })

  it('1G-24 infers REQ from legacy ref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-15 → req-user-login.md\n').docRefs[0].type).toBe('REQ')
  })

  it('1G-25 infers PLAN from legacy ref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-15 → plan-foo.md\n').docRefs[0].type).toBe('PLAN')
  })

  it('1G-26 infers DONE from legacy ref', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-15 → done-bar.md\n').docRefs[0].type).toBe('DONE')
  })

  it('1G-27 unknown filename prefix defaults to DONE', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-15 → unknown.md\n').docRefs[0].type).toBe('DONE')
  })

  it('1G-28 keeps multiple legacy refs', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-15 → req-a.md\n      - 2026-01-16 → req-b.md\n').docRefs).toHaveLength(2)
  })

  it('1G-29 default status is todo', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n').status).toBe('todo')
  })

  it('1G-30 default slug is empty', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n').slug).toBe('')
  })

  it('1G-31 default notes is empty', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n').notes).toBe('')
  })

  it('1G-32 default docRefs is empty', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n').docRefs).toEqual([])
  })

  it('1G-33 no id:: with slug yields id=slug', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      slug:: my-slug\n').id).toBe('my-slug')
  })

  it('1G-34 empty slug gets story-* id', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n').id.startsWith('story-')).toBe(true)
  })

  it('1G-35 slug collision appends suffix', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S1 #story\n      slug:: same\n    - S2 #story\n      slug:: same\n')
    const stories = map.activities[0].tasks[0].stories
    expect(stories[0].id).toBe('same')
    expect(stories[1].id.startsWith('same-')).toBe(true)
  })

  it('1G-36 existing id remains when slug changes', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: fixed\n      slug:: one\n')
    const s = map.activities[0].tasks[0].stories[0]
    s.slug = 'two'
    expect(s.id).toBe('fixed')
  })

  it('1G-37 malformed property tolerated', () => {
    expect(story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      ::badline\n').unknownProps).toContain('::badline')
  })

  it('1G-38 property lines before story are ignored', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    status:: doing\n    - S #story\n')
    expect(map.activities[0].tasks[0].stories[0].status).toBe('todo')
  })

  it('1G-39 deep nested list treated as property context', () => {
    const s = story('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      - 2026-01-01 → req-a.md\n')
    expect(s.docRefs).toHaveLength(1)
  })
})
