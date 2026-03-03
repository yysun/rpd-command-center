import { contextBridge, ipcRenderer } from 'electron'
import type { FilterStoriesInput, FormatMode, SlugValidationInput, StoryMap } from 'core'
import { IPC_CHANNELS, IPC_EVENTS } from './workspaceIpc'

contextBridge.exposeInMainWorld('api', {
  ping: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.ping),
  openWorkspace: () => ipcRenderer.invoke(IPC_CHANNELS.openWorkspace),
  loadStoryMap: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.loadStoryMap, { filePath }),
  saveStoryMap: (filePath: string, map: StoryMap, mode: FormatMode, createBackup = true) =>
    ipcRenderer.invoke(IPC_CHANNELS.saveStoryMap, { filePath, map, mode, createBackup }),
  searchStories: (map: StoryMap, query: string) => ipcRenderer.invoke(IPC_CHANNELS.searchStories, { map, query }),
  filterStories: (map: StoryMap, filters: FilterStoriesInput) => ipcRenderer.invoke(IPC_CHANNELS.filterStories, { map, filters }),
  validateSlug: (map: StoryMap, validation: SlugValidationInput) =>
    ipcRenderer.invoke(IPC_CHANNELS.validateSlug, { map, validation }),
  computeMetrics: (map: StoryMap) => ipcRenderer.invoke(IPC_CHANNELS.computeMetrics, { map }),
  startWatchStoryMap: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.startWatchStoryMap, { filePath }),
  stopWatchStoryMap: () => ipcRenderer.invoke(IPC_CHANNELS.stopWatchStoryMap),
  onExternalStoryMapChanged: (listener: (payload: { filePath: string }) => void) => {
    const handler = (_event: unknown, payload: { filePath: string }) => listener(payload)
    ipcRenderer.on(IPC_EVENTS.externalChanged, handler)
    return () => ipcRenderer.off(IPC_EVENTS.externalChanged, handler)
  },
  onStoryMapWatchError: (listener: (payload: { filePath: string; message: string }) => void) => {
    const handler = (_event: unknown, payload: { filePath: string; message: string }) => listener(payload)
    ipcRenderer.on(IPC_EVENTS.watchError, handler)
    return () => ipcRenderer.off(IPC_EVENTS.watchError, handler)
  },
})
