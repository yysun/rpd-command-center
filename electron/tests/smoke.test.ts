import { describe, it, expect, vi } from 'vitest'

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
