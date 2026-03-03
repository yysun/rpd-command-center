import { describe, expect, it } from 'vitest'
import { parse } from 'core'
import { countStories, findStoryMapFile, isMatchingWatchEvent, joinPath } from '../renderer/src/appShell'

describe('app shell helpers', () => {
  it('joinPath uses POSIX separators when base path is POSIX', () => {
    expect(joinPath('/tmp/workspace', 'docs/story-map.md')).toBe('/tmp/workspace/docs/story-map.md')
    expect(joinPath('/tmp/workspace/', 'docs/story-map.md')).toBe('/tmp/workspace/docs/story-map.md')
  })

  it('joinPath uses Windows separators when base path is Windows style', () => {
    expect(joinPath('C:\\workspace', 'docs/story-map.md')).toBe('C:\\workspace\\docs\\story-map.md')
    expect(joinPath('C:\\workspace\\', 'docs/story-map.md')).toBe('C:\\workspace\\docs\\story-map.md')
  })

  it('countStories returns 0 for null map', () => {
    expect(countStories(null)).toBe(0)
  })

  it('countStories returns nested story total', () => {
    const map = parse(`# User Story Map

- Build App #activity
  - Shell #task
    - Open workspace #story
    - Load map #story
  - Watch #task
    - External change #story
`)

    expect(countStories(map)).toBe(3)
  })

  it('matches watch events only for the active absolute file path', () => {
    expect(isMatchingWatchEvent('/a/b/map.md', '/a/b/map.md')).toBe(true)
    expect(isMatchingWatchEvent('/a/b/map.md', '/a/b/other.md')).toBe(false)
    expect(isMatchingWatchEvent(null, '/a/b/map.md')).toBe(false)
  })

  it('finds user-story-map.md at root or nested paths', () => {
    expect(findStoryMapFile(['README.md', 'user-story-map.md'])).toBe('user-story-map.md')
    expect(findStoryMapFile(['docs/notes.md', 'docs/user-story-map.md'])).toBe('docs/user-story-map.md')
  })

  it('finds user-story-map.md case-insensitively and returns null when missing', () => {
    expect(findStoryMapFile(['docs/User-Story-Map.md'])).toBe('docs/User-Story-Map.md')
    expect(findStoryMapFile(['docs/roadmap.md', 'README.md'])).toBeNull()
  })
})
