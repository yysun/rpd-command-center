import type { StoryMap } from 'core'

export function joinPath(basePath: string, filePath: string): string {
  const separator = basePath.includes('\\') ? '\\' : '/'
  const normalizedFilePath = filePath.replace(/[\\/]+/g, separator)
  return basePath.endsWith(separator) ? `${basePath}${normalizedFilePath}` : `${basePath}${separator}${normalizedFilePath}`
}

export function countStories(map: StoryMap | null): number {
  if (!map) return 0
  return map.activities.reduce(
    (activityAcc, activity) => activityAcc + activity.tasks.reduce((taskAcc, task) => taskAcc + task.stories.length, 0),
    0,
  )
}

export function isMatchingWatchEvent(activeAbsoluteFilePath: string | null, eventFilePath: string): boolean {
  return Boolean(activeAbsoluteFilePath && activeAbsoluteFilePath === eventFilePath)
}

export function findStoryMapFile(markdownFiles: string[]): string | null {
  return markdownFiles.find((filePath) => /(^|[\\/])user-story-map\.md$/i.test(filePath)) ?? null
}
