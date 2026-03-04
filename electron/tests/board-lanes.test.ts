import { describe, expect, it } from 'vitest'
import { __testing } from '../renderer/src/components/MapLanes'

describe('board lane projection', () => {
  it('builds task anchors and sparse release rows aligned by task column', () => {
    const columns = [
      {
        key: 'activity-a',
        title: 'Activity A',
        count: '2',
        tasks: [
          { id: 'task-a1', label: 'Task A1' },
          { id: 'task-a2', label: 'Task A2' },
        ],
        cards: [
          {
            id: 'story-a1-r1',
            title: 'Story A1 R1',
            taskId: 'task-a1',
            meta: 'todo owner:a R1',
            inspector: { id: 'story-a1-r1', title: 'Story A1 R1', status: 'todo', slug: 'story-a1-r1', notes: '', docRefs: [] },
          },
          {
            id: 'story-a1-r2',
            title: 'Story A1 R2',
            taskId: 'task-a1',
            meta: 'todo owner:a R2',
            inspector: { id: 'story-a1-r2', title: 'Story A1 R2', status: 'todo', slug: 'story-a1-r2', notes: '', docRefs: [] },
          },
        ],
      },
    ]

    const board = __testing.projectBoard(columns)

    expect(board.taskAnchors.map((anchor) => anchor.task.id)).toEqual(['task-a1', 'task-a2'])
    expect(board.releaseRows).toHaveLength(2)
    expect(board.releaseRows[0]?.[0]?.id).toBe('story-a1-r1')
    expect(board.releaseRows[0]?.[1]).toBeNull()
    expect(board.releaseRows[1]?.[0]?.id).toBe('story-a1-r2')
    expect(board.releaseRows[1]?.[1]).toBeNull()
  })

  it('extracts release labels from story meta and falls back to row order', () => {
    const withRelease = {
      id: 's1',
      title: 'Story 1',
      taskId: 't1',
      meta: 'doing owner:a R3',
      inspector: { id: 's1', title: 'Story 1', status: 'doing', slug: 's1', notes: '', docRefs: [] },
    }

    const fallback = {
      id: 's2',
      title: 'Story 2',
      taskId: 't1',
      meta: 'todo owner:a',
      inspector: { id: 's2', title: 'Story 2', status: 'todo', slug: 's2', notes: '', docRefs: [] },
    }

    expect(__testing.releaseSliceLabel(withRelease, 0)).toBe('R3')
    expect(__testing.releaseSliceLabel(fallback, 1)).toBe('R2')
  })
})
