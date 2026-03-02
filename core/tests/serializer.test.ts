import { describe, it, expect } from 'vitest'
import { parse, serialize } from '../src/index'

describe('serializer preserve mode', () => {
  it('1G-40 unchanged story emitted verbatim when id exists', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n'
    expect(serialize(parse(md), 'preserve')).toBe(md)
  })

  it('1G-41 status change only updates status line', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n'
    const map = parse(md)
    map.activities[0].tasks[0].stories[0].status = 'doing'
    const out = serialize(map, 'preserve')
    expect(out).toContain('status:: doing')
    expect(out).toContain('slug:: s')
  })

  it('1G-42 slug change updates slug line', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n')
    map.activities[0].tasks[0].stories[0].slug = 's2'
    expect(serialize(map, 'preserve')).toContain('slug:: s2')
  })

  it('1G-43 notes change updates notes lines', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n')
    map.activities[0].tasks[0].stories[0].notes = 'n1\nn2'
    const out = serialize(map, 'preserve')
    expect(out).toContain('notes:: n1')
    expect(out).toContain('notes:: n2')
  })

  it('1G-44 adding docref appends line', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n')
    map.activities[0].tasks[0].stories[0].docRefs.push({ id: 'r1', type: 'REQ', date: '2026-01-01', filename: 'req-a.md' })
    expect(serialize(map, 'preserve')).toContain('req:: 2026-01-01/req-a.md')
  })

  it('1G-45 form B story keeps single-colon style on updates', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: todo\n      slug: s\n')
    map.activities[0].tasks[0].stories[0].status = 'done'
    const out = serialize(map, 'preserve')
    expect(out).toContain('status: done')
    expect(out).not.toContain('status:: done')
  })

  it('1G-46 unknownProps preserved order', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      x:: 1\n      y:: 2\n')
    const out = serialize(map, 'preserve')
    expect(out.indexOf('x:: 1')).toBeLessThan(out.indexOf('y:: 2'))
  })

  it('1G-47 generated slug-based id line emitted when id missing', () => {
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      slug: s\n')
    expect(serialize(map, 'preserve')).toContain('id:: s')
  })

  it('1G-48 markers present', async () => {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const md = await readFile(join(__dirname, '../../docs/user-story-map.md'), 'utf8')
    const out = serialize(parse(md), 'preserve')
    expect(out).toContain('#activity')
    expect(out).toContain('#task')
    expect(out).toContain('#story')
  })

  it('1G-49 keeps list indentation', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n'
    const out = serialize(parse(md), 'preserve')
    expect(out).toContain('\n  - T #task\n')
    expect(out).toContain('\n    - S #story\n')
  })

  it('1G-50 non-standard tags on activity/task lines preserved', () => {
    const md = '# User Story Map\n\n- A #activity #x\n  - T #task #y\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n'
    const out = serialize(parse(md), 'preserve')
    expect(out).toContain('#x')
    expect(out).toContain('#y')
  })
})

describe('serializer normalize mode', () => {
  it('1G-51 rewrites form B into form A', () => {
    const out = serialize(parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: todo\n      slug: s\n'), 'normalize')
    expect(out).toContain('status:: todo')
    expect(out).not.toContain('status: todo')
  })

  it('1G-52 canonical field order', () => {
    const out = serialize(parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: todo\n      slug: s\n'), 'normalize')
    const i = out.indexOf('id:: ')
    const st = out.indexOf('status:: ')
    const sl = out.indexOf('slug:: ')
    expect(i).toBeGreaterThan(-1)
    expect(st).toBeGreaterThan(i)
    expect(sl).toBeGreaterThan(st)
  })

  it('1G-53 omits notes line when empty', () => {
    const out = serialize(parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status:: todo\n      slug:: s\n'), 'normalize')
    expect(out.includes('notes::')).toBe(false)
  })

  it('1G-54 keeps activity/task lines unchanged', () => {
    const md = '# User Story Map\n\n- A #activity #x\n  - T #task #y\n    - S #story\n      status: todo\n      slug: s\n'
    const out = serialize(parse(md), 'normalize')
    expect(out).toContain('- A #activity #x')
    expect(out).toContain('  - T #task #y')
  })

  it('1G-55 normalize output has no single-colon fields or legacy arrows', () => {
    const out = serialize(parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: todo\n      slug: s\n      - 2026-01-01 → req-a.md\n'), 'normalize')
    expect(out.includes('status: ')).toBe(false)
    expect(out.includes(' → ')).toBe(false)
  })
})

describe('serializer round-trip invariants', () => {
  it('1G-56 preserve round-trip form A fixture', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: doing\n      slug:: s\n      notes:: n\n'
    const a = parse(md)
    const b = parse(serialize(a, 'preserve'))
    expect(b.activities[0].tasks[0].stories[0]).toMatchObject({
      id: a.activities[0].tasks[0].stories[0].id,
      status: a.activities[0].tasks[0].stories[0].status,
      slug: a.activities[0].tasks[0].stories[0].slug,
      notes: a.activities[0].tasks[0].stories[0].notes,
      unknownProps: a.activities[0].tasks[0].stories[0].unknownProps,
      docRefs: a.activities[0].tasks[0].stories[0].docRefs,
    })
  })

  it('1G-57 preserve round-trip form B fixture', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: doing\n      slug: s\n'
    const a = parse(md)
    const b = parse(serialize(a, 'preserve'))
    expect(b.activities[0].tasks[0].stories[0]).toMatchObject(a.activities[0].tasks[0].stories[0])
  })

  it('1G-58 normalize round-trip keeps semantic fields', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status: doing\n      slug: s\n      - 2026-01-01 → req-a.md\n'
    const a = parse(md)
    const b = parse(serialize(a, 'normalize'))
    expect(b.activities[0].tasks[0].stories[0]).toMatchObject({
      id: a.activities[0].tasks[0].stories[0].id,
      status: a.activities[0].tasks[0].stories[0].status,
      slug: a.activities[0].tasks[0].stories[0].slug,
    })
  })

  it('1G-59 no elements dropped in round-trip', () => {
    const md = '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      id:: s\n      status:: todo\n      slug:: s\n      x:: 1\n'
    const a = parse(md)
    const b = parse(serialize(a, 'preserve'))
    expect(b.activities.length).toBe(a.activities.length)
    expect(b.activities[0].tasks.length).toBe(a.activities[0].tasks.length)
    expect(b.activities[0].tasks[0].stories.length).toBe(a.activities[0].tasks[0].stories.length)
    expect(b.activities[0].tasks[0].stories[0].unknownProps).toEqual(a.activities[0].tasks[0].stories[0].unknownProps)
  })
})
