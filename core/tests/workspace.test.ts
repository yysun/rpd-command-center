import { describe, expect, it } from 'vitest'
import { computeStoryMapMetrics, filterStories, parse, searchStories, validateSlug } from '../src/index'

const fixture = parse(`# User Story Map

- Activity A #activity
  - Task A1 #task
    - Story Alpha #story
      status:: todo
      slug:: alpha
      notes:: login flow
      req:: 2026-03-01/req-alpha.md
    - Story Beta #story
      status:: done
      slug:: beta
      notes:: export settings
  - Task A2 #task
    - Story Gamma #story
      status:: doing
      slug:: gamma
      plan:: 2026-03-02/plan-gamma.md
- Activity B #activity
  - Task B1 #task
    - Story Delta #story
      status:: done
      slug:: delta
      done:: 2026-03-03/done-delta.md
`)

describe('workspace search', () => {
  it('2A-1 matches title/slug/notes/doc filename with case-insensitive query', () => {
    expect(searchStories(fixture, { query: 'story alpha' }).storyIds.length).toBe(1)
    expect(searchStories(fixture, { query: 'GAMMA' }).storyIds.length).toBe(1)
    expect(searchStories(fixture, { query: 'export settings' }).storyIds.length).toBe(1)
    expect(searchStories(fixture, { query: 'req-alpha.md' }).storyIds.length).toBe(1)
  })

  it('2A-2 empty query returns all stories in deterministic order', () => {
    const all = searchStories(fixture, { query: '' }).storyIds
    expect(all).toEqual(['alpha', 'beta', 'gamma', 'delta'])
  })
})

describe('workspace filter composition', () => {
  it('2A-3 filters by status multi-select', () => {
    const result = filterStories(fixture, { statuses: ['todo', 'doing'] })
    expect(result.storyIds).toEqual(['alpha', 'gamma'])
  })

  it('2A-4 filters by strict doc coverage', () => {
    expect(filterStories(fixture, { docCoverage: 'none' }).storyIds).toEqual(['beta'])
    expect(filterStories(fixture, { docCoverage: 'has-req' }).storyIds).toEqual(['alpha'])
    expect(filterStories(fixture, { docCoverage: 'has-plan' }).storyIds).toEqual(['gamma'])
    expect(filterStories(fixture, { docCoverage: 'has-done' }).storyIds).toEqual(['delta'])
  })

  it('2A-5 composes text + status + coverage filters with AND behavior', () => {
    const result = filterStories(fixture, {
      query: 'story',
      statuses: ['done'],
      docCoverage: 'has-done',
    })
    expect(result.storyIds).toEqual(['delta'])
  })

  it('2A-6 unfinishedTasksOnly keeps only stories under tasks with non-done stories', () => {
    const result = filterStories(fixture, { unfinishedTasksOnly: true })
    expect(result.storyIds).toEqual(['alpha', 'beta', 'gamma'])
  })
})

describe('workspace slug validation', () => {
  it('2A-7 validates format and uniqueness with conflict IDs', () => {
    expect(validateSlug(fixture, { slug: 'valid-123' })).toMatchObject({ isValidFormat: true, isUnique: true, conflictingStoryIds: [] })

    expect(validateSlug(fixture, { slug: 'Bad Value' })).toMatchObject({ isValidFormat: false, isUnique: true })

    expect(validateSlug(fixture, { slug: 'alpha' })).toMatchObject({
      isValidFormat: true,
      isUnique: false,
      conflictingStoryIds: ['alpha'],
    })

    expect(validateSlug(fixture, { slug: 'alpha', excludeStoryId: 'alpha' })).toMatchObject({
      isUnique: true,
      conflictingStoryIds: [],
    })
  })
})

describe('workspace metrics', () => {
  it('2A-8 computes activity/task status counts, percent done, and doc coverage', () => {
    const metrics = computeStoryMapMetrics(fixture)

    expect(metrics.activityMetrics).toEqual([
      {
        nodeId: fixture.activities[0].id,
        storyCount: 3,
        statusCounts: { todo: 1, doing: 1, done: 1 },
        percentDone: 33,
        coverage: { withDocs: 2, withoutDocs: 1 },
      },
      {
        nodeId: fixture.activities[1].id,
        storyCount: 1,
        statusCounts: { todo: 0, doing: 0, done: 1 },
        percentDone: 100,
        coverage: { withDocs: 1, withoutDocs: 0 },
      },
    ])

    expect(metrics.taskMetrics).toEqual([
      {
        nodeId: fixture.activities[0].tasks[0].id,
        storyCount: 2,
        statusCounts: { todo: 1, doing: 0, done: 1 },
        percentDone: 50,
        coverage: { withDocs: 1, withoutDocs: 1 },
      },
      {
        nodeId: fixture.activities[0].tasks[1].id,
        storyCount: 1,
        statusCounts: { todo: 0, doing: 1, done: 0 },
        percentDone: 0,
        coverage: { withDocs: 1, withoutDocs: 0 },
      },
      {
        nodeId: fixture.activities[1].tasks[0].id,
        storyCount: 1,
        statusCounts: { todo: 0, doing: 0, done: 1 },
        percentDone: 100,
        coverage: { withDocs: 1, withoutDocs: 0 },
      },
    ])
  })

  it('2A-9 returns 0 percent done for empty nodes', () => {
    const empty = parse('# User Story Map\n\n- Empty #activity\n  - Empty Task #task\n')
    const metrics = computeStoryMapMetrics(empty)

    expect(metrics.activityMetrics[0].percentDone).toBe(0)
    expect(metrics.taskMetrics[0].percentDone).toBe(0)
  })
})
