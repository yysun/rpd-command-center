import { useEffect, useMemo, useRef, useState } from 'react'
import type { BoardColumnData, InspectorStoryData, StoryCardData, StoryMap, TaskRowData } from 'core'
import type { OutlinerBlock, OutlinerPage } from 'outliner'
import BoardLanes from './components/BoardLanes'
import OutlinerLanes from './components/Outliner'
import MainTitleBar, { type ThemeMode, type View } from './components/MainTitleBar'
import ProjectSidebar from './components/ProjectSidebar'
import StoryInspector from './components/StoryInspector'
import { mockBoardColumns } from './components/storyMapMocks'
import type { ActivityItem } from './components/storyMapTypes'
import { findStoryMapFile, isMatchingWatchEvent, joinPath } from './appShell'

const THEME_STORAGE_KEY = 'rpd-theme-preference'

type ApiBridge = {
  openWorkspace: () => Promise<{ ok: true; data: { workspacePath: string; markdownFiles: string[] } } | { ok: false; error: { code: string; message: string } }>
  loadStoryMap: (filePath: string) => Promise<{ ok: true; data: { filePath: string; map: StoryMap } } | { ok: false; error: { code: string; message: string } }>
  startWatchStoryMap: (filePath: string) => Promise<{ ok: true; data: { filePath: string } } | { ok: false; error: { code: string; message: string } }>
  stopWatchStoryMap: () => Promise<{ ok: true; data: { stopped: boolean } } | { ok: false; error: { code: string; message: string } }>
  onExternalStoryMapChanged: (listener: (payload: { filePath: string }) => void) => () => void
  onStoryMapWatchError: (listener: (payload: { filePath: string; message: string }) => void) => () => void
} | null

type ColumnHistory = {
  past: BoardColumnData[][]
  present: BoardColumnData[]
  future: BoardColumnData[][]
}

function getApi(): ApiBridge {
  if (typeof window === 'undefined') return null
  return (window as Window & { api?: ApiBridge }).api ?? null
}

function cloneColumns(columns: BoardColumnData[]): BoardColumnData[] {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => ({ ...task })),
    cards: column.cards.map((card) => ({
      ...card,
      inspector: {
        ...card.inspector,
        docRefs: card.inspector.docRefs.map((docRef) => ({ ...docRef })),
      },
    })),
  }))
}

function countDoneStories(column: BoardColumnData): number {
  return column.cards.filter((card) => card.inspector.status === 'done').length
}

function taskBlockId(taskId: string): string {
  if (taskId.startsWith('task:') || taskId.startsWith('block:')) return taskId
  return `task:${taskId}`
}

function storyBlockId(storyId: string): string {
  if (storyId.startsWith('story:') || storyId.startsWith('block:')) return storyId
  return `story:${storyId}`
}

function parsePrefixedId(value: string, prefix: string): string | null {
  return value.startsWith(prefix) ? value.slice(prefix.length) : null
}

function collectStoryBlocks(blocks: OutlinerBlock[]): OutlinerBlock[] {
  const output: OutlinerBlock[] = []
  const stack = [...blocks]

  while (stack.length > 0) {
    const next = stack.shift()
    if (!next) continue
    output.push(next)
    stack.unshift(...next.children)
  }

  return output
}

function defaultInspector(storyId: string, title: string): InspectorStoryData {
  return {
    id: storyId,
    title,
    status: 'todo',
    slug: storyId,
    notes: '',
    docRefs: [],
  }
}

function columnsToOutlinerPages(columns: BoardColumnData[]): OutlinerPage[] {
  return columns.map((column) => ({
    id: column.key,
    title: column.title,
    blocks: column.tasks.map((task) => ({
      id: taskBlockId(task.id),
      content: task.label,
      children: column.cards
        .filter((card) => card.taskId === task.id)
        .map((card) => ({
          id: storyBlockId(card.id),
          content: card.title,
          children: [],
        })),
    })),
  }))
}

function outlinerPagesToColumns(pages: OutlinerPage[], previous: BoardColumnData[]): BoardColumnData[] {
  const previousByColumn = new Map(previous.map((column) => [column.key, column]))

  return pages.map((page) => {
    const previousColumn = previousByColumn.get(page.id)
    const previousStories = new Map((previousColumn?.cards ?? []).map((card) => [card.id, card]))

    const tasks: TaskRowData[] = []
    const cards: StoryCardData[] = []

    for (const taskBlock of page.blocks) {
      const parsedTaskId = parsePrefixedId(taskBlock.id, 'task:')
      const taskId = parsedTaskId ?? taskBlock.id
      tasks.push({ id: taskId, label: taskBlock.content.trim() })

      for (const storyBlock of collectStoryBlocks(taskBlock.children)) {
        const parsedStoryId = parsePrefixedId(storyBlock.id, 'story:')
        const storyId = parsedStoryId ?? storyBlock.id
        const title = storyBlock.content.trim()
        const previousStory = previousStories.get(storyId)
        const inspector = previousStory
          ? {
            ...previousStory.inspector,
            id: storyId,
            title,
          }
          : defaultInspector(storyId, title)

        cards.push({
          id: storyId,
          title,
          taskId,
          meta: previousStory?.meta ?? 'todo  owner:unassigned',
          docs: previousStory?.docs,
          inspector,
        })
      }
    }

    return {
      key: page.id,
      title: page.title.trim(),
      count: String(cards.length),
      tasks,
      cards,
    }
  })
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
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)
  const [markdownFiles, setMarkdownFiles] = useState<string[]>([])
  const [activeRelativeFilePath, setActiveRelativeFilePath] = useState<string | null>(null)
  const [activeAbsoluteFilePath, setActiveAbsoluteFilePath] = useState<string | null>(null)
  const [storyMap, setStoryMap] = useState<StoryMap | null>(null)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false)
  const [isLoadingStoryMap, setIsLoadingStoryMap] = useState(false)
  const [watchErrorMessage, setWatchErrorMessage] = useState<string | null>(null)
  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Set<string>>(new Set())
  const [hasApi, setHasApi] = useState<boolean>(() => Boolean(getApi()))
  const [columnHistory, setColumnHistory] = useState<ColumnHistory>({
    past: [],
    present: cloneColumns(mockBoardColumns),
    future: [],
  })
  const requestVersionRef = useRef(0)
  const idCounterRef = useRef(1)

  const baseColumns = useMemo<BoardColumnData[]>(() => {
    if (!storyMap) return mockBoardColumns

    return storyMap.activities.map((activity) => {
      const tasks: TaskRowData[] = activity.tasks.map((task) => ({
        id: task.id,
        label: task.title,
      }))

      const stories = activity.tasks.flatMap((task) =>
        task.stories.map((story) => ({
          story,
          taskId: task.id,
        })),
      )

      return {
        key: activity.id,
        title: activity.title,
        count: String(stories.length),
        tasks,
        cards: stories.map(({ story, taskId }) => ({
          id: story.id,
          title: story.title,
          taskId,
          meta: `${story.status}  slug:${story.slug || '-'}`,
          docs: story.docRefs.length ? story.docRefs.map((docRef) => docRef.type).join(', ') : undefined,
          inspector: {
            id: story.id,
            title: story.title,
            status: story.status,
            slug: story.slug || '',
            notes: story.notes || '',
            docRefs: story.docRefs.map((docRef) => ({
              id: docRef.id,
              type: docRef.type,
              date: docRef.date,
              filename: docRef.filename,
            })),
          },
        })),
      }
    })
  }, [storyMap])

  const uiColumns = columnHistory.present
  const outlinerPages = useMemo(() => columnsToOutlinerPages(uiColumns), [uiColumns])

  const uiActivities = useMemo<ActivityItem[]>(() => {
    return uiColumns.map((column, index) => ({
      key: column.key,
      label: column.title,
      count: `${countDoneStories(column)}/${column.cards.length}`,
      selected: index === 0,
      tasks: column.tasks,
    }))
  }, [uiColumns])

  const selectedStory = useMemo<InspectorStoryData | null>(() => {
    if (!selectedStoryId) return null
    const found = uiColumns.flatMap((column) => column.cards).find((card) => card.id === selectedStoryId)
    return found?.inspector ?? null
  }, [selectedStoryId, uiColumns])

  useEffect(() => {
    setColumnHistory({
      past: [],
      present: cloneColumns(baseColumns),
      future: [],
    })
  }, [baseColumns])

  useEffect(() => {
    if (uiActivities.length === 0) {
      setExpandedActivityKeys(new Set())
      return
    }

    setExpandedActivityKeys((previous) => {
      const validKeys = new Set(uiActivities.map((item) => item.key))
      const next = new Set(Array.from(previous).filter((key) => validKeys.has(key)))
      if (next.size === 0) next.add(uiActivities[0].key)
      return next
    })
  }, [uiActivities])

  function applyColumns(nextColumns: BoardColumnData[]): void {
    setColumnHistory((previous) => ({
      past: [...previous.past, previous.present],
      present: nextColumns,
      future: [],
    }))
  }

  function mutateColumns(mutator: (draft: BoardColumnData[]) => boolean): void {
    const draft = cloneColumns(uiColumns)
    const changed = mutator(draft)
    if (changed) applyColumns(draft)
  }

  useEffect(() => {
    if (hasApi) return

    let attempts = 0
    const maxAttempts = 20
    const retryMs = 100
    const timer = window.setInterval(() => {
      if (getApi()) {
        setHasApi(true)
        window.clearInterval(timer)
        return
      }

      attempts += 1
      if (attempts >= maxAttempts) {
        window.clearInterval(timer)
      }
    }, retryMs)

    return () => window.clearInterval(timer)
  }, [hasApi])

  async function openWorkspace(): Promise<void> {
    const api = getApi()
    if (!api) {
      return
    }

    setIsOpeningWorkspace(true)
    requestVersionRef.current += 1
    const requestVersion = requestVersionRef.current

    const result = await api.openWorkspace()
    setIsOpeningWorkspace(false)

    if (requestVersion !== requestVersionRef.current) return

    if (!result.ok) {
      if (result.error.code !== 'WORKSPACE_OPEN_CANCELLED') {
        console.error(result.error.message)
      }
      return
    }

    await api.stopWatchStoryMap()

    setWorkspacePath(result.data.workspacePath)
    setMarkdownFiles(result.data.markdownFiles)
    setActiveRelativeFilePath(null)
    setActiveAbsoluteFilePath(null)
    setStoryMap(null)
    setSelectedStoryId(null)
    setWatchErrorMessage(null)

    const storyMapFile = findStoryMapFile(result.data.markdownFiles)
    if (storyMapFile) {
      await loadStoryMapFile(storyMapFile, result.data.workspacePath)
    }
  }

  async function loadStoryMapFile(relativePath: string, projectPathOverride?: string): Promise<void> {
    const api = getApi()
    const effectiveProjectPath = projectPathOverride ?? workspacePath
    if (!api || !effectiveProjectPath) return

    requestVersionRef.current += 1
    const requestVersion = requestVersionRef.current

    const absolutePath = joinPath(effectiveProjectPath, relativePath)
    setIsLoadingStoryMap(true)
    setWatchErrorMessage(null)

    const result = await api.loadStoryMap(absolutePath)
    if (requestVersion !== requestVersionRef.current) return

    if (!result.ok) {
      setIsLoadingStoryMap(false)
      console.error(result.error.message)
      return
    }

    setStoryMap(result.data.map)
    setActiveRelativeFilePath(relativePath)
    setActiveAbsoluteFilePath(result.data.filePath)
    setSelectedStoryId(null)
    setIsLoadingStoryMap(false)

    const watchResult = await api.startWatchStoryMap(result.data.filePath)
    if (requestVersion !== requestVersionRef.current) return

    if (!watchResult.ok) {
      setWatchErrorMessage(watchResult.error.message)
    }
  }

  async function reloadStoryMap(): Promise<void> {
    if (!activeRelativeFilePath) return
    await loadStoryMapFile(activeRelativeFilePath)
  }

  function selectStoryById(storyId?: string): void {
    if (storyId) setSelectedStoryId(storyId)
  }

  function toggleActivity(activityKey: string): void {
    setExpandedActivityKeys((previous) => {
      const next = new Set(previous)
      if (next.has(activityKey)) next.delete(activityKey)
      else next.add(activityKey)
      return next
    })
  }

  function nextId(prefix: string): string {
    const id = `${prefix}-${idCounterRef.current}`
    idCounterRef.current += 1
    return id
  }

  function confirmDeletion(message: string): boolean {
    if (typeof window === 'undefined') return true
    return window.confirm(message)
  }

  function onAddActivity(): void {
    const activityId = nextId('activity')
    const taskId = nextId('task')
    mutateColumns((draft) => {
      draft.push({
        key: activityId,
        title: `New Activity ${draft.length + 1}`,
        count: '0',
        tasks: [{ id: taskId, label: 'New Task' }],
        cards: [],
      })
      return true
    })

    setExpandedActivityKeys((previous) => new Set([...previous, activityId]))
  }

  function onAddTask(activityKey: string): void {
    const taskId = nextId('task')
    mutateColumns((draft) => {
      const column = draft.find((item) => item.key === activityKey)
      if (!column) return false
      column.tasks.push({ id: taskId, label: `New Task ${column.tasks.length + 1}` })
      return true
    })

    setExpandedActivityKeys((previous) => new Set([...previous, activityKey]))
  }

  function onAddStory(activityKey: string, taskId?: string): void {
    const storyId = nextId('story')
    const storyTitle = `New Story ${idCounterRef.current}`

    mutateColumns((draft) => {
      const column = draft.find((item) => item.key === activityKey)
      if (!column) return false

      if (column.tasks.length === 0) {
        column.tasks.push({ id: nextId('task'), label: 'New Task' })
      }

      const targetTaskId = taskId ?? column.tasks[0]?.id
      if (!targetTaskId) return false

      column.cards.push({
        id: storyId,
        title: storyTitle,
        taskId: targetTaskId,
        meta: 'todo  owner:unassigned',
        inspector: {
          id: storyId,
          title: storyTitle,
          status: 'todo',
          slug: storyId,
          notes: '(new) Add story details here.',
          docRefs: [],
        },
      })
      column.count = String(column.cards.length)
      return true
    })
  }

  function onDeleteActivity(activityKey: string): void {
    const activityLabel = uiActivities.find((activity) => activity.key === activityKey)?.label ?? 'this activity'
    if (!confirmDeletion(`Delete ${activityLabel} and all its tasks/stories?`)) return

    mutateColumns((draft) => {
      const idx = draft.findIndex((item) => item.key === activityKey)
      if (idx < 0) return false
      draft.splice(idx, 1)
      return true
    })

    setExpandedActivityKeys((previous) => {
      const next = new Set(previous)
      next.delete(activityKey)
      return next
    })
  }

  function onDeleteTask(activityKey: string, taskId: string): void {
    const column = uiColumns.find((candidate) => candidate.key === activityKey)
    const taskLabel = column?.tasks.find((task) => task.id === taskId)?.label
    if (!taskLabel) return

    const removedStories = column?.cards.filter((card) => card.taskId === taskId) ?? []

    if (!confirmDeletion(`Delete ${taskLabel} and ${removedStories.length} linked stor${removedStories.length === 1 ? 'y' : 'ies'}?`)) return

    mutateColumns((draft) => {
      const targetColumn = draft.find((item) => item.key === activityKey)
      if (!targetColumn) return false
      targetColumn.tasks = targetColumn.tasks.filter((task) => task.id !== taskId)
      targetColumn.cards = targetColumn.cards.filter((card) => card.taskId !== taskId)
      targetColumn.count = String(targetColumn.cards.length)
      return true
    })

    if (selectedStoryId && removedStories.some((story) => story.id === selectedStoryId)) {
      setSelectedStoryId(null)
    }
  }

  function onDeleteStory(activityKey: string, storyId: string): void {
    const storyTitle = uiColumns
      .find((column) => column.key === activityKey)
      ?.cards.find((card) => card.id === storyId)
      ?.title ?? 'this story'

    if (!confirmDeletion(`Delete ${storyTitle}?`)) return

    mutateColumns((draft) => {
      const column = draft.find((item) => item.key === activityKey)
      if (!column) return false
      const nextCards = column.cards.filter((card) => card.id !== storyId)
      if (nextCards.length === column.cards.length) return false
      column.cards = nextCards
      column.count = String(nextCards.length)
      return true
    })

    if (selectedStoryId === storyId) setSelectedStoryId(null)
  }

  function onOutlinerPagesChange(nextPages: OutlinerPage[]): void {
    applyColumns(outlinerPagesToColumns(nextPages, uiColumns))
  }

  function onOutlinerBlockFocus(blockId?: string): void {
    if (!blockId) return
    const parsedStoryId = parsePrefixedId(blockId, 'story:')
    if (parsedStoryId) {
      selectStoryById(parsedStoryId)
      return
    }

    const hasStory = uiColumns.some((column) => column.cards.some((card) => card.id === blockId))
    if (hasStory) selectStoryById(blockId)
  }

  function undoOutliner(): void {
    setColumnHistory((previous) => {
      if (previous.past.length === 0) return previous
      const nextPresent = previous.past[previous.past.length - 1]
      return {
        past: previous.past.slice(0, -1),
        present: nextPresent,
        future: [previous.present, ...previous.future],
      }
    })
  }

  function redoOutliner(): void {
    setColumnHistory((previous) => {
      if (previous.future.length === 0) return previous
      const [nextPresent, ...nextFuture] = previous.future
      return {
        past: [...previous.past, previous.present],
        present: nextPresent,
        future: nextFuture,
      }
    })
  }

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
    const api = getApi()
    if (!api) return

    const disposeExternalChanged = api.onExternalStoryMapChanged(({ filePath }) => {
      if (!isMatchingWatchEvent(activeAbsoluteFilePath, filePath)) return

      const shouldReload = window.confirm('Story map changed outside the app. Reload now?')
      if (shouldReload) {
        void reloadStoryMap()
      }
    })

    const disposeWatchError = api.onStoryMapWatchError(({ filePath, message }) => {
      if (!isMatchingWatchEvent(activeAbsoluteFilePath, filePath)) return
      setWatchErrorMessage(message)
    })

    return () => {
      disposeExternalChanged()
      disposeWatchError()
    }
  }, [activeAbsoluteFilePath])

  useEffect(() => {
    const api = getApi()
    if (!api) return
    return () => {
      void api.stopWatchStoryMap()
    }
  }, [])

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
        <ProjectSidebar
          isSidebarOpen={isSidebarOpen}
          isOpeningProject={isOpeningWorkspace}
          projectPath={workspacePath}
          activities={uiActivities}
          expandedActivityKeys={expandedActivityKeys}
          leftPanelMode={leftPanelMode}
          onOpenProject={() => {
            void openWorkspace()
          }}
          onToggleActivity={toggleActivity}
          onAddActivity={onAddActivity}
          onAddTask={onAddTask}
          onAddStory={onAddStory}
          onDeleteActivity={onDeleteActivity}
          onDeleteTask={onDeleteTask}
          onToggleSystemSettings={() => setLeftPanelMode((mode) => (mode === 'system-settings' ? 'none' : 'system-settings'))}
        />

        {activeView === 'board' ? (
          <BoardLanes
            columns={uiColumns}
            onStoryClick={selectStoryById}
            onAddTask={onAddTask}
            onAddStory={onAddStory}
            onDeleteActivity={onDeleteActivity}
            onDeleteStory={onDeleteStory}
          />
        ) : null}

        {activeView === 'outline' ? (
          <OutlinerLanes
            pages={outlinerPages}
            onPagesChange={onOutlinerPagesChange}
            onBlockFocus={onOutlinerBlockFocus}
            onUndo={undoOutliner}
            onRedo={redoOutliner}
            canUndo={columnHistory.past.length > 0}
            canRedo={columnHistory.future.length > 0}
          />
        ) : null}

        {activeView === 'timeline' ? (
          <main aria-label="Timeline" className="flex min-w-0 flex-1 flex-col bg-[var(--background)]">
            <h1 className="sr-only">Timeline</h1>
            <section className="flex-1 overflow-auto bg-[var(--muted)] p-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-[12px] text-[var(--muted-foreground)]">
                Timeline view is not implemented yet.
              </div>
            </section>
          </main>
        ) : null}

        <StoryInspector isOpen={isInspectorOpen} selectedStory={selectedStory} onClose={() => setIsInspectorOpen(false)} />
      </div>

      {hasApi ? null : (
        <div className="absolute right-2 bottom-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--muted-foreground)]">
          Running without preload API (mock mode)
        </div>
      )}

      {isLoadingStoryMap || watchErrorMessage || markdownFiles.length ? (
        <div className="sr-only" aria-live="polite">
          {isLoadingStoryMap ? 'Loading story map' : ''}
          {watchErrorMessage ? `Watch error: ${watchErrorMessage}` : ''}
          {markdownFiles.length ? `${markdownFiles.length} markdown files available` : ''}
        </div>
      ) : null}
    </div>
  )
}
