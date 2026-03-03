import { useEffect, useState } from 'react'
import type { BoardColumnData, StoryCardData } from './storyMapTypes'

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="text-[var(--muted-foreground)]">
      <path d="M2.5 4.25L6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="text-[var(--muted-foreground)]">
      <path d="M4.25 2.5L7.75 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StoryCard({ story, onClick, onDelete }: { story: StoryCardData; onClick: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]">
      <div className="mb-1 flex items-start gap-1">
        <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
          <h4 className="text-[11px] leading-4 font-medium text-[var(--foreground)]">{story.title}</h4>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-5 w-5 rounded bg-[var(--card)] text-[10px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          title="Delete story"
          aria-label={`Delete story ${story.title}`}
        >
          x
        </button>
      </div>
      <button type="button" onClick={onClick} className="block w-full text-left">
        <p className="text-[10px] text-[var(--muted-foreground)]">{story.meta}</p>
        {story.docs ? <p className="mt-1 text-[10px] font-semibold text-[var(--muted-foreground)]">{story.docs}</p> : null}
      </button>
    </div>
  )
}

function BoardColumn({
  column,
  onStoryClick,
  onAddTask,
  onAddStory,
  onDeleteActivity,
  onDeleteStory,
}: {
  column: BoardColumnData
  onStoryClick: (storyId?: string) => void
  onAddTask: (activityKey: string) => void
  onAddStory: (activityKey: string, taskLabel?: string) => void
  onDeleteActivity: (activityKey: string) => void
  onDeleteStory: (activityKey: string, storyId: string) => void
}) {
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    const validKeys = new Set(column.tasks.map((taskLabel, taskIndex) => `${taskLabel}-${taskIndex}`))
    setCollapsedTasks((previous) => new Set(Array.from(previous).filter((key) => validKeys.has(key))))
  }, [column.tasks])

  function toggleTask(taskKey: string): void {
    setCollapsedTasks((previous) => {
      const next = new Set(previous)
      if (next.has(taskKey)) next.delete(taskKey)
      else next.add(taskKey)
      return next
    })
  }

  return (
    <section className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="text-[13px] font-semibold tracking-[0.2px] text-[var(--foreground)]">{column.title}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddTask(column.key)}
            className="h-5 w-5 rounded bg-[var(--card)] text-[11px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Add task"
            aria-label={`Add task in ${column.title}`}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onDeleteActivity(column.key)}
            className="h-5 w-5 rounded bg-[var(--card)] text-[10px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            title="Delete activity"
            aria-label={`Delete activity ${column.title}`}
          >
            x
          </button>
        </div>
        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
          {column.count}
        </span>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {column.tasks.map((taskLabel, taskIndex) => {
          const taskKey = `${taskLabel}-${taskIndex}`
          const isExpanded = !collapsedTasks.has(taskKey)
          const taskStories = column.cards.filter((story) => story.task === taskLabel)

          return (
            <div key={taskKey} className="rounded-md border border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleTask(taskKey)}
                  className="flex min-w-0 flex-1 items-center gap-1 text-left"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} task ${taskLabel}`}
                >
                  <ChevronIcon expanded={isExpanded} />
                  <span className="truncate text-[12px] font-semibold tracking-[0.2px] text-[var(--foreground)]">{taskLabel}</span>
                  <span className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {taskStories.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddStory(column.key, taskLabel)}
                  className="h-4 w-4 rounded bg-[var(--card)] text-[10px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  title="Add story"
                  aria-label={`Add story under ${taskLabel}`}
                >
                  +
                </button>
              </div>
              {isExpanded ? (
                <div className="space-y-1 bg-[var(--background)] p-1.5 pt-0">
                  {taskStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={() => onStoryClick(story.id)}
                      onDelete={() => onDeleteStory(column.key, story.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

type OutlinerLanesProps = {
  columns: BoardColumnData[]
  onStoryClick: (storyId?: string) => void
  onAddTask: (activityKey: string) => void
  onAddStory: (activityKey: string, taskLabel?: string) => void
  onDeleteActivity: (activityKey: string) => void
  onDeleteStory: (activityKey: string, storyId: string) => void
}

export default function OutlinerLanes({
  columns,
  onStoryClick,
  onAddTask,
  onAddStory,
  onDeleteActivity,
  onDeleteStory,
}: OutlinerLanesProps) {
  return (
    <main aria-label="Outliner" className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
      <h1 className="sr-only">Outliner</h1>
      <section className="flex-1 overflow-auto bg-[var(--muted)] p-4">
        <div className="flex min-h-full w-max gap-3">
          {columns.map((column) => (
            <BoardColumn
              key={column.key}
              column={column}
              onStoryClick={onStoryClick}
              onAddTask={onAddTask}
              onAddStory={onAddStory}
              onDeleteActivity={onDeleteActivity}
              onDeleteStory={onDeleteStory}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
