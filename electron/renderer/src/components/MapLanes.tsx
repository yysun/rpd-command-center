import { useMemo } from 'react'
import type { BoardColumnData, BoardFocusTarget, StoryCardData, TaskRowData } from './storyMapTypes'

type TaskAnchor = {
  activityKey: string
  activityTitle: string
  task: TaskRowData
}

type BoardProjection = {
  activitySegments: Array<{ key: string; title: string; span: number }>
  taskAnchors: TaskAnchor[]
  releaseRows: Array<Array<StoryCardData | null>>
}

const TASK_COLUMN_WIDTH = 176

function releaseSliceLabel(story: StoryCardData, indexInTask: number): string {
  const releaseFromMeta = story.meta.match(/\b(R\d+)\b/i)?.[1]
  if (releaseFromMeta) return releaseFromMeta.toUpperCase()

  const releaseFromDocs = story.docs?.match(/\b(R\d+)\b/i)?.[1]
  if (releaseFromDocs) return releaseFromDocs.toUpperCase()

  return `R${indexInTask + 1}`
}

function projectBoard(columns: BoardColumnData[]): BoardProjection {
  const taskAnchors: TaskAnchor[] = []
  const activitySegments: Array<{ key: string; title: string; span: number }> = []
  const storiesByTask = new Map<string, StoryCardData[]>()

  for (const column of columns) {
    const span = Math.max(column.tasks.length, 1)
    activitySegments.push({ key: column.key, title: column.title, span })

    if (column.tasks.length === 0) {
      taskAnchors.push({
        activityKey: column.key,
        activityTitle: column.title,
        task: { id: `${column.key}:placeholder`, label: 'No task' },
      })
      continue
    }

    for (const task of column.tasks) {
      taskAnchors.push({
        activityKey: column.key,
        activityTitle: column.title,
        task,
      })

      const stories = column.cards.filter((story) => story.taskId === task.id)
      storiesByTask.set(task.id, stories)
    }
  }

  const maxRows = Math.max(
    1,
    ...taskAnchors.map((anchor) => (anchor.task.id.endsWith(':placeholder') ? 0 : storiesByTask.get(anchor.task.id)?.length ?? 0)),
  )

  const releaseRows = Array.from({ length: maxRows }, (_, rowIndex) => {
    return taskAnchors.map((anchor) => {
      if (anchor.task.id.endsWith(':placeholder')) return null
      return storiesByTask.get(anchor.task.id)?.[rowIndex] ?? null
    })
  })

  return {
    activitySegments,
    taskAnchors,
    releaseRows,
  }
}

export const __testing = {
  projectBoard,
  releaseSliceLabel,
}

function DeleteIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ActivityCard({ title, onClick, onDelete }: { title: string; onClick: () => void; onDelete: () => void }) {
  return (
    <div className="group relative h-24 w-full rounded-lg border border-transparent bg-[var(--map-activity-card-bg)] px-3 text-left text-[13px] font-semibold text-[var(--map-activity-card-fg)] shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded text-[var(--map-activity-card-fg)]/85 opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-black/10 hover:text-[var(--map-activity-card-fg)] focus-visible:opacity-100 focus-visible:pointer-events-auto"
        aria-label={`Delete activity ${title}`}
        title="Delete activity"
      >
        <DeleteIcon />
      </button>
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
        aria-label={`Focus activity ${title}`}
      >
        {title}
      </button>
    </div>
  )
}

function TaskCard({ label, onClick, onDelete, canDelete = true }: { label: string; onClick: () => void; onDelete: () => void; canDelete?: boolean }) {
  return (
    <div className="group relative h-24 w-full rounded-lg border border-transparent bg-[var(--map-task-card-bg)] px-3 text-left text-[12px] font-semibold text-[var(--map-task-card-fg)] shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]">
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded text-[var(--map-task-card-fg)]/85 opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-black/10 hover:text-[var(--map-task-card-fg)] focus-visible:opacity-100 focus-visible:pointer-events-auto"
          aria-label={`Delete task ${label}`}
          title="Delete task"
        >
          <DeleteIcon />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)]"
        aria-label={`Focus task ${label}`}
      >
        {label}
      </button>
    </div>
  )
}

function ReleaseCard({ story, release, onClick, onDelete }: { story: StoryCardData; release: string; onClick: () => void; onDelete: () => void }) {
  return (
    <div className="group rounded-lg border border-transparent bg-[var(--map-release-card-bg)] p-2.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]">
      <div className="mb-1 flex items-center gap-1">
        <span className="rounded bg-[var(--map-release-chip-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--map-release-chip-fg)]">{release}</span>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-[var(--map-release-chip-fg)] opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-[var(--map-release-chip-bg)] hover:text-[var(--map-release-card-fg)] focus-visible:opacity-100 focus-visible:pointer-events-auto"
          aria-label={`Delete story ${story.title}`}
          title="Delete story"
        >
          <DeleteIcon />
        </button>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--foreground)]"
        aria-label={`Focus story ${story.title}`}
      >
        <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--map-release-card-fg)]">{story.title}</p>
        <p className="mt-1 text-[10px] text-[var(--map-release-muted-fg)]">{story.meta}</p>
      </button>
    </div>
  )
}

type MapLanesProps = {
  columns: BoardColumnData[]
  onFocusNode: (target: BoardFocusTarget) => void
  onAddTask: (activityKey: string) => void
  onAddStory: (activityKey: string, taskId?: string) => void
  onDeleteActivity: (activityKey: string) => void
  onDeleteTask: (activityKey: string, taskId: string) => void
  onDeleteStory: (activityKey: string, storyId: string) => void
}

export default function MapLanes({ columns, onFocusNode, onAddTask, onAddStory, onDeleteActivity, onDeleteTask, onDeleteStory }: MapLanesProps) {
  const board = useMemo(() => projectBoard(columns), [columns])
  const columnCount = Math.max(board.taskAnchors.length, 1)
  const boardWidth = Math.max(columnCount * TASK_COLUMN_WIDTH, 720)

  return (
    <main aria-label="Map" className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
      <h1 className="sr-only">Map</h1>
      <section className="flex-1 overflow-x-auto overflow-y-auto bg-[var(--muted)] p-4 pb-6">
        <div className="rounded-xl bg-[var(--card)] p-3">
          <div className="min-h-full">
            <div className="min-w-0">
              <div className="flex w-max gap-4">
                <div className="space-y-3" style={{ width: `${boardWidth}px` }}>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
                    {board.activitySegments.map((segment) => (
                      <div key={segment.key} style={{ gridColumn: `span ${segment.span}` }} className="space-y-2">
                        <ActivityCard
                          title={segment.title}
                          onClick={() => onFocusNode({ kind: 'activity', id: segment.key })}
                          onDelete={() => onDeleteActivity(segment.key)}
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAddTask(segment.key)}
                            className="rounded bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            aria-label={`Add task in ${segment.title}`}
                          >
                            + Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
                    {board.taskAnchors.map((anchor) => (
                      <div key={`${anchor.activityKey}:${anchor.task.id}`} className="space-y-2">
                        <TaskCard
                          label={anchor.task.label}
                          onClick={() => onFocusNode({ kind: 'task', id: anchor.task.id })}
                          onDelete={() => onDeleteTask(anchor.activityKey, anchor.task.id)}
                          canDelete={!anchor.task.id.endsWith(':placeholder')}
                        />
                        {anchor.task.id.endsWith(':placeholder') ? null : (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onAddStory(anchor.activityKey, anchor.task.id)}
                              className="rounded bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              aria-label={`Add story under ${anchor.task.label}`}
                            >
                              + Story
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="space-y-3">
                    {board.taskAnchors.length === 0 ? (
                      <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-4 text-[12px] text-[var(--muted-foreground)]">
                        No activities or tasks yet. Add an activity from the sidebar to start mapping release slices.
                      </div>
                    ) : null}
                    {board.releaseRows.map((row, rowIndex) => (
                      <div key={`release-row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
                        {row.map((story, columnIndex) => {
                          if (!story) {
                            return <div key={`release-empty-${rowIndex}-${columnIndex}`} className="h-[86px]" aria-hidden="true" />
                          }

                          const anchor = board.taskAnchors[columnIndex]
                          const release = releaseSliceLabel(story, rowIndex)

                          return (
                            <ReleaseCard
                              key={`release-${story.id}`}
                              story={story}
                              release={release}
                              onClick={() => onFocusNode({ kind: 'story', id: story.id })}
                              onDelete={() => onDeleteStory(anchor.activityKey, story.id)}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-1 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
