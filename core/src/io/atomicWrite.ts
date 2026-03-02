import { rename, unlink, writeFile } from 'node:fs/promises'

export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`
  await writeFile(tmpPath, content, 'utf8')
  try {
    await rename(tmpPath, filePath)
  } catch (error) {
    try {
      await unlink(tmpPath)
    } catch {
      // Best effort cleanup.
    }
    throw error instanceof Error ? error : new Error(String(error))
  }
}
