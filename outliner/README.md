# outliner

Reusable React outliner editor package.

## Scope

This package is intentionally generic and only works with page/block data.
It does not know about activity/task/story domain structures.

## Install/Use in This Monorepo

```tsx
import Outliner from 'outliner'
import 'outliner/styles.css'
```

## Public Interface

Exports from `outliner`:

- default export: outliner React component
- named export: `__testing` (internal helpers for tests)
- type exports:
  - `OutlinerBlock`
  - `OutlinerPage`
  - `OutlinerProps`

### Types

```ts
export type OutlinerBlock = {
  id: string
  content: string
  children: OutlinerBlock[]
}

export type OutlinerPage = {
  id: string
  title: string
  blocks: OutlinerBlock[]
}

export type OutlinerProps = {
  pages: OutlinerPage[]
  onPagesChange: (next: OutlinerPage[]) => void
  onBlockFocus?: (blockId?: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}
```

### Component Contract

- `pages` is the source of truth from the parent.
- Editing operations emit normalized next data through `onPagesChange`.
- Focusing any editable block calls `onBlockFocus(blockId)` when provided.
- Undo/redo keyboard shortcuts call `onUndo` and `onRedo`.
- `canUndo` and `canRedo` control toolbar button disabled state.

## Supported Keyboard Behaviors

| Keys | Behavior |
| --- | --- |
| `Cmd/Ctrl + Z` | Calls `onUndo()` |
| `Cmd/Ctrl + Y` | Calls `onRedo()` |
| `Cmd/Ctrl + Shift + Z` | Calls `onRedo()` |
| `Enter` | Splits current block at caret into two blocks |
| `Backspace` | If caret is at start or block is empty, merges with previous logical block |
| `Delete` | If block is empty, deletes current block |
| `Tab` | Indents current block |
| `Shift + Tab` | Outdents current block |
| `Alt + ArrowUp` | Moves current block up among siblings |
| `Alt + ArrowDown` | Moves current block down among siblings |
| `Alt + ArrowLeft` | Outdents current block |
| `Alt + ArrowRight` | Indents current block |

Behavior notes:
- Some actions are no-ops when structurally invalid.
- Root page-title blocks cannot be deleted or merged.
- Content changes are committed on key-up for non-structural keys.
- Caret position is preserved/restored around structural mutations when possible.

## Styling

```ts
import 'outliner/styles.css'
```

## Testing

```bash
npm run test --workspace=outliner
```
