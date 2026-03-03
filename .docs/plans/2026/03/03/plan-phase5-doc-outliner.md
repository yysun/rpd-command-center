# Plan: Document-Based Outliner (Logseq-Style)

Replace the current line/block-based OutlinerLanes with a document-based WYSIWYG outliner,
modeled after Logseq/Roam Research. Reference: `../apprun-logseq-clone/src/ui/components/*.tsx`.

## Architecture

### Data Model

Keep the existing `BoardColumnData[]` as the external API.
Internally, convert to a recursive block tree for rendering:

```ts
type Block = {
  id: string
  content: string         // plain text (activity title, task label, story title)
  type: 'activity' | 'task' | 'story'
  activityKey: string
  taskId?: string
  storyId?: string
  children: Block[]
}
```

Flatten back to `BoardColumnData[]` on mutations (commit changes upward).

### Component Structure

```
OutlinerLanes (wrapper — aria, undo/redo bar, scroll container)
└── OutlinerEditor (single contentEditable=true wrapper)
    └── BlockView (recursive)
        ├── .block-header (contentEditable=false)
        │   ├── .bullet-arrow (collapse toggle, CSS triangle)
        │   ├── .bullet (dot)
        │   └── .block-content (contentEditable=true, id=block.id)
        └── .block-list (indented children, vertical line)
```

Pattern from reference `page-view.tsx`:
- Outer editor div is `contentEditable="true"`
- `.block-header` is `contentEditable="false"` so arrows/bullets aren't editable
- `.block-content` is the editable region, identified by `id={block.id}`

### Keyboard Handling

Ported from reference `keyboard-events.ts`:

| Key | Action |
|-----|--------|
| Enter | Split block at caret → new sibling below |
| Shift+Enter | Insert soft line break inside current block (no new bullet) |
| Backspace (empty / at start) | Merge with previous block |
| Backspace at start (empty indented block) | Delete block or outdent based on structure rules |
| Backspace at start (non-empty block) | Merge with previous block and keep subtree rules |
| Backspace at start (page-level line) | Merge into previous page-level line |
| Delete at end of block | Delete forward; may merge with next block |
| Tab | Indent block (move under previous sibling) |
| Tab on page-level line | Indent under previous page-level line |
| Shift+Tab | Outdent block (move to parent's sibling) |
| Shift+Tab on top-level line | Promote to new page-level line |
| Option/Alt+ArrowUp/Down | Move block up/down |
| Cmd/Ctrl+Shift+ArrowUp/Down | Optional alias for moving block up/down |
| Option/Alt+ArrowLeft/Right | Outdent/Indent (alias) |
| Shift+ArrowUp/Down | Expand selection across blocks |
| Cmd/Ctrl+A (progressive) | Select text in block, then block, then subtree/page (app-style behavior) |
| Cmd/Ctrl+ArrowUp/Down | Jump block-to-block or collapse/expand (mode-dependent) |
| Cmd/Ctrl+. | Collapse/expand current block (optional alias) |
| ArrowLeft at block start | Collapse current block if foldable |
| ArrowRight at block start | Expand current block if folded |
| ArrowUp/Down at block boundary | Navigate to previous/next block |
| Home/End | Move within line, then to block boundaries (progressive behavior) |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z / Cmd/Ctrl+Y | Redo |

Expected norms to preserve:
- Enter in the middle of a block splits into two blocks at caret.
- Indent/outdent moves the whole subtree with the focused block.
- Moving blocks up/down also moves children as a subtree.
- Collapse/expand should be available by both mouse (bullet arrow) and keyboard.

### Caret Management

Ported from reference `caret.ts`:
- `saveCaret(el)` — inserts hidden `<span id="__caret">` at selection
- `restoreCaret(el)` — finds span, places selection after it, removes span
- `createCaret(el)` — places caret at start/end of element
- After every structural mutation (split, merge, indent, move), restore caret/focus on the next render pass

### CSS (Tailwind + custom classes in globals.css)

Add block/bullet/arrow styles to `globals.css`:
- `.block` — flex column, left padding for indent
- `.block-header` — flex row
- `.block-list` — left border (vertical line), padding-left
- `.bullet` — 6px circle
- `.bullet-arrow` — CSS border-triangle (right=collapsed, down=expanded)
- `.block-content p` — min-height 24px
- Dark-theme aware via CSS variables

### Integration with App.tsx

Props contract stays the same:
```ts
type OutlinerLanesProps = {
  columns: BoardColumnData[]
  onColumnsChange: (next: BoardColumnData[]) => void
  onStoryClick: (storyId?: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}
```

No changes needed in App.tsx.

## Implementation Phases

### Phase 1 — Block data utilities
- [x] 1.1 `columnsToBlocks(columns)` — convert `BoardColumnData[]` → `Block[]` tree
- [x] 1.2 `blocksToColumns(blocks)` — convert `Block[]` tree → `BoardColumnData[]`
- [x] 1.3 Block tree mutation helpers: `splitBlock`, `mergeBlock`, `indentBlock`, `outdentBlock`, `moveBlockUp`, `moveBlockDown`, `deleteBlock`
- [x] 1.4 `findPrevBlock(blocks, id)` / `findNextBlock(blocks, id)` — linear traversal helpers

### Phase 2 — Caret utilities
- [x] 2.1 `saveCaret(el)` — insert `#__caret` span at selection
- [x] 2.2 `restoreCaret(el)` — find span, restore selection, remove span
- [x] 2.3 `createCaret(el, toStart?)` — place caret at start/end of element
- [x] 2.4 `splitElement(el)` — split contentEditable innerHTML at caret into [before, after]

### Phase 3 — CSS block styles
- [x] 3.1 Add `.block`, `.block-header`, `.block-list`, `.block-content`, `.bullet`, `.bullet-arrow` styles to `globals.css`
- [x] 3.2 Arrow triangles (`.arrow-right`, `.arrow-down`) using CSS borders
- [x] 3.3 Dark-theme compatible colors using CSS variables

### Phase 4 — React components
- [x] 4.1 `BlockView` — recursive React component (converted from `page-view.tsx`)
- [x] 4.2 `OutlinerEditor` — single contentEditable wrapper with keyboard handler
- [x] 4.3 `OutlinerLanes` — outer shell with undo/redo toolbar and scroll container

### Phase 5 — Keyboard event handler
- [x] 5.1 `editorKeyDown` — Enter (split), Backspace (merge), Tab (indent/outdent), Option/Alt+Arrows (move)
- [x] 5.2 `editorKeyUp` — save block content on every keystroke
- [x] 5.3 Wire undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [x] 5.4 Add page-level line semantics for Backspace merge and Tab indent/promote

### Phase 6 — Collapse/expand
- [x] 6.1 Toggle collapsed state per block
- [x] 6.2 Hide `.block-list` when collapsed, flip arrow direction

### Phase 7 — Verify & test
- [x] 7.1 Run existing smoke tests
- [x] 7.2 Run build
- [x] 7.3 Visual verification

## Notes After Implementation

- macOS `Option` is supported through the same `altKey` event path as `Alt`.
- Added focused regression coverage for `Shift+Tab` outdent to top-level and immediate `Tab` then `Shift+Tab` round-trip.
- Structural mutation caret/focus restoration uses a post-render layout effect path to avoid race conditions during rapid key chaining.
- E2E harness includes explicit CSS variables so bullet dots and collapse/expand arrows are visible in browser tests.
- Backspace at page-level line start merges into the previous page-level line.
- Tab on page-level lines indents under previous page-level lines; Shift+Tab can promote top-level lines to new page-level lines.
- Newly broken-out items retain content through Tab/Shift+Tab round-trips and keep immediate focus/caret for continued key input.
