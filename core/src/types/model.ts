export type Status = 'todo' | 'doing' | 'done'
export type DocRefType = 'REQ' | 'PLAN' | 'DONE'
export type FormatMode = 'preserve' | 'normalize'

export interface DocRef {
  id: string
  type: DocRefType
  date: string // YYYY-MM-DD
  filename: string
}

export interface Story {
  id: string
  taskId: string
  title: string
  status: Status
  slug: string
  notes: string
  unknownProps: string[]
  order: number
  updatedAt: number // ms timestamp; set on every mutation
  docRefs: DocRef[]
}

export interface Task {
  id: string
  activityId: string
  title: string
  rawLine: string
  order: number
  stories: Story[]
}

export interface Activity {
  id: string
  title: string
  rawLine: string
  order: number
  tasks: Task[]
}

export interface StoryMap {
  title: string
  activities: Activity[]
}

export interface InspectorStoryData {
  id: string
  title: string
  status: Status | string
  slug: string
  notes: string
  docRefs: Array<{ id: string; type: string; date: string; filename: string }>
}

export interface TaskRowData {
  id: string
  label: string
}

export interface StoryCardData {
  id: string
  title: string
  taskId: string
  meta: string
  docs?: string
  inspector: InspectorStoryData
}

export interface BoardColumnData {
  key: string
  title: string
  count: string
  tasks: TaskRowData[]
  cards: StoryCardData[]
}

export interface ActivityItem {
  key: string
  label: string
  count: string
  selected?: boolean
  tasks?: TaskRowData[] | string[]
}
