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
  order: number
  updatedAt: number // ms timestamp; set on every mutation
  docRefs: DocRef[]
}

export interface Task {
  id: string
  activityId: string
  title: string
  order: number
  stories: Story[]
}

export interface Activity {
  id: string
  title: string
  order: number
  tasks: Task[]
}

export interface StoryMap {
  title: string
  activities: Activity[]
}
