import type { Activity, Status, Story, StoryMap, Task } from '../types/model'

export type DocCoverageFilter = 'none' | 'has-req' | 'has-plan' | 'has-done'

export interface SearchStoriesInput {
  query: string
}

export interface SearchStoriesResult {
  storyIds: string[]
}

export interface FilterStoriesInput {
  query?: string
  statuses?: Status[]
  docCoverage?: DocCoverageFilter
  unfinishedTasksOnly?: boolean
}

export interface FilterStoriesResult {
  storyIds: string[]
}

export interface SlugValidationInput {
  slug: string
  excludeStoryId?: string
}

export interface SlugValidationResult {
  slug: string
  isValidFormat: boolean
  isUnique: boolean
  conflictingStoryIds: string[]
}

export interface StatusCounts {
  todo: number
  doing: number
  done: number
}

export interface CoverageCounts {
  withDocs: number
  withoutDocs: number
}

export interface NodeMetrics {
  nodeId: string
  storyCount: number
  statusCounts: StatusCounts
  percentDone: number
  coverage: CoverageCounts
}

export interface StoryMapMetrics {
  activityMetrics: NodeMetrics[]
  taskMetrics: NodeMetrics[]
}

interface StoryRef {
  activity: Activity
  task: Task
  story: Story
}

function flattenStories(map: StoryMap): StoryRef[] {
  const refs: StoryRef[] = []

  for (const activity of map.activities) {
    for (const task of activity.tasks) {
      for (const story of task.stories) {
        refs.push({ activity, task, story })
      }
    }
  }

  return refs
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function containsQuery(story: Story, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true

  const docFileNames = story.docRefs.map((doc) => doc.filename).join(' ')
  const haystack = [story.title, story.slug, story.notes, docFileNames].join('\n').toLowerCase()
  return haystack.includes(normalizedQuery)
}

function toUniqueStatuses(statuses?: Status[]): Set<Status> {
  return new Set((statuses || []).filter((status): status is Status => status === 'todo' || status === 'doing' || status === 'done'))
}

function matchesDocCoverage(story: Story, coverage?: DocCoverageFilter): boolean {
  if (!coverage) return true

  if (coverage === 'none') return story.docRefs.length === 0
  if (coverage === 'has-req') return story.docRefs.some((doc) => doc.type === 'REQ')
  if (coverage === 'has-plan') return story.docRefs.some((doc) => doc.type === 'PLAN')
  if (coverage === 'has-done') return story.docRefs.some((doc) => doc.type === 'DONE')

  return true
}

function taskHasUnfinishedStory(task: Task): boolean {
  return task.stories.some((story) => story.status !== 'done')
}

function emptyStatusCounts(): StatusCounts {
  return { todo: 0, doing: 0, done: 0 }
}

function deriveStatusCounts(stories: Story[]): StatusCounts {
  const counts = emptyStatusCounts()

  for (const story of stories) {
    if (story.status === 'todo') counts.todo += 1
    if (story.status === 'doing') counts.doing += 1
    if (story.status === 'done') counts.done += 1
  }

  return counts
}

function deriveCoverage(stories: Story[]): CoverageCounts {
  let withDocs = 0

  for (const story of stories) {
    if (story.docRefs.length > 0) withDocs += 1
  }

  return {
    withDocs,
    withoutDocs: stories.length - withDocs,
  }
}

function percentDone(stories: Story[], counts: StatusCounts): number {
  if (stories.length === 0) return 0
  return Math.round((counts.done / stories.length) * 100)
}

export function searchStories(map: StoryMap, input: SearchStoriesInput): SearchStoriesResult {
  const normalized = normalizeQuery(input.query)
  const storyIds = flattenStories(map)
    .filter(({ story }) => containsQuery(story, normalized))
    .map(({ story }) => story.id)

  return { storyIds }
}

export function filterStories(map: StoryMap, input: FilterStoriesInput = {}): FilterStoriesResult {
  const normalized = normalizeQuery(input.query || '')
  const selectedStatuses = toUniqueStatuses(input.statuses)

  const storyIds = flattenStories(map)
    .filter(({ task, story }) => {
      if (input.unfinishedTasksOnly && !taskHasUnfinishedStory(task)) return false
      if (selectedStatuses.size > 0 && !selectedStatuses.has(story.status)) return false
      if (!matchesDocCoverage(story, input.docCoverage)) return false
      if (!containsQuery(story, normalized)) return false
      return true
    })
    .map(({ story }) => story.id)

  return { storyIds }
}

export function validateSlug(map: StoryMap, input: SlugValidationInput): SlugValidationResult {
  const slug = input.slug.trim()
  const isValidFormat = /^[a-z0-9-]+$/.test(slug)

  const conflictingStoryIds = flattenStories(map)
    .filter(({ story }) => story.id !== input.excludeStoryId)
    .filter(({ story }) => story.slug === slug)
    .map(({ story }) => story.id)

  return {
    slug,
    isValidFormat,
    isUnique: conflictingStoryIds.length === 0,
    conflictingStoryIds,
  }
}

export function computeStoryMapMetrics(map: StoryMap): StoryMapMetrics {
  const activityMetrics: NodeMetrics[] = []
  const taskMetrics: NodeMetrics[] = []

  for (const activity of map.activities) {
    const activityStories = activity.tasks.flatMap((task) => task.stories)
    const activityStatusCounts = deriveStatusCounts(activityStories)
    activityMetrics.push({
      nodeId: activity.id,
      storyCount: activityStories.length,
      statusCounts: activityStatusCounts,
      percentDone: percentDone(activityStories, activityStatusCounts),
      coverage: deriveCoverage(activityStories),
    })

    for (const task of activity.tasks) {
      const taskStatusCounts = deriveStatusCounts(task.stories)
      taskMetrics.push({
        nodeId: task.id,
        storyCount: task.stories.length,
        statusCounts: taskStatusCounts,
        percentDone: percentDone(task.stories, taskStatusCounts),
        coverage: deriveCoverage(task.stories),
      })
    }
  }

  return { activityMetrics, taskMetrics }
}
