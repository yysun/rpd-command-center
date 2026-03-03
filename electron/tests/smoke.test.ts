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
    expect(keys).toEqual(['ping'])
  })
})

describe('core workspace import', () => {
  it('imports parse from core and executes', () => {
    const map = parse('# User Story Map\n\n- A #activity\n')
    expect(map.activities.length).toBe(1)
  })
})

describe('renderer three-panel shell', () => {
  it('renders sidebar, outliner, and inspector landmarks', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('aria-label="Sidebar"')
    expect(html).toContain('aria-label="Outliner"')
    expect(html).toContain('aria-label="Inspector"')
  })

  it('renders visible panel headers for smoke assertions', () => {
    const html = renderToStaticMarkup(React.createElement(App))

    expect(html).toContain('Sidebar')
    expect(html).toContain('Outliner')
    expect(html).toContain('Inspector')
  })
})
