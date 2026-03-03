import type { ActivityItem, BoardColumnData, InspectorStoryData } from './storyMapTypes'

function mkMockStory(id: string, title: string, status: string, slug: string, docs?: string[]): InspectorStoryData {
  return {
    id,
    title,
    status,
    slug,
    notes: '(mock) Story details preview',
    docRefs: (docs ?? []).map((type, index) => ({
      id: `${id}-doc-${index}`,
      type,
      date: '2026-03-03',
      filename: `${type.toLowerCase()}-${slug}.md`,
    })),
  }
}

export const mockActivities: ActivityItem[] = [
  {
    key: 'world-management',
    label: 'World Management',
    count: '3/5',
    selected: true,
    tasks: ['Create & configure world', 'Import / export world', 'Manage world settings'],
  },
  {
    key: 'agent-authoring',
    label: 'Agent Authoring',
    count: '1/6',
    tasks: ['Define agent', 'Configure model', 'Validate instructions'],
  },
  {
    key: 'chat-conversations',
    label: 'Chat & Conversations',
    count: '2/4',
    tasks: ['Start conversation', 'Resume conversation'],
  },
  {
    key: 'tools-skills',
    label: 'Tools & Skills',
    count: '0/3',
    tasks: ['Register tools', 'Configure permissions'],
  },
  {
    key: 'human-loop',
    label: 'Human-in-the-Loop',
    count: '1/2',
    tasks: ['Pause for approval', 'Resume execution'],
  },
  {
    key: 'multi-interface',
    label: 'Multi-Interface Access',
    count: '0/4',
    tasks: ['Terminal access', 'Editor access'],
  },
  {
    key: 'observability',
    label: 'Observability',
    count: '0/3',
    tasks: ['Trace actions', 'View activity feed'],
  },
]

const richColumns: Record<string, Omit<BoardColumnData, 'key' | 'title' | 'count'>> = {
  'world-management': {
    tasks: ['Create & configure world', 'Import / export world', 'Manage world settings'],
    cards: [
      {
        id: 'mock-world-1',
        title: 'Create new world from scratch',
        task: 'Create & configure world',
        meta: 'todo  low  owner:core',
        docs: 'REQ, PLAN',
        inspector: mkMockStory('mock-world-1', 'Create new world from scratch', 'todo', 'create-world', ['REQ', 'PLAN']),
      },
      {
        id: 'mock-world-2',
        title: 'Validate world configuration schema',
        task: 'Manage world settings',
        meta: 'in-progress  medium  owner:core',
        docs: 'REQ',
        inspector: mkMockStory('mock-world-2', 'Validate world configuration schema', 'doing', 'validate-world-schema', ['REQ']),
      },
    ],
  },
  'agent-authoring': {
    tasks: ['Define agent', 'Configure model', 'Validate instructions'],
    cards: [
      {
        id: 'mock-agent-1',
        title: 'Write agent persona & instructions',
        task: 'Define agent',
        meta: 'todo  high  owner:frontend',
        inspector: mkMockStory('mock-agent-1', 'Write agent persona & instructions', 'todo', 'agent-persona'),
      },
      {
        id: 'mock-agent-2',
        title: 'Configure agent model & params',
        task: 'Configure model',
        meta: 'todo  medium  owner:frontend',
        docs: 'PLAN',
        inspector: mkMockStory('mock-agent-2', 'Configure agent model & params', 'todo', 'agent-model-params', ['PLAN']),
      },
    ],
  },
  'chat-conversations': {
    tasks: ['Start conversation', 'Resume conversation'],
    cards: [
      {
        id: 'mock-chat-1',
        title: 'Start new chat session',
        task: 'Start conversation',
        meta: 'done  low  owner:app',
        docs: 'DONE',
        inspector: mkMockStory('mock-chat-1', 'Start new chat session', 'done', 'start-chat-session', ['DONE']),
      },
      {
        id: 'mock-chat-2',
        title: 'Resume previous conversation',
        task: 'Resume conversation',
        meta: 'todo  medium  owner:app',
        inspector: mkMockStory('mock-chat-2', 'Resume previous conversation', 'todo', 'resume-chat-session'),
      },
    ],
  },
}

export const mockBoardColumns: BoardColumnData[] = mockActivities.map((activity) => {
  const rich = richColumns[activity.key]
  if (rich) {
    return {
      key: activity.key,
      title: activity.label,
      count: String(rich.cards.length),
      tasks: rich.tasks,
      cards: rich.cards,
    }
  }

  return {
    key: activity.key,
    title: activity.label,
    count: '0',
    tasks: activity.tasks?.length ? activity.tasks : ['No task'],
    cards: [],
  }
})
