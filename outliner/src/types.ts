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
