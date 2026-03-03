import { useEffect, useState } from 'react'
import MainTitleBar, { type ThemeMode, type View } from './components/MainTitleBar'
import { DRAG_REGION_STYLE, NO_DRAG_REGION_STYLE } from './constants/app-constants'

const THEME_STORAGE_KEY = 'rpd-theme-preference'

type ActivityItem = {
  label: string
  count: string
  open?: boolean
  selected?: boolean
  tasks?: string[]
}

type StoryCardData = {
  title: string
  meta: string
  docs?: string
}

type BoardColumnData = {
  title: string
  count: string
  lane: string
  cards: StoryCardData[]
}

const activities: ActivityItem[] = [
  {
    label: 'World Management',
    count: '3/5',
    open: true,
    selected: true,
    tasks: ['Create & configure world', 'Import / export world', 'Manage world settings'],
  },
  { label: 'Agent Authoring', count: '1/6' },
  { label: 'Chat & Conversations', count: '2/4' },
  { label: 'Tools & Skills', count: '0/3' },
  { label: 'Human-in-the-Loop', count: '1/2' },
  { label: 'Multi-Interface Access', count: '0/4' },
  { label: 'Observability', count: '0/3' },
]

const boardColumns: BoardColumnData[] = [
  {
    title: 'World Management',
    count: '5',
    lane: 'Create & configure world',
    cards: [
      { title: 'Create new world from scratch', meta: 'todo  low  owner:core', docs: 'REQ, PLAN' },
      { title: 'Validate world configuration schema', meta: 'in-progress  medium  owner:core', docs: 'REQ' },
    ],
  },
  {
    title: 'Agent Authoring',
    count: '6',
    lane: 'Define agent',
    cards: [
      { title: 'Write agent persona & instructions', meta: 'todo  high  owner:frontend' },
      { title: 'Configure agent model & params', meta: 'todo  medium  owner:frontend', docs: 'PLAN' },
    ],
  },
  {
    title: 'Chat & Conversations',
    count: '4',
    lane: 'Start conversation',
    cards: [
      { title: 'Start new chat session', meta: 'done  low  owner:app', docs: 'DONE' },
      { title: 'Resume previous conversation', meta: 'todo  medium  owner:app' },
    ],
  },
]

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

function StoryCard({ story, onClick }: { story: StoryCardData; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2.5 text-left shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]"
    >
      <h4 className="text-[12px] leading-4 font-medium text-[var(--foreground)]">{story.title}</h4>
      <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">{story.meta}</p>
      {story.docs ? <p className="mt-1 text-[10px] font-semibold text-[var(--muted-foreground)]">{story.docs}</p> : null}
    </button>
  )
}

function BoardColumn({ column, onStoryClick }: { column: BoardColumnData; onStoryClick: () => void }) {
  return (
    <section className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="text-[12px] font-semibold text-[var(--foreground)]">{column.title}</span>
        <span className="ml-auto rounded-full bg-[var(--muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
          {column.count}
        </span>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <div className="px-1 py-1 text-[11px] font-medium tracking-[0.3px] text-[var(--muted-foreground)]">{column.lane}</div>
        {column.cards.map((story) => (
          <StoryCard key={story.title} story={story} onClick={onStoryClick} />
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [leftPanelMode, setLeftPanelMode] = useState<'none' | 'system-settings'>('none')
  const [activeView, setActiveView] = useState<View>('board')
  const [activeTheme, setActiveTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system'

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'system'
  })

  useEffect(() => {
    const updateDesktopState = () => {
      const isDesktop = window.innerWidth >= 1024
      setIsSidebarOpen(isDesktop)
    }

    updateDesktopState()
    window.addEventListener('resize', updateDesktopState)
    return () => window.removeEventListener('resize', updateDesktopState)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme)
  }, [activeTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolvedTheme = activeTheme === 'system' ? (darkMediaQuery.matches ? 'dark' : 'light') : activeTheme
      root.dataset.theme = resolvedTheme
      root.style.colorScheme = resolvedTheme
    }

    applyTheme()

    if (activeTheme !== 'system') return

    const onSystemThemeChange = () => applyTheme()
    darkMediaQuery.addEventListener('change', onSystemThemeChange)
    return () => darkMediaQuery.removeEventListener('change', onSystemThemeChange)
  }, [activeTheme])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <MainTitleBar
        isSidebarOpen={isSidebarOpen}
        activeView={activeView}
        activeTheme={activeTheme}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onChangeView={setActiveView}
        onChangeTheme={setActiveTheme}
      />

      <div className="relative flex h-[calc(100%-3rem)] w-full" data-left-panel-mode={leftPanelMode}>
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
              <span>Open ...</span>
            </button>
            <p className="px-3 py-1 text-[10px] font-semibold tracking-[1px] text-[var(--muted-foreground)]">ACTIVITIES</p>
            {activities.map((item) => (
              <div key={item.label} className="px-0">
                <div
                  className={[
                    'mx-2 flex items-center gap-1.5 rounded px-3 py-1.5',
                    item.selected ? 'bg-[var(--accent)]' : 'bg-transparent',
                  ].join(' ')}
                >
                  <Chevron open={item.open} />
                  <span className="truncate text-[13px] font-medium text-[var(--foreground)]">{item.label}</span>
                  <span className="ml-auto rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {item.count}
                  </span>
                </div>
                {item.tasks?.map((task) => (
                  <div key={task} className="mx-2 mt-0.5 flex items-center gap-1.5 rounded px-3 py-1.5 pl-8">
                    <span className="text-[10px] text-[var(--muted-foreground)]">o</span>
                    <span className="text-[12px] text-[var(--foreground)]">{task}</span>
                  </div>
                ))}
              </div>
            ))}

          </div>

          <div className="border-t border-[var(--border)] p-2">
            <button
              type="button"
              onClick={() => setLeftPanelMode((mode) => (mode === 'system-settings' ? 'none' : 'system-settings'))}
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
              onClick={() => setLeftPanelMode('none')}
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

        <main aria-label="Outliner" className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
          <h1 className="sr-only">Outliner</h1>
          <section className="flex-1 overflow-auto bg-[var(--muted)] p-4">
            <div className="flex min-h-full w-max gap-3">
              {boardColumns.map((column) => (
                <BoardColumn key={column.title} column={column} onStoryClick={() => setIsInspectorOpen(true)} />
              ))}
            </div>
          </section>
        </main>

        <button
          type="button"
          aria-label="Close story details"
          onClick={() => setIsInspectorOpen(false)}
          className={[
            'absolute inset-0 z-10 bg-black/20 transition-opacity duration-300 lg:hidden',
            isInspectorOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
        />

        <aside
          aria-label="Inspector"
          data-visibility={isInspectorOpen ? 'visible' : 'hidden'}
          className={[
            'absolute inset-y-0 right-0 z-20 flex h-full shrink-0 flex-col overflow-hidden bg-[var(--background)] will-change-[transform,width,opacity] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0',
            isInspectorOpen
              ? 'w-80 translate-x-0 opacity-100 border-l border-[var(--border)]'
              : 'w-80 translate-x-full opacity-0 border-l border-transparent pointer-events-none lg:w-0 lg:translate-x-0 lg:opacity-100 lg:border-l-0',
          ].join(' ')}
        >
          <header
            className="drag-region flex h-12 items-center justify-between border-b border-[var(--border)] px-4"
            style={DRAG_REGION_STYLE}
          >
            <h2 className="sr-only">Inspector</h2>
            <p className="text-[14px] font-semibold text-[var(--foreground)]">Story Details</p>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Close story details"
              className="no-drag flex h-8 w-8 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Title</label>
              <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--foreground)]">
                Import world from GitHub shorthand
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Status</label>
              <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2">
                <span className="rounded-full bg-[var(--status-warn-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warn-fg)]">IN REVIEW</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">v</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Slug</label>
              <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--foreground)]">
                world-import-github
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Notes</label>
              <div className="h-[60px] rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[12px] text-[var(--foreground)]">
                (core) Import from owner/repo shorthand reference
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-[var(--foreground)]">Doc References</p>
                <button type="button" className="rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--foreground)]">
                  + Add
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-2 py-1.5 text-[11px]">
                <span className="rounded bg-[var(--status-info-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--status-info-fg)]">REQ</span>
                <span className="text-[var(--muted-foreground)]">2026-02-25</span>
                <span className="truncate text-[var(--foreground)]">req-world-import-github.md</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-2 py-1.5 text-[11px]">
                <span className="rounded bg-[var(--status-warn-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--status-warn-fg)]">PLAN</span>
                <span className="text-[var(--muted-foreground)]">2026-02-25</span>
                <span className="truncate text-[var(--foreground)]">plan-world-import-github.md</span>
              </div>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <div className="space-y-2">
              <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
                Mark Done
              </button>
              <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
                Move to...
              </button>
              <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
                Duplicate
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
