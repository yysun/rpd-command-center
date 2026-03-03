import type {
  FilterStoriesInput,
  FilterStoriesResult,
  FormatMode,
  SearchStoriesResult,
  SlugValidationInput,
  SlugValidationResult,
  StoryMap,
  StoryMapMetrics,
} from 'core'

type IpcError = {
  code: string
  message: string
}

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError }

interface Window {
  api: {
    ping: () => Promise<string>
    openWorkspace: () => Promise<IpcResult<{ workspacePath: string; markdownFiles: string[] }>>
    loadStoryMap: (filePath: string) => Promise<IpcResult<{ filePath: string; map: StoryMap; metrics: StoryMapMetrics }>>
    saveStoryMap: (
      filePath: string,
      map: StoryMap,
      mode: FormatMode,
      createBackup?: boolean,
    ) => Promise<IpcResult<{ filePath: string; bytesWritten: number }>>
    searchStories: (map: StoryMap, query: string) => Promise<IpcResult<SearchStoriesResult>>
    filterStories: (map: StoryMap, filters: FilterStoriesInput) => Promise<IpcResult<FilterStoriesResult>>
    validateSlug: (map: StoryMap, validation: SlugValidationInput) => Promise<IpcResult<SlugValidationResult>>
    computeMetrics: (map: StoryMap) => Promise<IpcResult<StoryMapMetrics>>
    startWatchStoryMap: (filePath: string) => Promise<IpcResult<{ filePath: string }>>
    stopWatchStoryMap: () => Promise<IpcResult<{ stopped: boolean }>>
    onExternalStoryMapChanged: (listener: (payload: { filePath: string }) => void) => () => void
    onStoryMapWatchError: (listener: (payload: { filePath: string; message: string }) => void) => () => void
  }
}
