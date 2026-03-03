export type InspectorStoryData = {
  id: string
  title: string
  status: string
  slug: string
  notes: string
  docRefs: Array<{ id: string; type: string; date: string; filename: string }>
}

export type ActivityItem = {
  key: string
  label: string
  count: string
  selected?: boolean
  tasks?: string[]
}

export type StoryCardData = {
  id: string
  title: string
  task: string
  meta: string
  docs?: string
  inspector: InspectorStoryData
}

export type BoardColumnData = {
  key: string
  title: string
  count: string
  tasks: string[]
  cards: StoryCardData[]
}
