import { copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { atomicWrite } from './atomicWrite'

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function writeWithBackup(filePath: string, content: string): Promise<void> {
  if (await fileExists(filePath)) {
    await copyFile(filePath, `${filePath}.bak`)
  }
  await atomicWrite(filePath, content)
}
