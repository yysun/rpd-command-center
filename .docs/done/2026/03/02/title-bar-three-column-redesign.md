# Title Bar Three-Column Redesign

**Date:** 2026-03-02  
**Files changed:**
- `electron/renderer/src/components/MainTitleBar.tsx`
- `electron/renderer/src/App.tsx`

---

## Summary

Redesigned the main application title bar from a single flat row into a structured three-column layout matching the target design mockup.
Also implemented title-bar interaction logic (sidebar/view controls) and end-to-end theme mode features (system/light/dark).

---

## Changes

### `MainTitleBar.tsx`

- Replaced the previous generic nav bar (back button, title, upload/download buttons) with a three-section layout divided by vertical hairline separators.
- Exported a new `View` type (`'board' | 'outline' | 'timeline'`).
- Exported `ThemeMode` (`'system' | 'light' | 'dark'`).
- Added `activeView: View` and `onChangeView: (view: View) => void` props.
- Added `isSidebarOpen`, `onToggleSidebar`, `activeTheme`, and `onChangeTheme` props.
- Reduced title bar height from `h-16` to `h-12` to match design.

**Left column (`w-[152px]`):**
- Story-map grid SVG icon.
- "Story Map" bold label (`text-[15px] font-semibold`).
- Sidebar toggle button (right-aligned, no-drag) with dynamic icon direction and `aria-label` (`Collapse sidebar` / `Expand sidebar`).

**Middle column (flex-1):**
- Search input with magnifier SVG icon, placeholder "Search stories, slugs, docs...".
- Vertical divider.
- "Filters:" label.
- "Status: All ∨" pill button.
- "Has docs ∨" pill button.
- Board / Outline / Timeline view toggle (icon + text, active tab gets card background + shadow).

**Theme controls (right side of middle column):**
- Added 3-button theme selector group: `System`, `Light`, `Dark`.
- Buttons are no-drag interactive controls and reflect active mode with selected styling.
- Wired to `onChangeTheme` callback.

**Right column (`w-80`):**
- No dedicated inspector controls rendered in title bar; inspector controls remain in the inspector panel body/header.

**Title bar behavior logic:**
- Added platform-aware left padding for Electron traffic lights:
- macOS/iOS family uses `pl-[88px]`; non-mac uses `pl-3`.
- Preserved drag-region and no-drag-region behavior using shared constants for frameless UX.

### `App.tsx`

- Added `activeView` state (`useState<View>('board')`).
- Added `activeTheme` state (`useState<ThemeMode>('system')` with local-storage restore).
- Passed `activeView` and `onChangeView={setActiveView}` to `MainTitleBar`.
- Passed `isSidebarOpen`, `onToggleSidebar`, `activeTheme`, and `onChangeTheme={setActiveTheme}` to `MainTitleBar`.
- Removed the redundant inner `main > header` that previously held the search/filters/view-toggle row — those controls now live in the unified title bar.
- Updated content area height from `h-[calc(100%-4rem)]` → `h-[calc(100%-3rem)]` to match the new `h-12` title bar.

**Theme feature implementation in `App.tsx`:**
- Added `THEME_STORAGE_KEY = 'rpd-theme-preference'` persistence.
- Persisted user preference to `localStorage` on change.
- Added resolver logic for `system` mode via `matchMedia('(prefers-color-scheme: dark)')`.
- Applied resolved mode to `document.documentElement.dataset.theme` and `colorScheme`.
- Subscribed to system theme changes only while in `system` mode and cleaned up listeners correctly.

---

## Outcome

The title bar now mirrors the three-column workspace structure with production interaction logic:
- sidebar expand/collapse control,
- board/outline/timeline view switching,
- system/light/dark theme switching with persistence and OS-sync behavior.

No TypeScript regressions were introduced in the redesign pass.
