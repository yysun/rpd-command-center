export type { ActivityItem, BoardColumnData, InspectorStoryData, StoryCardData, TaskRowData } from 'core'

export type BoardFocusTarget = {
  kind: 'activity' | 'task' | 'story'
  id: string
}
