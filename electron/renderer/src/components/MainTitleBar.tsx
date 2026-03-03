import { DRAG_REGION_STYLE, NO_DRAG_REGION_STYLE } from '../constants/app-constants'

export type View = 'board' | 'outline' | 'timeline'
export type ThemeMode = 'system' | 'light' | 'dark'

type MainTitleBarProps = {
  isSidebarOpen: boolean
  activeView: View
  activeTheme: ThemeMode
  onToggleSidebar: () => void
  onChangeView: (view: View) => void
  onChangeTheme: (theme: ThemeMode) => void
}

export default function MainTitleBar({
  isSidebarOpen,
  activeView,
  activeTheme,
  onToggleSidebar,
  onChangeView,
  onChangeTheme,
}: MainTitleBarProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

  return (
    <header
      className={[
        'drag-region flex h-12 items-center border-b border-[var(--border)] bg-[var(--background)] pr-0',
        isMac ? 'pl-[88px]' : 'pl-3',
      ].join(' ')}
      style={DRAG_REGION_STYLE}
    >
      {/* Left: Story Map title + add button */}
      <div className="flex w-[152px] shrink-0 items-center gap-2 pr-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className="shrink-0 text-[var(--foreground)]"
        >
          <rect x="1" y="1" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="11" y="1" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="1" y="8" width="8" height="4" rx="1.5" fill="currentColor" opacity="0.55" />
          <rect x="11" y="8" width="8" height="4" rx="1.5" fill="currentColor" opacity="0.55" />
          <rect x="1" y="14" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.25" />
          <rect x="11" y="14" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.25" />
        </svg>
        <span className="text-[15px] font-semibold text-[var(--foreground)]">Story Map</span>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="no-drag ml-auto flex h-6 w-6 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          style={NO_DRAG_REGION_STYLE}
        >
          <svg
            viewBox="-0.5 -0.5 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            id="Sidebar-Collapse--Streamline-Iconoir"
            height="16"
            width="16"
            aria-hidden
          >
            <path
              d="M12.7769375 14.284625H2.2230625c-0.8326875 0 -1.5076875 -0.675 -1.5076875 -1.5076875l0 -10.553875c0 -0.8326875 0.675 -1.5076875 1.5076875 -1.5076875h10.553875c0.8326875 0 1.5076875 0.675 1.5076875 1.5076875v10.553875c0 0.8326875 -0.675 1.5076875 -1.5076875 1.5076875Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
            />
            <g transform="translate(7.35 0)">
              <path
                d={
                  isSidebarOpen
                    ? 'M3.9192500000000003 5.9923125 2.6 7.5l1.3192499999999998 1.5076875'
                    : 'M2.6 5.9923125 3.9192500000000003 7.5l-1.3192499999999998 1.5076875'
                }
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
              />
            </g>
            <path
              d="M5.615375 14.284625V0.7153750000000001"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
            />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px shrink-0 bg-[var(--border)]" />

      {/* Middle: Search + Filters + View toggle */}
      <div className="flex flex-1 items-center gap-2 px-3">
        <div className="flex h-7 w-[210px] items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)] px-2.5 text-[12px] text-[var(--muted-foreground)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 8.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Search stories, slugs, docs...</span>
        </div>

        <div className="h-5 w-px bg-[var(--border)]" />
        <span className="text-[12px] font-medium text-[var(--muted-foreground)]">Filters:</span>

        <button
          type="button"
          className="no-drag inline-flex h-7 items-center gap-1 rounded-md bg-[var(--muted)] px-2.5 text-[12px] text-[var(--foreground)]"
          style={NO_DRAG_REGION_STYLE}
        >
          Status: All
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          className="no-drag inline-flex h-7 items-center gap-1 rounded-md bg-[var(--muted)] px-2.5 text-[12px] text-[var(--foreground)]"
          style={NO_DRAG_REGION_STYLE}
        >
          Has docs
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-px rounded-md bg-[var(--muted)] p-0.5">
            <button
              type="button"
              onClick={() => onChangeView('board')}
              className={[
                'no-drag flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px]',
                activeView === 'board'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <rect x="1" y="1" width="3" height="11" rx="1" fill="currentColor" />
                <rect x="5" y="1" width="3" height="11" rx="1" fill="currentColor" />
                <rect x="9" y="1" width="3" height="11" rx="1" fill="currentColor" />
              </svg>
              Board
            </button>

            <button
              type="button"
              onClick={() => onChangeView('outline')}
              className={[
                'no-drag flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px]',
                activeView === 'outline'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <rect x="1" y="2" width="5" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="5.75" width="11" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="9.5" width="9" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
              Outline
            </button>

            <button
              type="button"
              onClick={() => onChangeView('timeline')}
              className={[
                'no-drag flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px]',
                activeView === 'timeline'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3.5" y="0.25" width="1.5" height="3" rx="0.75" fill="currentColor" />
                <rect x="8" y="0.25" width="1.5" height="3" rx="0.75" fill="currentColor" />
                <line x1="1" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="3" y="7" width="3" height="1.5" rx="0.5" fill="currentColor" />
              </svg>
              Timeline
            </button>
          </div>

          {/* Theme selector */}
          <div
            role="group"
            aria-label="Theme selector"
            className="flex items-center gap-px rounded-md bg-[var(--muted)] p-0.5"
          >
            <button
              type="button"
              onClick={() => onChangeTheme('system')}
              aria-label="Use system theme"
              title="System"
              className={[
                'no-drag flex h-7 w-7 items-center justify-center rounded',
                activeTheme === 'system'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <rect x="1.5" y="2" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M7 9.5V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('light')}
              aria-label="Use light theme"
              title="Light"
              className={[
                'no-drag flex h-7 w-7 items-center justify-center rounded',
                activeTheme === 'light'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 1.25v1.5M7 11.25v1.5M1.25 7h1.5M11.25 7h1.5M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M11.07 2.93l-1.06 1.06M3.99 10.01l-1.06 1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('dark')}
              aria-label="Use dark theme"
              title="Dark"
              className={[
                'no-drag flex h-7 w-7 items-center justify-center rounded',
                activeTheme === 'dark'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={NO_DRAG_REGION_STYLE}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M9.75 2.25A5 5 0 1 0 11.75 10 4.75 4.75 0 1 1 9.75 2.25Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </header>
  )
}
