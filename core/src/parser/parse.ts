import type { Activity, DocRef, DocRefType, Story, StoryMap, Task } from '../types/model'

type StoryForm = 'A' | 'B'

interface StoryMeta {
  storyLine: string
  propLines: string[]
  form: StoryForm
  hadIdProperty: boolean
  original: Pick<Story, 'id' | 'status' | 'slug' | 'notes' | 'unknownProps'> & { docRefs: DocRef[] }
}

interface ParseMeta {
  storyMetaById: Record<string, StoryMeta>
}

const PARSE_META_KEY = Symbol.for('rpd.core.parseMeta')

function stripTag(text: string, tag: string): string {
  return text.replace(new RegExp(`\\s*${tag}\\b`), '').trim()
}

function listItem(line: string): { indent: number; text: string } | null {
  const m = line.match(/^(\s*)-\s+(.*)$/)
  if (!m) return null
  return { indent: m[1].length, text: m[2] }
}

function inferDepth(indent: number): number {
  if (indent < 2) return 0
  if (indent < 4) return 1
  return 2
}

function parseFormADocRef(key: string, value: string, order: number): DocRef | null {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})\/(.+)$/)
  if (!m) return null
  const type = key.toUpperCase() as DocRefType
  return {
    id: `${type.toLowerCase()}-${order}`,
    type,
    date: m[1],
    filename: m[2],
  }
}

function inferDocRefType(filename: string): DocRefType {
  if (filename.startsWith('req-')) return 'REQ'
  if (filename.startsWith('plan-')) return 'PLAN'
  if (filename.startsWith('done-')) return 'DONE'
  return 'DONE'
}

function cloneDocRefs(docRefs: DocRef[]): DocRef[] {
  return docRefs.map((d) => ({ ...d }))
}

function makeStoryId(slug: string, used: Set<string>, counter: { value: number }): string {
  if (slug && !used.has(slug)) {
    used.add(slug)
    return slug
  }

  const base = slug || 'story'
  let candidate = `${base}-${counter.value.toString(36)}`
  while (used.has(candidate)) {
    counter.value += 1
    candidate = `${base}-${counter.value.toString(36)}`
  }
  used.add(candidate)
  counter.value += 1
  return candidate
}

function attachParseMeta(map: StoryMap, meta: ParseMeta): void {
  Object.defineProperty(map, PARSE_META_KEY, {
    value: meta,
    enumerable: false,
    configurable: false,
    writable: false,
  })
}

export function getParseMeta(map: StoryMap): ParseMeta | undefined {
  return (map as unknown as Record<symbol, ParseMeta | undefined>)[PARSE_META_KEY]
}

export function parse(markdown: string): StoryMap {
  const raw = markdown || ''
  if (!raw.trim()) {
    const empty = { title: 'User Story Map', activities: [] as Activity[] }
    attachParseMeta(empty, { storyMetaById: {} })
    return empty
  }

  const lines = raw.split(/\r?\n/)
  const heading = lines.find((line) => /^#\s+/.test(line))
  const map: StoryMap = {
    title: heading ? heading.replace(/^#\s+/, '').trim() : 'User Story Map',
    activities: [],
  }

  const meta: ParseMeta = { storyMetaById: {} }
  const usedStoryIds = new Set<string>()
  const idCounter = { value: 1 }
  const storyToMeta = new Map<Story, StoryMeta>()

  let currentActivity: Activity | null = null
  let currentTask: Task | null = null
  let currentStory: Story | null = null
  let currentStoryMeta: StoryMeta | null = null

  for (const line of lines) {
    const item = listItem(line)
    if (item) {
      const depth = inferDepth(item.indent)
      const text = item.text

      // Treat deep nested list items beneath a story as story-property lines.
      if (depth >= 2 && currentStory && item.indent >= 6) {
        const docRefMatch = text.match(/^(\d{4}-\d{2}-\d{2})\s+→\s+(.+)$/)
        if (docRefMatch) {
          const filename = docRefMatch[2].trim()
          currentStory.docRefs.push({
            id: `legacy-${currentStory.docRefs.length}`,
            type: inferDocRefType(filename),
            date: docRefMatch[1],
            filename,
          })
          if (currentStoryMeta) {
            currentStoryMeta.propLines.push(line)
            currentStoryMeta.form = 'B'
          }
          continue
        }
        currentStory.unknownProps.push(line.trim())
        currentStoryMeta?.propLines.push(line)
        continue
      }

      if (text.includes('#activity') || depth === 0) {
        const title = stripTag(text, '#activity')
        currentActivity = {
          id: `activity-${map.activities.length}`,
          title,
          rawLine: line,
          order: map.activities.length,
          tasks: [],
        }
        map.activities.push(currentActivity)
        currentTask = null
        currentStory = null
        currentStoryMeta = null
        continue
      }

      if ((text.includes('#task') || depth === 1) && currentActivity) {
        const title = stripTag(text, '#task')
        currentTask = {
          id: `task-${currentActivity.id}-${currentActivity.tasks.length}`,
          activityId: currentActivity.id,
          title,
          rawLine: line,
          order: currentActivity.tasks.length,
          stories: [],
        }
        currentActivity.tasks.push(currentTask)
        currentStory = null
        currentStoryMeta = null
        continue
      }

      if ((text.includes('#story') || depth >= 2) && currentTask) {
        const title = stripTag(text, '#story')
        const story: Story = {
          id: '',
          taskId: currentTask.id,
          title,
          status: 'todo',
          slug: '',
          notes: '',
          unknownProps: [],
          order: currentTask.stories.length,
          updatedAt: Date.now(),
          docRefs: [],
        }
        currentTask.stories.push(story)
        currentStory = story
        currentStoryMeta = {
          storyLine: line,
          propLines: [],
          form: 'A',
          hadIdProperty: false,
          original: {
            id: '',
            status: story.status,
            slug: story.slug,
            notes: story.notes,
            unknownProps: [],
            docRefs: [],
          },
        }
        storyToMeta.set(story, currentStoryMeta)
        continue
      }
    }

    // Story-property lines: support both Form A and Form B.
    if (currentStory && /^\s+/.test(line)) {
      const trimmed = line.trim()
      const propA = trimmed.match(/^([a-zA-Z0-9_-]+)::\s*(.*)$/)
      const propB = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)

      if (propA) {
        const key = propA[1].toLowerCase()
        const value = propA[2]
        if (currentStoryMeta) {
          currentStoryMeta.propLines.push(line)
          currentStoryMeta.form = 'A'
        }

        if (key === 'status' && ['todo', 'doing', 'done'].includes(value)) {
          currentStory.status = value as Story['status']
          continue
        }
        if (key === 'slug') {
          currentStory.slug = value.trim()
          continue
        }
        if (key === 'id') {
          currentStory.id = value.trim()
          if (currentStory.id) usedStoryIds.add(currentStory.id)
          if (currentStoryMeta) currentStoryMeta.hadIdProperty = true
          continue
        }
        if (key === 'notes') {
          currentStory.notes = currentStory.notes ? `${currentStory.notes}\n${value}` : value
          continue
        }
        if (key === 'req' || key === 'plan' || key === 'done') {
          const docRef = parseFormADocRef(key, value.trim(), currentStory.docRefs.length)
          if (docRef) currentStory.docRefs.push(docRef)
          else currentStory.unknownProps.push(trimmed)
          continue
        }

        currentStory.unknownProps.push(trimmed)
        continue
      }

      if (propB) {
        const key = propB[1].toLowerCase()
        const value = propB[2]
        if (currentStoryMeta) {
          currentStoryMeta.propLines.push(line)
          currentStoryMeta.form = 'B'
        }

        if (key === 'status' && ['todo', 'doing', 'done'].includes(value)) {
          currentStory.status = value as Story['status']
          continue
        }
        if (key === 'slug') {
          currentStory.slug = value.trim()
          continue
        }

        currentStory.unknownProps.push(trimmed)
        continue
      }

      const legacyDoc = trimmed.match(/^-\s*(\d{4}-\d{2}-\d{2})\s+→\s+(.+)$/)
      if (legacyDoc) {
        const filename = legacyDoc[2].trim()
        currentStory.docRefs.push({
          id: `legacy-${currentStory.docRefs.length}`,
          type: inferDocRefType(filename),
          date: legacyDoc[1],
          filename,
        })
        if (currentStoryMeta) {
          currentStoryMeta.propLines.push(line)
          currentStoryMeta.form = 'B'
        }
        continue
      }

      currentStory.unknownProps.push(trimmed)
      currentStoryMeta?.propLines.push(line)
    }
  }

  // Finalize story IDs and metadata snapshots.
  for (const activity of map.activities) {
    for (const task of activity.tasks) {
      for (const story of task.stories) {
        if (!story.id) {
          story.id = makeStoryId(story.slug, usedStoryIds, idCounter)
        }
        if (!story.slug) story.slug = ''
        if (!story.notes) story.notes = ''

        const storyMeta = storyToMeta.get(story)
        // Build stable metadata snapshot for serializer preserve mode.
        meta.storyMetaById[story.id] = {
          storyLine: storyMeta?.storyLine || `    - ${story.title} #story`,
          propLines: storyMeta?.propLines || [],
          form: storyMeta?.form || 'A',
          hadIdProperty: storyMeta?.hadIdProperty || false,
          original: {
            id: story.id,
            status: story.status,
            slug: story.slug,
            notes: story.notes,
            unknownProps: [...story.unknownProps],
            docRefs: cloneDocRefs(story.docRefs),
          },
        }
      }
    }
  }

  attachParseMeta(map, meta)
  return map
}
