// Public API surface for the core library
export type { Status, DocRefType, FormatMode, DocRef, Story, Task, Activity, StoryMap } from './types/model'
export { parse } from './parser/parse'
export { serialize } from './writer/serialize'
export { atomicWrite } from './io/atomicWrite'
export { writeWithBackup } from './io/writeWithBackup'
export type {
  DocCoverageFilter,
  SearchStoriesInput,
  SearchStoriesResult,
  FilterStoriesInput,
  FilterStoriesResult,
  SlugValidationInput,
  SlugValidationResult,
  StatusCounts,
  CoverageCounts,
  NodeMetrics,
  StoryMapMetrics,
} from './workspace/index'
export { searchStories, filterStories, validateSlug, computeStoryMapMetrics } from './workspace/index'
