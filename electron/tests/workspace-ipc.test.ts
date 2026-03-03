import { describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'core'
import {
  FileWatchRegistry,
  computeStoryMapSummary,
  filterStoryMap,
  loadStoryMap,
  openWorkspaceFolder,
  registerWorkspaceIpcHandlers,
  saveStoryMap,
  searchStoryMap,
  validateStorySlug,
} from '../workspaceIpc'

async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

describe('workspace IPC logic', () => {
  it('2E-0 openWorkspaceFolder returns markdown candidates recursively', async () => {
    const dir = await makeTempDir('rpd-electron-open-')
    await writeFile(join(dir, 'README.md'), '# Root\n', 'utf8')
    await writeFile(join(dir, 'notes.txt'), 'ignore\n', 'utf8')

    const nestedDir = join(dir, 'docs')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'story.md'), '# Story\n', 'utf8')

    const result = await openWorkspaceFolder(
      {} as never,
      async () => ({ canceled: false, filePaths: [dir] }),
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.workspacePath).toBe(dir)
      expect(result.data.markdownFiles).toEqual(['README.md', 'docs/story.md'].sort((a, b) => a.localeCompare(b)))
    }

    await rm(dir, { recursive: true, force: true })
  })

  it('2E-0b openWorkspaceFolder returns cancellation failure', async () => {
    const result = await openWorkspaceFolder(
      {} as never,
      async () => ({ canceled: true, filePaths: [] }),
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('WORKSPACE_OPEN_CANCELLED')
    }
  })

  it('2E-0c openWorkspaceFolder returns structured error when picker throws', async () => {
    const result = await openWorkspaceFolder(
      {} as never,
      async () => {
        throw new Error('dialog failed')
      },
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('WORKSPACE_OPEN_FAILED')
      expect(result.error.message).toContain('dialog failed')
    }
  })

  it('2E-1 loadStoryMap returns parsed map and metrics', async () => {
    const dir = await makeTempDir('rpd-electron-load-')
    const filePath = join(dir, 'user-story-map.md')

    await writeFile(filePath, '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      status:: doing\n', 'utf8')
    const result = await loadStoryMap({ filePath })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.map.activities.length).toBe(1)
      expect(result.data.metrics.activityMetrics[0].statusCounts.doing).toBe(1)
    }

    await rm(dir, { recursive: true, force: true })
  })

  it('2E-1b loadStoryMap returns structured error for missing file', async () => {
    const result = await loadStoryMap({ filePath: '/tmp/does-not-exist-rpd-command-center.md' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('STORY_MAP_LOAD_FAILED')
    }
  })

  it('2E-2 saveStoryMap writes serialized markdown', async () => {
    const dir = await makeTempDir('rpd-electron-save-')
    const filePath = join(dir, 'user-story-map.md')
    const map = parse('# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n      slug:: s\n')

    const result = await saveStoryMap({ filePath, map, mode: 'normalize', createBackup: false })
    expect(result.ok).toBe(true)
    expect((await readFile(filePath, 'utf8')).includes('slug:: s')).toBe(true)

    await rm(dir, { recursive: true, force: true })
  })

  it('2E-3 search/filter/validate/metrics wrappers return expected data', () => {
    const map = parse(`# User Story Map
\n- A #activity
  - T #task
    - One #story
      status:: todo
      slug:: one
      req:: 2026-03-03/req-one.md
    - Two #story
      status:: done
      slug:: two
`)

    const search = searchStoryMap({ map, query: 'req-one' })
    expect(search.ok).toBe(true)
    if (search.ok) expect(search.data.storyIds).toEqual(['one'])

    const filtered = filterStoryMap({ map, filters: { statuses: ['done'] } })
    expect(filtered.ok).toBe(true)
    if (filtered.ok) expect(filtered.data.storyIds).toEqual(['two'])

    const slug = validateStorySlug({ map, validation: { slug: 'one' } })
    expect(slug.ok).toBe(true)
    if (slug.ok) expect(slug.data.isUnique).toBe(false)

    const metrics = computeStoryMapSummary({ map })
    expect(metrics.ok).toBe(true)
    if (metrics.ok) expect(metrics.data.activityMetrics[0].storyCount).toBe(2)
  })
})

describe('file watch registry', () => {
  it('2E-4 coalesces rapid events to one callback and supports replace/stop', async () => {
    const dir = await makeTempDir('rpd-electron-watch-')
    const filePath = join(dir, 'map.md')
    await writeFile(filePath, '# User Story Map\n', 'utf8')

    const events: string[] = []
    const registry = new FileWatchRegistry(120)

    registry.replace(
      42,
      filePath,
      (changedPath) => events.push(changedPath),
      (_error) => {
        // No-op for test; failures would surface as missing expected behavior.
      },
    )

    await writeFile(filePath, '# User Story Map\n\n- A #activity\n', 'utf8')
    await writeFile(filePath, '# User Story Map\n\n- A #activity\n  - T #task\n', 'utf8')

    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(events.length).toBe(1)

    registry.stop(42)
    await writeFile(filePath, '# User Story Map\n\n- A #activity\n  - T #task\n    - S #story\n', 'utf8')
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(events.length).toBe(1)

    registry.stopAll()
    await rm(dir, { recursive: true, force: true })
  })
})

describe('workspace IPC registration error handling', () => {
  it('2E-5b returns structured error when watcher startup throws', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>()
    const ipcMainMock = {
      handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler)
      },
      removeHandler: (channel: string) => {
        handlers.delete(channel)
      },
    }

    const throwingRegistry = {
      replace: () => {
        throw new Error('boom')
      },
      stop: (_windowId: number) => { },
      stopAll: () => { },
    } as unknown as FileWatchRegistry

    const win = {
      id: 1,
      webContents: {
        send: () => { },
      },
    }

    registerWorkspaceIpcHandlers(ipcMainMock as never, throwingRegistry, {
      showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
      fromWebContents: () => win as never,
    })

    const startWatchHandler = handlers.get('storyMap:watch:start')
    expect(startWatchHandler).toBeTruthy()

    const result = await (startWatchHandler as (...args: unknown[]) => Promise<unknown> | unknown)(
      {
        sender: {
          once: () => { },
        },
      },
      { filePath: '/tmp/missing.md' },
    )

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'STORY_MAP_WATCH_START_FAILED',
      },
    })
  })
})
