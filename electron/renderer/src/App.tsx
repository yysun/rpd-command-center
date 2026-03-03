import { useEffect, useMemo, useRef, useState } from 'react'
import type { StoryMap } from 'core'
import OutlinerLanes from './components/OutlinerLanes'
import MainTitleBar, { type ThemeMode, type View } from './components/MainTitleBar'
import ProjectSidebar from './components/ProjectSidebar'
import StoryInspector from './components/StoryInspector'
import { mockActivities, mockBoardColumns } from './components/storyMapMocks'
import type { ActivityItem, BoardColumnData, InspectorStoryData } from './components/storyMapTypes'
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


function getApi(): ApiBridge {
  if (typeof window === 'undefined') return null
  return (window as Window & { api?: ApiBridge }).api ?? null
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
  const [selectedStory, setSelectedStory] = useState<InspectorStoryData | null>(null)
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false)
  const [isLoadingStoryMap, setIsLoadingStoryMap] = useState(false)
  const [watchErrorMessage, setWatchErrorMessage] = useState<string | null>(null)
  const [expandedActivityKeys, setExpandedActivityKeys] = useState<Set<string>>(new Set([mockActivities[0]?.key ?? '']))
  const [uiActivities, setUiActivities] = useState<ActivityItem[]>(mockActivities)
  const [uiColumns, setUiColumns] = useState<BoardColumnData[]>(mockBoardColumns)
  const requestVersionRef = useRef(0)
  const idCounterRef = useRef(1)

  const baseActivities = useMemo<ActivityItem[]>(() => {
    if (!storyMap) return mockActivities

    return storyMap.activities.map((activity, activityIndex) => {
      const storyCount = activity.tasks.reduce((acc, task) => acc + task.stories.length, 0)
      const doneCount = activity.tasks.reduce(
        (acc, task) => acc + task.stories.filter((story) => story.status === 'done').length,
        0,
      )

      return {
        key: activity.id,
        label: activity.title || '(untitled activity)',
        count: `${doneCount}/${storyCount}`,
        selected: activityIndex === 0,
        tasks: activity.tasks.map((task) => task.title || '(untitled task)'),
      }
    })
  }, [storyMap])

  const baseColumns = useMemo<BoardColumnData[]>(() => {
    if (!storyMap) return mockBoardColumns

    return storyMap.activities.map((activity) => {
      const stories = activity.tasks.flatMap((task) =>
        task.stories.map((story) => ({
          story,
          taskTitle: task.title || '(untitled task)',
        })),
      )
      return {
        key: activity.id,
        title: activity.title || '(untitled activity)',
        count: String(stories.length),
        tasks: activity.tasks.length ? activity.tasks.map((task) => task.title || '(untitled task)') : ['No task'],
        cards: stories.map(({ story, taskTitle }) => ({
          id: story.id,
          title: story.title || '(untitled story)',
          task: taskTitle,
          meta: `${story.status}  slug:${story.slug || '-'}`,
          docs: story.docRefs.length ? story.docRefs.map((docRef) => docRef.type).join(', ') : undefined,
          inspector: {
            id: story.id,
            title: story.title || '(untitled story)',
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

  useEffect(() => {
    setUiActivities(baseActivities)
    setUiColumns(baseColumns)
  }, [baseActivities, baseColumns])

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

  const hasApi = Boolean(getApi())

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
    setSelectedStory(null)
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
    setSelectedStory(null)
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
    const foundCard = uiColumns.flatMap((column) => column.cards).find((card) => card.id === storyId)
    if (foundCard) setSelectedStory(foundCard.inspector)
    setIsInspectorOpen(true)
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
    const taskLabel = `Task ${idCounterRef.current}`

    setUiActivities((previous) => [
      ...previous,
      {
        key: activityId,
        label: `New Activity ${previous.length + 1}`,
        count: '0/0',
        tasks: [taskLabel],
      },
    ])

    setUiColumns((previous) => [
      ...previous,
      {
        key: activityId,
        title: `New Activity ${previous.length + 1}`,
        count: '0',
        tasks: [taskLabel],
        cards: [],
      },
    ])

    setExpandedActivityKeys((previous) => new Set([...previous, activityId]))
  }

  function onAddTask(activityKey: string): void {
    const taskLabel = `New Task ${idCounterRef.current}`
    idCounterRef.current += 1

    setUiActivities((previous) =>
      previous.map((activity) =>
        activity.key === activityKey
          ? { ...activity, tasks: [...(activity.tasks ?? []), taskLabel] }
          : activity,
      ),
    )

    setUiColumns((previous) =>
      previous.map((column) => {
        if (column.key !== activityKey) return column
        return {
          ...column,
          tasks: column.tasks.length === 1 && column.tasks[0] === 'No task' ? [taskLabel] : [...column.tasks, taskLabel],
        }
      }),
    )

    setExpandedActivityKeys((previous) => new Set([...previous, activityKey]))
  }

  function onAddStory(activityKey: string, taskLabel?: string): void {
    const storyId = nextId('story')
    const storyTitle = `New Story ${idCounterRef.current}`
    const taskTitle = taskLabel ?? uiColumns.find((column) => column.key === activityKey)?.tasks[0] ?? 'No task'
    const inspector: InspectorStoryData = {
      id: storyId,
      title: storyTitle,
      status: 'todo',
      slug: storyId,
      notes: '(new) Add story details here.',
      docRefs: [],
    }

    setUiColumns((previous) =>
      previous.map((column) =>
        column.key === activityKey
          ? {
            ...column,
            cards: [
              ...column.cards,
              {
                id: storyId,
                title: storyTitle,
                task: taskTitle,
                meta: 'todo  owner:unassigned',
                inspector,
              },
            ],
            count: String(column.cards.length + 1),
          }
          : column,
      ),
    )

    setUiActivities((previous) =>
      previous.map((activity) => {
        if (activity.key !== activityKey) return activity
        const [doneCount = '0', totalCount = '0'] = activity.count.split('/')
        const nextTotal = Number(totalCount) + 1
        return { ...activity, count: `${doneCount}/${Number.isNaN(nextTotal) ? 1 : nextTotal}` }
      }),
    )
  }

  function onDeleteActivity(activityKey: string): void {
    const activityLabel = uiActivities.find((activity) => activity.key === activityKey)?.label ?? 'this activity'
    if (!confirmDeletion(`Delete ${activityLabel} and all its tasks/stories?`)) return

    setUiActivities((previous) => previous.filter((activity) => activity.key !== activityKey))
    setUiColumns((previous) => previous.filter((column) => column.key !== activityKey))
    setExpandedActivityKeys((previous) => {
      const next = new Set(previous)
      next.delete(activityKey)
      return next
    })

    if (selectedStory) {
      const stillExists = uiColumns
        .filter((column) => column.key !== activityKey)
        .some((column) => column.cards.some((card) => card.id === selectedStory.id))
      if (!stillExists) setSelectedStory(null)
    }
  }

  function onDeleteTask(activityKey: string, taskIndex: number): void {
    const activity = uiActivities.find((candidate) => candidate.key === activityKey)
    const taskLabel = activity?.tasks?.[taskIndex]
    if (!taskLabel) return

    const removedStories =
      uiColumns
        .find((column) => column.key === activityKey)
        ?.cards.filter((card) => card.task === taskLabel) ?? []

    if (!confirmDeletion(`Delete ${taskLabel} and ${removedStories.length} linked stor${removedStories.length === 1 ? 'y' : 'ies'}?`)) return

    setUiActivities((previous) =>
      previous.map((activity) => {
        if (activity.key !== activityKey) return activity
        const nextTasks = [...(activity.tasks ?? [])]
        if (taskIndex >= 0 && taskIndex < nextTasks.length) nextTasks.splice(taskIndex, 1)
        const [doneCount = '0', totalCount = '0'] = activity.count.split('/')
        const numericTotal = Number(totalCount)
        const nextTotal = Number.isNaN(numericTotal) ? 0 : Math.max(0, numericTotal - removedStories.length)
        return { ...activity, tasks: nextTasks, count: `${doneCount}/${nextTotal}` }
      }),
    )

    setUiColumns((previous) =>
      previous.map((column) => {
        if (column.key !== activityKey) return column
        const nextTasks = [...column.tasks]
        if (taskIndex >= 0 && taskIndex < nextTasks.length) nextTasks.splice(taskIndex, 1)
        const nextCards = column.cards.filter((card) => card.task !== taskLabel)
        return {
          ...column,
          tasks: nextTasks.length ? nextTasks : ['No task'],
          cards: nextCards,
          count: String(nextCards.length),
        }
      }),
    )

    if (selectedStory && removedStories.some((story) => story.id === selectedStory.id)) {
      setSelectedStory(null)
    }
  }

  function onDeleteStory(activityKey: string, storyId: string): void {
    const storyTitle = uiColumns
      .find((column) => column.key === activityKey)
      ?.cards.find((card) => card.id === storyId)
      ?.title ?? 'this story'
    if (!confirmDeletion(`Delete ${storyTitle}?`)) return

    setUiColumns((previous) =>
      previous.map((column) => {
        if (column.key !== activityKey) return column
        const nextCards = column.cards.filter((card) => card.id !== storyId)
        return { ...column, cards: nextCards, count: String(nextCards.length) }
      }),
    )

    setUiActivities((previous) =>
      previous.map((activity) => {
        if (activity.key !== activityKey) return activity
        const [doneCount = '0', totalCount = '0'] = activity.count.split('/')
        const numericTotal = Number(totalCount)
        const nextTotal = Number.isNaN(numericTotal) ? 0 : Math.max(0, numericTotal - 1)
        return { ...activity, count: `${doneCount}/${nextTotal}` }
      }),
    )

    if (selectedStory?.id === storyId) setSelectedStory(null)
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

        <OutlinerLanes
          columns={uiColumns}
          onStoryClick={selectStoryById}
          onAddTask={onAddTask}
          onAddStory={onAddStory}
          onDeleteActivity={onDeleteActivity}
          onDeleteStory={onDeleteStory}
        />

        <StoryInspector isOpen={isInspectorOpen} selectedStory={selectedStory} onClose={() => setIsInspectorOpen(false)} />
      </div>
    </div>
  )
}
