import { expect, test } from '@playwright/test'

type StateShape = {
  pages: Array<{
    id: string
    title: string
    blocks: Array<{
      id: string
      content: string
      children: Array<{ id: string; content: string; children: Array<unknown> }>
    }>
  }>
  focusedBlockId?: string
  history: { past: number; future: number }
  ids: string[]
}

async function readState(page: import('@playwright/test').Page): Promise<StateShape> {
  const raw = await page.getByTestId('state').innerText()
  return JSON.parse(raw) as StateShape
}

async function setCaret(page: import('@playwright/test').Page, blockId: string, offset: number) {
  await page.evaluate(
    ({ id, caretOffset }) => (window as Window & { __outlinerE2E?: { setCaret: (blockId: string, offset: number) => boolean } }).__outlinerE2E?.setCaret(id, caretOffset),
    { id: blockId, caretOffset: offset },
  )
}

async function readSelectedText(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => window.getSelection()?.toString() ?? '')
}

async function readCaretOffset(page: import('@playwright/test').Page, blockId: string): Promise<number> {
  return page.evaluate((id) => {
    const block = document.getElementById(id)
    if (!(block instanceof HTMLElement)) return -1

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return -1
    const range = selection.getRangeAt(0)
    if (!block.contains(range.startContainer)) return -1

    const measurement = range.cloneRange()
    measurement.selectNodeContents(block)
    measurement.setEnd(range.startContainer, range.startOffset)
    return measurement.toString().length
  }, blockId)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('splits block at caret with Enter', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 4)
  await page.keyboard.press('Enter')

  const state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(3)
  expect(state.pages[0]?.blocks[0]?.content).toBe('Task')
  expect(state.pages[0]?.blocks[1]?.content).toBe(' 1')
})

test('splits at end of block into empty sibling', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.press('Enter')

  const state = await readState(page)
  expect(state.pages[0]?.blocks[0]?.content).toBe('Task 1')
  expect(state.pages[0]?.blocks[1]?.content).toBe('')
})

test('splits at start of block and shifts text into next sibling', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Enter')

  const state = await readState(page)
  expect(state.pages[0]?.blocks[0]?.content).toBe('')
  expect(state.pages[0]?.blocks[1]?.content).toBe('Task 1')
})

test('does not structurally split on Shift+Enter', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 4)
  await page.keyboard.press('Shift+Enter')

  const state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(2)
})

test('does not structurally split on Ctrl+Enter', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 4)
  await page.keyboard.press('Control+Enter')

  const state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(2)
})

test('persists a space key edit in current block', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.press('Space')

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks[0]?.content)
    .toBe('Task 1 ')
})

test('keeps caret direction for regular key typing (no jump to line start)', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.type('abc')

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks[0]?.content)
    .toBe('Task 1abc')
})

test('keeps caret direction for space then regular key typing', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.press('Space')
  await page.keyboard.type('abc')

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks[0]?.content)
    .toBe('Task 1 abc')
})

test('merges with Backspace at start of block', async ({ page }) => {
  await page.click('#story\\:s1')
  await setCaret(page, 'story:s1', 0)
  await page.keyboard.press('Backspace')

  const state = await readState(page)
  const firstTask = state.pages[0]?.blocks[0]
  expect(firstTask?.children.length).toBe(0)
  expect(firstTask?.content).toContain('Task 1Story 1')
})

test('Backspace child->parent merge keeps caret at merge boundary', async ({ page }) => {
  await page.click('#story\\:s1')
  await setCaret(page, 'story:s1', 0)
  await page.keyboard.press('Backspace')

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks[0]?.content)
    .toBe('Task 1Story 1')

  const offset = await readCaretOffset(page, 'task:t1')
  expect(offset).toBe('Task 1'.length)
})

test('Backspace empty child->parent merge keeps caret at parent end boundary', async ({ page }) => {
  await page.click('#story\\:s1')
  await page.locator('#story\\:s1').evaluate((el) => {
    el.textContent = ''
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'x', bubbles: true }))
  })
  await setCaret(page, 'story:s1', 0)
  await page.keyboard.press('Backspace')

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks[0]?.content)
    .toBe('Task 1')

  const offset = await readCaretOffset(page, 'task:t1')
  expect(offset).toBe('Task 1'.length)
})

test('Backspace at first top-level block start is a structural no-op', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Backspace')

  const state = await readState(page)
  expect(state.pages[0]?.blocks.map((block) => block.id)).toEqual(['task:t1', 'task:t2'])
})

test('edits text with Backspace in the middle without structural merge', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 3)
  await page.keyboard.press('Backspace')

  const state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(2)
  expect(state.pages[0]?.blocks[0]?.content).toBe('Tak 1')
})

test('indents and outdents with Tab shortcuts', async ({ page }) => {
  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Tab')

  let state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(1)
  expect(state.pages[0]?.blocks[0]?.children.map((child) => child.id)).toContain('task:t2')

  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Shift+Tab')

  state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(2)
  expect(state.pages[0]?.blocks[1]?.id).toBe('task:t2')
})

test('moves blocks with Alt+ArrowUp and Alt+ArrowDown', async ({ page }) => {
  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Alt+ArrowUp')

  let state = await readState(page)
  expect(state.pages[0]?.blocks[0]?.id).toBe('task:t2')

  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Alt+ArrowDown')

  state = await readState(page)
  expect(state.pages[0]?.blocks[1]?.id).toBe('task:t2')
})

test('deletes empty block with Delete', async ({ page }) => {
  await page.click('#story\\:s2')
  await page.locator('#story\\:s2').evaluate((el) => {
    el.textContent = ''
  })
  await setCaret(page, 'story:s2', 0)
  await page.keyboard.press('Delete')

  const state = await readState(page)
  const remainingChildIds = state.pages[0]?.blocks.flatMap((block) => block.children.map((child) => child.id))
  expect(remainingChildIds).not.toContain('story:s2')
})

test('Delete on non-empty block does not trigger structural delete', async ({ page }) => {
  await page.click('#story\\:s2')
  await setCaret(page, 'story:s2', 2)
  await page.keyboard.press('Delete')

  const state = await readState(page)
  const remainingChildIds = state.pages[0]?.blocks.flatMap((block) => block.children.map((child) => child.id))
  expect(remainingChildIds).toContain('story:s2')
})

test('undo and redo keyboard shortcuts work across structural mutations', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 4)
  await page.keyboard.press('Enter')

  let state = await readState(page)
  expect(state.pages[0]?.blocks.length).toBe(3)

  await page.evaluate(() => {
    const editor = document.querySelector('.outliner-editor') as HTMLElement | null
    if (!editor) return
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
  })

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks.length)
    .toBe(2)

  await page.evaluate(() => {
    const editor = document.querySelector('.outliner-editor') as HTMLElement | null
    if (!editor) return
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }))
  })

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks.length)
    .toBe(3)

  await page.evaluate(() => {
    const editor = document.querySelector('.outliner-editor') as HTMLElement | null
    if (!editor) return
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }))
  })

  await expect
    .poll(async () => (await readState(page)).pages[0]?.blocks.length)
    .toBe(3)
})

test('no-op structural keys do not leak caret marker span', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)

  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('#__caret')).toHaveCount(0)

  await page.keyboard.press('Alt+ArrowUp')
  await expect(page.locator('#__caret')).toHaveCount(0)
})

test('focus callback tracks selected block under keyboard operations', async ({ page }) => {
  await page.click('#story\\:s1')
  await setCaret(page, 'story:s1', 1)

  let state = await readState(page)
  expect(state.focusedBlockId).toBe('story:s1')

  await page.keyboard.press('Alt+ArrowDown')
  state = await readState(page)
  expect(state.focusedBlockId).toBe('story:s1')
})

test('supports Cmd/Ctrl+Shift+ArrowUp/Down as move aliases', async ({ page }) => {
  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Control+Shift+ArrowUp')

  let state = await readState(page)
  expect(state.pages[0]?.blocks[0]?.id).toBe('task:t2')

  await page.click('#task\\:t2')
  await setCaret(page, 'task:t2', 0)
  await page.keyboard.press('Control+Shift+ArrowDown')

  state = await readState(page)
  expect(state.pages[0]?.blocks[1]?.id).toBe('task:t2')
})

test('supports Shift+ArrowUp/Down for block range selection', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Shift+ArrowDown')

  const selectedIds = await page.locator('.block[data-block-selected="true"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).dataset.blockId ?? ''),
  )
  expect(selectedIds).toContain('task:t1')
  expect(selectedIds).toContain('story:s1')
})

test('supports progressive Cmd/Ctrl+A selection (text, block, subtree/page)', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 1)

  await page.evaluate(() => {
    const editor = document.querySelector('.outliner-editor') as HTMLElement | null
    if (!editor) return
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }))
  })
  const firstSelected = await readSelectedText(page)

  await page.evaluate(() => {
    const editor = document.querySelector('.outliner-editor') as HTMLElement | null
    if (!editor) return
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }))
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }))
  })
  const thirdSelected = await readSelectedText(page)
  const selectedIds = await page.locator('.block[data-block-selected="true"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).dataset.blockId ?? ''),
  )

  expect(firstSelected).toContain('Task 1')
  expect(thirdSelected).toContain('Task 1')
  expect(selectedIds).toContain('story:s1')
})

test('supports ArrowLeft/ArrowRight at block start for collapse and expand', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('#story\\:s1')).toHaveCount(0)

  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#story\\:s1')).toHaveCount(1)
})

test('supports Cmd/Ctrl+ArrowUp/Down and Cmd/Ctrl+. for collapse and expand', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Control+ArrowUp')
  await expect(page.locator('#story\\:s1')).toHaveCount(0)

  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Control+ArrowDown')
  await expect(page.locator('#story\\:s1')).toHaveCount(1)

  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 0)
  await page.keyboard.press('Control+.')
  await expect(page.locator('#story\\:s1')).toHaveCount(0)
})

test('supports ArrowUp/ArrowDown boundary navigation between blocks', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.press('ArrowDown')

  let state = await readState(page)
  expect(state.focusedBlockId).toBe('story:s1')

  await page.click('#story\\:s1')
  await setCaret(page, 'story:s1', 0)
  await page.keyboard.press('ArrowUp')

  state = await readState(page)
  expect(state.focusedBlockId).toBe('task:t1')
})

test('supports Home/End progressive line/block navigation', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 2)
  await page.keyboard.press('End')
  await page.keyboard.press('End')

  let state = await readState(page)
  expect(state.focusedBlockId).toBe('story:s1')

  await page.click('#story\\:s1')
  await setCaret(page, 'story:s1', 0)
  await page.keyboard.press('Home')

  state = await readState(page)
  expect(state.focusedBlockId).toBe('task:t1')
})

test('supports Delete at end-of-block to merge with next block', async ({ page }) => {
  await page.click('#task\\:t1')
  await setCaret(page, 'task:t1', 6)
  await page.keyboard.press('Delete')

  const state = await readState(page)
  expect(state.pages[0]?.blocks[0]?.content).toBe('Task 1Story 1')
  expect(state.pages[0]?.blocks[0]?.children.map((child) => child.id)).not.toContain('story:s1')
})
