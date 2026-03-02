import type { DocRef, FormatMode, Story, StoryMap } from '../types/model'
import { getParseMeta } from '../parser/parse'

function docRefKey(type: DocRef['type']): string {
  return type.toLowerCase()
}

function docRefLine(indent: string, docRef: DocRef, form: 'A' | 'B'): string {
  if (form === 'B') return `${indent}- ${docRef.date} → ${docRef.filename}`
  return `${indent}${docRefKey(docRef.type)}:: ${docRef.date}/${docRef.filename}`
}

function docRefsEqual(a: DocRef[], b: DocRef[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].type !== b[i].type || a[i].date !== b[i].date || a[i].filename !== b[i].filename) return false
  }
  return true
}

function storyUnchanged(story: Story, original?: { id: string; status: string; slug: string; notes: string; unknownProps: string[]; docRefs: DocRef[] }): boolean {
  if (!original) return false
  if (story.id !== original.id) return false
  if (story.status !== original.status) return false
  if (story.slug !== original.slug) return false
  if (story.notes !== original.notes) return false
  if (story.unknownProps.length !== original.unknownProps.length) return false
  if (!docRefsEqual(story.docRefs, original.docRefs)) return false
  for (let i = 0; i < story.unknownProps.length; i += 1) {
    if (story.unknownProps[i] !== original.unknownProps[i]) return false
  }
  return true
}

function normalizeStoryProps(story: Story, indent: string): string[] {
  const lines = [`${indent}id:: ${story.id}`, `${indent}status:: ${story.status}`, `${indent}slug:: ${story.slug}`]
  if (story.notes) {
    for (const n of story.notes.split('\n')) lines.push(`${indent}notes:: ${n}`)
  }
  for (const docRef of story.docRefs) {
    lines.push(`${indent}${docRefKey(docRef.type)}:: ${docRef.date}/${docRef.filename}`)
  }
  for (const unknown of story.unknownProps) {
    lines.push(unknown.startsWith(indent) ? unknown : `${indent}${unknown}`)
  }
  return lines
}

function preserveStoryProps(story: Story, indent: string, form: 'A' | 'B'): string[] {
  if (form === 'B') {
    const lines = [`${indent}id:: ${story.id}`, `${indent}status: ${story.status}`, `${indent}slug: ${story.slug}`]
    for (const docRef of story.docRefs) lines.push(docRefLine(indent, docRef, 'B'))
    for (const unknown of story.unknownProps) lines.push(unknown.startsWith(indent) ? unknown : `${indent}${unknown}`)
    return lines
  }

  const lines = [`${indent}id:: ${story.id}`, `${indent}status:: ${story.status}`, `${indent}slug:: ${story.slug}`]
  if (story.notes) {
    for (const n of story.notes.split('\n')) lines.push(`${indent}notes:: ${n}`)
  }
  for (const docRef of story.docRefs) lines.push(docRefLine(indent, docRef, 'A'))
  for (const unknown of story.unknownProps) lines.push(unknown.startsWith(indent) ? unknown : `${indent}${unknown}`)
  return lines
}

export function serialize(map: StoryMap, mode: FormatMode): string {
  const lines: string[] = [`# ${map.title}`, '']
  const meta = getParseMeta(map)

  for (const activity of map.activities) {
    lines.push(activity.rawLine || `- ${activity.title} #activity`)
    for (const task of activity.tasks) {
      lines.push(task.rawLine || `  - ${task.title} #task`)
      for (const story of task.stories) {
        const storyMeta = meta?.storyMetaById[story.id]
        const storyLine = storyMeta?.storyLine || `    - ${story.title} #story`
        const indentMatch = (storyMeta?.propLines[0] || '').match(/^(\s*)/)
        const propIndent = indentMatch ? indentMatch[1] : '      '

        lines.push(storyLine)

        if (mode === 'preserve' && storyUnchanged(story, storyMeta?.original) && storyMeta?.hadIdProperty) {
          lines.push(...(storyMeta?.propLines || []))
          continue
        }

        if (mode === 'normalize') {
          lines.push(...normalizeStoryProps(story, propIndent))
          continue
        }

        lines.push(...preserveStoryProps(story, propIndent, storyMeta?.form || 'A'))
      }
    }
    lines.push('')
  }

  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  return `${lines.join('\n')}\n`
}
