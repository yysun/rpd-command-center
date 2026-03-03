import { DRAG_REGION_STYLE, NO_DRAG_REGION_STYLE } from '../constants/app-constants'
import type { InspectorStoryData } from './storyMapTypes'

type StoryInspectorProps = {
  isOpen: boolean
  selectedStory: InspectorStoryData | null
  onClose: () => void
}

export default function StoryInspector({ isOpen, selectedStory, onClose }: StoryInspectorProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close story details"
        onClick={onClose}
        className={[
          'absolute inset-0 z-10 bg-black/20 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        aria-label="Inspector"
        data-visibility={isOpen ? 'visible' : 'hidden'}
        className={[
          'absolute inset-y-0 right-0 z-20 flex h-full shrink-0 flex-col overflow-hidden bg-[var(--background)] will-change-[transform,width,opacity] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0',
          isOpen
            ? 'w-80 translate-x-0 opacity-100 border-l border-[var(--border)]'
            : 'w-80 translate-x-full opacity-0 border-l border-transparent pointer-events-none lg:w-0 lg:translate-x-0 lg:opacity-100 lg:border-l-0',
        ].join(' ')}
      >
        <header
          className="drag-region flex h-12 items-center justify-between border-b border-[var(--border)] px-4"
          style={DRAG_REGION_STYLE}
        >
          <h2 className="sr-only">Inspector</h2>
          <p className="text-[14px] font-semibold text-[var(--foreground)]">Story Details</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close story details"
            className="no-drag flex h-8 w-8 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            style={NO_DRAG_REGION_STYLE}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Title</label>
            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--foreground)]">
              {selectedStory?.title || 'Select a story'}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Status</label>
            <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2">
              <span className="rounded-full bg-[var(--status-warn-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-warn-fg)]">{selectedStory?.status ?? '-'}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">v</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Slug</label>
            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--foreground)]">
              {selectedStory?.slug || '-'}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Notes</label>
            <div className="h-[60px] rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-[12px] text-[var(--foreground)]">
              {selectedStory?.notes || '(none)'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[var(--foreground)]">Doc References</p>
              <button type="button" className="rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--foreground)]">
                + Add
              </button>
            </div>
            {selectedStory?.docRefs.length ? (
              selectedStory.docRefs.map((docRef) => (
                <div key={docRef.id} className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-2 py-1.5 text-[11px]">
                  <span className="rounded bg-[var(--status-info-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--status-info-fg)]">{docRef.type}</span>
                  <span className="text-[var(--muted-foreground)]">{docRef.date}</span>
                  <span className="truncate text-[var(--foreground)]">{docRef.filename}</span>
                </div>
              ))
            ) : (
              <div className="rounded-md bg-[var(--muted)] px-2 py-1.5 text-[11px] text-[var(--muted-foreground)]">No doc refs</div>
            )}
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div className="space-y-2">
            <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
              Mark Done
            </button>
            <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
              Move to...
            </button>
            <button type="button" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-left text-[12px]">
              Duplicate
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
