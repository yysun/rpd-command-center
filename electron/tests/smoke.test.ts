import { describe, it, expect, vi } from 'vitest'
import { parse } from 'core'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import App from '../renderer/src/App'

// Mock the electron preload environment
const mockInvoke = vi.fn(async (channel: string) => {
  if (channel === 'ping') return 'pong'
  throw new Error(`Unknown channel: ${channel}`)
})

// Simulate what contextBridge would expose
const api = {
  ping: () => mockInvoke('ping'),
  openWorkspace: async () => ({ ok: true as const, data: { workspacePath: '/tmp/demo', markdownFiles: ['user-story-map.md'] } }),
  loadStoryMap: async () => ({ ok: true as const, data: { filePath: '/tmp/demo/user-story-map.md', map: parse('# User Story Map'), metrics: { activityMetrics: [], taskMetrics: [] } } }),
  saveStoryMap: async () => ({ ok: true as const, data: { filePath: '/tmp/demo/user-story-map.md', bytesWritten: 0 } }),
  searchStories: async () => ({ ok: true as const, data: { storyIds: [] } }),
  filterStories: async () => ({ ok: true as const, data: { storyIds: [] } }),
  validateSlug: async () => ({ ok: true as const, data: { slug: 'demo', isValidFormat: true, isUnique: true, conflictingStoryIds: [] } }),
  computeMetrics: async () => ({ ok: true as const, data: { activityMetrics: [], taskMetrics: [] } }),
  startWatchStoryMap: async () => ({ ok: true as const, data: { filePath: '/tmp/demo/user-story-map.md' } }),
  stopWatchStoryMap: async () => ({ ok: true as const, data: { stopped: true } }),
  onExternalStoryMapChanged: () => () => undefined,
  onStoryMapWatchError: () => () => undefined,
}

describe('window.api shape', () => {
  it('exposes a ping function', () => {
    expect(typeof api.ping).toBe('function')
  })

  it('ping resolves to "pong"', async () => {
    const result = await api.ping()
    expect(result).toBe('pong')
  })

  it('only exposes expected keys (no raw ipcRenderer)', () => {
    const keys = Object.keys(api)
    expect(keys).toEqual([
      'ping',
      'openWorkspace',
      'loadStoryMap',
      'saveStoryMap',
      'searchStories',
      'filterStories',
      'validateSlug',
      'computeMetrics',
      'startWatchStoryMap',
      'stopWatchStoryMap',
      'onExternalStoryMapChanged',
      'onStoryMapWatchError',
    ])
  })
})

describe('core workspace import', () => {
  it('imports parse from core and executes', () => {
    const map = parse('# User Story Map\n\n- A #activity\n')
    expect(map.activities.length).toBe(1)
  })
})

describe('renderer three-panel shell', () => {
  it('renders sidebar, board, and inspector landmarks', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('aria-label="Sidebar"')
    expect(html).toContain('aria-label="Board"')
    expect(html).toContain('aria-label="Inspector"')
  })

  it('renders view toggles for board, map, and outline', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('Board')
    expect(html).toContain('Map')
    expect(html).toContain('Outline')
    expect(html).not.toContain('Timeline')
  })

  it('renders visible panel headers for smoke assertions', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('Story Map')
    expect(html).toContain('Open Project...')
    expect(html).toContain('Story Details')
  })

  it('renders inspector hidden by default with close control', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('data-visibility="hidden"')
    expect(html).toContain('aria-label="Close story details"')
  })

  it('renders drag/no-drag markers in top bar and inspector controls', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('drag-region')
    expect(html).toContain('no-drag')
  })

  it('renders mode-driven system settings panel scaffold', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('aria-label="System Settings Panel"')
    expect(html).toContain('data-mode="none"')
    expect(html).toContain('data-left-panel-mode="none"')
    expect(html).toContain('System Settings')
  })

  it('renders restored mock-ui markers for activities sidebar and board lanes', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('project-context')
    expect(html).toContain('ACTIVITIES')
    expect(html).toContain('World Management')
    expect(html).toContain('Agent Authoring')
  })

  it('renders compact add menus and delete controls across levels', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('aria-label="Add activity"')
    expect(html).toContain('aria-label="Open actions for World Management"')
    expect(html).toContain('aria-label="Add task in World Management"')
    expect(html).toContain('aria-label="Add story under Create &amp; configure world"')
    expect(html).toContain('aria-label="Add story under Import / export world"')
    expect(html).toContain('aria-label="Delete activity World Management"')
    expect(html).toContain('aria-label="Delete story Create new world from scratch"')
  })

  it('keeps Map as a separate mode and does not render map lanes in default Board mode', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('Map')
    expect(html).not.toContain('Release Slice')
    expect(html).not.toContain('Backbone')
  })
})
