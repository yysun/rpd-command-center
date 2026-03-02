import { describe, it, expect } from 'vitest'
import { parse, serialize } from '../src/index'
import type { StoryMap } from '../src/index'

describe('parse (stub)', () => {
  it('returns a valid StoryMap shape for empty input', () => {
    const result = parse('')
    expect(result).toMatchObject<StoryMap>({
      title: expect.any(String),
      activities: expect.any(Array),
    })
  })

  it('returns empty activities array', () => {
    const result = parse('')
    expect(result.activities).toHaveLength(0)
  })
})

describe('serialize (stub)', () => {
  it('returns a string', () => {
    const map: StoryMap = { title: 'Test', activities: [] }
    expect(typeof serialize(map, 'preserve')).toBe('string')
    expect(typeof serialize(map, 'normalize')).toBe('string')
  })
})
