import { atomicWrite, computeStoryMapMetrics, filterStories, parse, searchStories, serialize, validateSlug, writeWithBackup } from 'core'
import type {
  FilterStoriesInput,
  FilterStoriesResult,
  FormatMode,
  SearchStoriesInput,
  SearchStoriesResult,
  SlugValidationInput,
  SlugValidationResult,
  StoryMap,
  StoryMapMetrics,
} from 'core'
import type { BrowserWindow, IpcMain, IpcMainInvokeEvent, OpenDialogOptions } from 'electron'
import { watch, type FSWatcher } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

export const IPC_CHANNELS = {
  ping: 'ping',
  openWorkspace: 'workspace:open',
  loadStoryMap: 'storyMap:load',
  saveStoryMap: 'storyMap:save',
  searchStories: 'storyMap:search',
  filterStories: 'storyMap:filter',
  validateSlug: 'storyMap:validateSlug',
  computeMetrics: 'storyMap:metrics',
  startWatchStoryMap: 'storyMap:watch:start',
  stopWatchStoryMap: 'storyMap:watch:stop',
} as const

export const IPC_EVENTS = {
  externalChanged: 'storyMap:externalChanged',
  watchError: 'storyMap:watchError',
} as const

export interface IpcError {
  code: string
  message: string
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

export interface OpenWorkspaceResult {
  workspacePath: string
  markdownFiles: string[]
}

export interface ElectronAdapters {
  showOpenDialog: (window: BrowserWindow, options: OpenDialogOptions) => Promise<{ canceled: boolean; filePaths: string[] }>
  fromWebContents: (sender: IpcMainInvokeEvent['sender']) => BrowserWindow | null
}

export interface LoadStoryMapInput {
  filePath: string
}

export interface LoadStoryMapResult {
  filePath: string
  map: StoryMap
  metrics: StoryMapMetrics
}

export interface SaveStoryMapInput {
  filePath: string
  map: StoryMap
  mode: FormatMode
  createBackup?: boolean
}

export interface SaveStoryMapResult {
  filePath: string
  bytesWritten: number
}

export interface StartWatchStoryMapInput {
  filePath: string
}

export interface StopWatchStoryMapInput {
  filePath?: string
}

export interface SearchStoriesIpcInput {
  map: StoryMap
  query: string
}

export interface FilterStoriesIpcInput {
  map: StoryMap
  filters: FilterStoriesInput
}

export interface ValidateSlugIpcInput {
  map: StoryMap
  validation: SlugValidationInput
}

export interface ComputeMetricsIpcInput {
  map: StoryMap
}

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

function toFailure(error: unknown, fallbackCode: string, fallbackMessage: string): IpcResult<never> {
  if (error instanceof Error) {
    return failure(fallbackCode, error.message || fallbackMessage)
  }
  return failure(fallbackCode, fallbackMessage)
}

async function collectMarkdownFiles(rootPath: string): Promise<string[]> {
  const found: string[] = []

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue

      const fullPath = join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        found.push(relative(rootPath, fullPath) || entry.name)
      }
    }
  }

  await walk(rootPath)
  found.sort((a, b) => a.localeCompare(b))
  return found
}

export async function openWorkspaceFolder(
  mainWindow: BrowserWindow,
  showOpenDialog: ElectronAdapters['showOpenDialog'],
): Promise<IpcResult<OpenWorkspaceResult>> {
  try {
    const picked = await showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Open Workspace Folder',
    })

    if (picked.canceled || picked.filePaths.length === 0) {
      return failure('WORKSPACE_OPEN_CANCELLED', 'No workspace folder selected')
    }

    const workspacePath = picked.filePaths[0]
    const markdownFiles = await collectMarkdownFiles(workspacePath)

    return ok({ workspacePath, markdownFiles })
  } catch (error) {
    return toFailure(error, 'WORKSPACE_OPEN_FAILED', 'Failed to open workspace folder')
  }
}

export async function loadStoryMap(input: LoadStoryMapInput): Promise<IpcResult<LoadStoryMapResult>> {
  try {
    const fileStats = await stat(input.filePath)
    if (!fileStats.isFile()) return failure('STORY_MAP_NOT_FILE', 'Selected path is not a file')

    const markdown = await readFile(input.filePath, 'utf8')
    const map = parse(markdown)
    const metrics = computeStoryMapMetrics(map)

    return ok({ filePath: input.filePath, map, metrics })
  } catch (error) {
    return toFailure(error, 'STORY_MAP_LOAD_FAILED', 'Failed to load story map file')
  }
}

export async function saveStoryMap(input: SaveStoryMapInput): Promise<IpcResult<SaveStoryMapResult>> {
  try {
    const content = serialize(input.map, input.mode)
    if (input.createBackup === false) {
      await atomicWrite(input.filePath, content)
    } else {
      await writeWithBackup(input.filePath, content)
    }

    return ok({ filePath: input.filePath, bytesWritten: Buffer.byteLength(content, 'utf8') })
  } catch (error) {
    return toFailure(error, 'STORY_MAP_SAVE_FAILED', 'Failed to save story map file')
  }
}

export function searchStoryMap(input: SearchStoriesIpcInput): IpcResult<SearchStoriesResult> {
  try {
    const searchInput: SearchStoriesInput = { query: input.query }
    return ok(searchStories(input.map, searchInput))
  } catch (error) {
    return toFailure(error, 'STORY_MAP_SEARCH_FAILED', 'Failed to search story map')
  }
}

export function filterStoryMap(input: FilterStoriesIpcInput): IpcResult<FilterStoriesResult> {
  try {
    return ok(filterStories(input.map, input.filters))
  } catch (error) {
    return toFailure(error, 'STORY_MAP_FILTER_FAILED', 'Failed to filter story map')
  }
}

export function validateStorySlug(input: ValidateSlugIpcInput): IpcResult<SlugValidationResult> {
  try {
    return ok(validateSlug(input.map, input.validation))
  } catch (error) {
    return toFailure(error, 'STORY_MAP_SLUG_VALIDATION_FAILED', 'Failed to validate slug')
  }
}

export function computeStoryMapSummary(input: ComputeMetricsIpcInput): IpcResult<StoryMapMetrics> {
  try {
    return ok(computeStoryMapMetrics(input.map))
  } catch (error) {
    return toFailure(error, 'STORY_MAP_METRICS_FAILED', 'Failed to compute story map metrics')
  }
}

interface WatchContext {
  watcher: FSWatcher
  timer: NodeJS.Timeout | null
  filePath: string
}

export class FileWatchRegistry {
  private readonly byWindowId = new Map<number, WatchContext>()

  constructor(private readonly debounceMs = 200) { }

  replace(windowId: number, filePath: string, onChange: (filePath: string) => void, onError: (error: Error) => void): void {
    this.stop(windowId)

    const watcher = watch(filePath, () => {
      const existing = this.byWindowId.get(windowId)
      if (!existing) return

      if (existing.timer) clearTimeout(existing.timer)
      existing.timer = setTimeout(() => {
        onChange(existing.filePath)
      }, this.debounceMs)
    })

    watcher.on('error', (error) => {
      onError(error)
    })

    this.byWindowId.set(windowId, {
      watcher,
      timer: null,
      filePath,
    })
  }

  stop(windowId: number): void {
    const existing = this.byWindowId.get(windowId)
    if (!existing) return

    if (existing.timer) clearTimeout(existing.timer)
    existing.watcher.close()
    this.byWindowId.delete(windowId)
  }

  stopAll(): void {
    for (const windowId of this.byWindowId.keys()) {
      this.stop(windowId)
    }
  }
}

export interface WorkspaceIpcRegistration {
  dispose: () => void
}

function senderWindow(event: IpcMainInvokeEvent, adapters: ElectronAdapters): BrowserWindow | null {
  return adapters.fromWebContents(event.sender)
}

export function registerWorkspaceIpcHandlers(
  ipcMain: IpcMain,
  registry: FileWatchRegistry,
  adapters: ElectronAdapters,
): WorkspaceIpcRegistration {

  ipcMain.handle(IPC_CHANNELS.ping, () => 'pong')

  ipcMain.handle(IPC_CHANNELS.openWorkspace, async (event: IpcMainInvokeEvent) => {
    const win = senderWindow(event, adapters)
    if (!win) return failure('WINDOW_NOT_FOUND', 'No active window for workspace picker')
    return openWorkspaceFolder(win, adapters.showOpenDialog)
  })

  ipcMain.handle(IPC_CHANNELS.loadStoryMap, (_event: IpcMainInvokeEvent, input: LoadStoryMapInput) => loadStoryMap(input))

  ipcMain.handle(IPC_CHANNELS.saveStoryMap, (_event: IpcMainInvokeEvent, input: SaveStoryMapInput) => saveStoryMap(input))

  ipcMain.handle(IPC_CHANNELS.searchStories, (_event: IpcMainInvokeEvent, input: SearchStoriesIpcInput) => searchStoryMap(input))

  ipcMain.handle(IPC_CHANNELS.filterStories, (_event: IpcMainInvokeEvent, input: FilterStoriesIpcInput) => filterStoryMap(input))

  ipcMain.handle(IPC_CHANNELS.validateSlug, (_event: IpcMainInvokeEvent, input: ValidateSlugIpcInput) => validateStorySlug(input))

  ipcMain.handle(IPC_CHANNELS.computeMetrics, (_event: IpcMainInvokeEvent, input: ComputeMetricsIpcInput) => computeStoryMapSummary(input))

  ipcMain.handle(IPC_CHANNELS.startWatchStoryMap, (event: IpcMainInvokeEvent, input: StartWatchStoryMapInput) => {
    const win = senderWindow(event, adapters)
    if (!win) return failure('WINDOW_NOT_FOUND', 'No active window for file watcher')

    try {
      event.sender.once('destroyed', () => {
        registry.stop(win.id)
      })

      registry.replace(
        win.id,
        input.filePath,
        (filePath) => {
          win.webContents.send(IPC_EVENTS.externalChanged, { filePath })
        },
        (error) => {
          win.webContents.send(IPC_EVENTS.watchError, {
            filePath: input.filePath,
            message: error.message,
          })
        },
      )
    } catch (error) {
      return toFailure(error, 'STORY_MAP_WATCH_START_FAILED', 'Failed to start story map watcher')
    }

    return ok({ filePath: input.filePath })
  })

  ipcMain.handle(IPC_CHANNELS.stopWatchStoryMap, (event: IpcMainInvokeEvent, _input?: StopWatchStoryMapInput) => {
    const win = senderWindow(event, adapters)
    if (!win) return failure('WINDOW_NOT_FOUND', 'No active window for file watcher')

    registry.stop(win.id)
    return ok({ stopped: true })
  })

  return {
    dispose: () => {
      registry.stopAll()
      ipcMain.removeHandler(IPC_CHANNELS.ping)
      ipcMain.removeHandler(IPC_CHANNELS.openWorkspace)
      ipcMain.removeHandler(IPC_CHANNELS.loadStoryMap)
      ipcMain.removeHandler(IPC_CHANNELS.saveStoryMap)
      ipcMain.removeHandler(IPC_CHANNELS.searchStories)
      ipcMain.removeHandler(IPC_CHANNELS.filterStories)
      ipcMain.removeHandler(IPC_CHANNELS.validateSlug)
      ipcMain.removeHandler(IPC_CHANNELS.computeMetrics)
      ipcMain.removeHandler(IPC_CHANNELS.startWatchStoryMap)
      ipcMain.removeHandler(IPC_CHANNELS.stopWatchStoryMap)
    },
  }
}
