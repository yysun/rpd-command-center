import { useEffect, useRef, useState } from 'react'
import { NO_DRAG_REGION_STYLE } from '../constants/app-constants'
import type { ActivityItem } from './storyMapTypes'

function Chevron({ open = false }: { open?: boolean }) {
  return open ? (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[var(--foreground)]">
      <path d="M2.5 4.25L6 7.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[var(--foreground)]">
      <path d="M4.25 2.5L7.75 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type ProjectSidebarProps = {
  isSidebarOpen: boolean
  isOpeningProject: boolean
  projectPath: string | null
  activities: ActivityItem[]
  expandedActivityKeys: Set<string>
  leftPanelMode: 'none' | 'system-settings'
  onOpenProject: () => void
  onToggleActivity: (activityKey: string) => void
  onAddActivity: () => void
  onAddTask: (activityKey: string) => void
  onAddStory: (activityKey: string, taskLabel?: string) => void
  onDeleteActivity: (activityKey: string) => void
  onDeleteTask: (activityKey: string, taskIndex: number) => void
  onToggleSystemSettings: () => void
}

function SidebarActionsMenu({
  ariaLabel,
  newItems,
  deleteItems,
}: {
  ariaLabel: string
  newItems?: Array<{ label: string; onClick: () => void; ariaLabel?: string }>
  deleteItems?: Array<{ label: string; onClick: () => void; ariaLabel?: string }>
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const hasNewItems = Boolean(newItems && newItems.length > 0)
  const hasDeleteItems = Boolean(deleteItems && deleteItems.length > 0)

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent): void {
      if (!open) return
      if (!rootRef.current) return
      const target = event.target as Node
      if (!rootRef.current.contains(target)) setOpen(false)
    }

    function onDocumentKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocumentMouseDown)
    document.addEventListener('keydown', onDocumentKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown)
      document.removeEventListener('keydown', onDocumentKeyDown)
    }
  }, [open])

  function runAction(onClick: () => void): void {
    onClick()
    setOpen(false)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="flex h-5 w-5 items-center justify-center rounded bg-[var(--card)] text-[10px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        title="Actions"
        aria-label={ariaLabel}
      >
        ...
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded border border-[var(--border)] bg-[var(--card)] p-1 shadow-md">
          {newItems?.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => runAction(item.onClick)}
              aria-label={item.ariaLabel}
              className="block w-full rounded px-2 py-1 text-left text-[11px] text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              {item.label}
            </button>
          ))}
          {hasNewItems && hasDeleteItems ? <div className="my-1 h-px bg-[var(--border)]" /> : null}
          {deleteItems?.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => runAction(item.onClick)}
              aria-label={item.ariaLabel}
              className="block w-full rounded px-2 py-1 text-left text-[11px] text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ProjectSidebar({
  isSidebarOpen,
  isOpeningProject,
  projectPath,
  activities,
  expandedActivityKeys,
  leftPanelMode,
  onOpenProject,
  onToggleActivity,
  onAddActivity,
  onAddTask,
  onAddStory,
  onDeleteActivity,
  onDeleteTask,
  onToggleSystemSettings,
}: ProjectSidebarProps) {
  return (
    <>
      <aside
        aria-label="Sidebar"
        className={[
          'absolute inset-y-0 left-0 z-20 flex h-full shrink-0 flex-col overflow-hidden bg-[var(--background)] will-change-[transform,width,opacity] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0',
          isSidebarOpen
            ? 'w-60 translate-x-0 opacity-100 border-r border-[var(--border)]'
            : 'w-60 -translate-x-full opacity-0 border-r border-transparent pointer-events-none lg:w-0 lg:translate-x-0 lg:opacity-100 lg:border-r-0',
        ].join(' ')}
      >
        <div className="flex-1 space-y-0.5 overflow-y-auto px-0 py-2">
          <p className="px-3 py-1 text-[10px] font-semibold tracking-[1px] text-[var(--muted-foreground)]">PROJECT</p>
          <button
            type="button"
            onClick={onOpenProject}
            disabled={isOpeningProject}
            className="mx-2 inline-flex h-8 w-[calc(100%-1rem)] items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-[12px] font-medium text-[var(--foreground)] shadow-[0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[var(--muted)]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0 text-[var(--muted-foreground)]">
              <path
                d="M1.5 3.5h3l1 1h5v4.75a1.25 1.25 0 0 1-1.25 1.25h-7.5A1.25 1.25 0 0 1 .5 9.25V4.5A1 1 0 0 1 1.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{isOpeningProject ? 'Opening...' : 'Open Project...'}</span>
          </button>
          <div className="px-3 py-1 text-[10px] text-[var(--muted-foreground)]" data-testid="project-context">
            {projectPath ? projectPath : 'No project selected'}
          </div>
          <div className="mx-2 mb-1 flex items-center gap-1 px-1">
            <p className="text-[10px] font-semibold tracking-[1px] text-[var(--muted-foreground)]">ACTIVITIES</p>
            <button
              type="button"
              onClick={onAddActivity}
              className="ml-auto flex h-5 w-5 items-center justify-center rounded bg-[var(--card)] text-[11px] leading-none text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              title="Add activity"
              aria-label="Add activity"
            >
              +
            </button>
          </div>
          {activities.map((item) => {
            const isOpen = expandedActivityKeys.has(item.key)
            return (
              <div key={item.key} className="px-0">
                <div className="mx-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleActivity(item.key)}
                    className={[
                      'flex min-w-0 flex-1 items-center gap-1.5 rounded px-3 py-1.5 text-left',
                      item.selected ? 'bg-[var(--accent)]' : 'bg-transparent hover:bg-[var(--muted)]',
                    ].join(' ')}
                    aria-expanded={isOpen}
                  >
                    <Chevron open={isOpen} />
                    <span className="truncate text-[13px] font-medium text-[var(--foreground)]">{item.label}</span>
                    <span className="ml-auto rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                      {item.count}
                    </span>
                  </button>
                  <SidebarActionsMenu
                    ariaLabel={`Open actions for ${item.label}`}
                    newItems={[
                      { label: 'Add task', onClick: () => onAddTask(item.key), ariaLabel: `Add task in ${item.label}` },
                    ]}
                    deleteItems={[
                      { label: 'Delete activity', onClick: () => onDeleteActivity(item.key), ariaLabel: `Delete activity ${item.label}` },
                    ]}
                  />
                </div>
                {isOpen
                  ? item.tasks?.map((task, taskIndex) => (
                    <div key={`${task}-${taskIndex}`} className="mx-2 mt-0.5 flex items-center gap-1.5 rounded py-1.5 pl-8 pr-0">
                      <span className="text-[10px] text-[var(--muted-foreground)]">o</span>
                      <span className="truncate text-[12px] text-[var(--foreground)]">{task}</span>
                      <span className="ml-auto">
                        <SidebarActionsMenu
                          ariaLabel={`Open task actions for ${task}`}
                          newItems={[
                            { label: 'Add story', onClick: () => onAddStory(item.key, task), ariaLabel: `Add story in ${task}` },
                          ]}
                          deleteItems={[
                            { label: 'Delete task', onClick: () => onDeleteTask(item.key, taskIndex), ariaLabel: `Delete task ${task}` },
                          ]}
                        />
                      </span>
                    </div>
                  ))
                  : null}
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--border)] p-2">
          <button
            type="button"
            onClick={onToggleSystemSettings}
            className="inline-flex h-8 w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
              <circle cx="6" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1M2.8 2.8l.7.7M8.5 8.5l.7.7M9.2 2.8l-.7.7M3.5 8.5l-.7.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span>System Settings</span>
          </button>
        </div>
      </aside>

      <aside
        aria-label="System Settings Panel"
        data-mode={leftPanelMode}
        className={[
          'absolute inset-y-0 left-0 z-30 w-72 border-r border-[var(--border)] bg-[var(--card)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          leftPanelMode === 'system-settings' ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <header className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4">
          <p className="text-[14px] font-semibold">System Settings</p>
          <button
            type="button"
            className="no-drag flex h-8 w-8 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            style={NO_DRAG_REGION_STYLE}
            onClick={onToggleSystemSettings}
            aria-label="Close system settings"
          >
            x
          </button>
        </header>
        <div className="space-y-3 p-4 text-[12px] text-[var(--foreground)]">
          <p>Format Mode</p>
          <div className="rounded border border-[var(--border)] bg-[var(--muted)] p-2">Preserve Existing</div>
          <p>Backup on Save</p>
          <div className="rounded border border-[var(--border)] bg-[var(--muted)] p-2">Enabled</div>
        </div>
      </aside>
    </>
  )
}
