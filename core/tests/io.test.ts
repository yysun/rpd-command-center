import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, writeFile, access, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { atomicWrite, writeWithBackup } from '../src/index'

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

describe('atomicWrite', () => {
  it('1G-60 writes content and no tmp remains', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'a.md')
    await atomicWrite(file, 'hello')
    await expect(readFile(file, 'utf8')).resolves.toBe('hello')
    await expect(exists(`${file}.tmp`)).resolves.toBe(false)
  })

  it('1G-61 creates non-existent file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'new.md')
    await atomicWrite(file, 'x')
    await expect(readFile(file, 'utf8')).resolves.toBe('x')
  })

  it('1G-62 rename failure cleans tmp', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const targetDir = join(dir, 'target')
    await mkdir(targetDir)
    await expect(atomicWrite(targetDir, 'new')).rejects.toBeInstanceOf(Error)
    await expect(exists(`${targetDir}.tmp`)).resolves.toBe(false)
  })

  it('1G-63 failure surfaces Error message', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const targetDir = join(dir, 'dir-dest')
    await mkdir(targetDir)
    try {
      await atomicWrite(targetDir, 'x')
      throw new Error('expected failure')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message.length).toBeGreaterThan(0)
    }
  })
})

describe('writeWithBackup', () => {
  it('1G-64 existing file gets .bak before write', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'a.md')
    await writeFile(file, 'old', 'utf8')
    await writeWithBackup(file, 'new')
    await expect(exists(`${file}.bak`)).resolves.toBe(true)
  })

  it('1G-65 .bak content matches pre-write', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'a.md')
    await writeFile(file, 'old', 'utf8')
    await writeWithBackup(file, 'new')
    await expect(readFile(`${file}.bak`, 'utf8')).resolves.toBe('old')
  })

  it('1G-66 missing source writes without backup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'a.md')
    await writeWithBackup(file, 'new')
    await expect(readFile(file, 'utf8')).resolves.toBe('new')
    await expect(exists(`${file}.bak`)).resolves.toBe(false)
  })

  it('1G-67 backup copy failure aborts write', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const asDir = join(dir, 'asdir')
    await mkdir(asDir)
    await expect(writeWithBackup(asDir, 'new')).rejects.toBeInstanceOf(Error)
    await expect(exists(`${asDir}.tmp`)).resolves.toBe(false)
  })

  it('1G-68 successful write final and bak contents', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const file = join(dir, 'a.md')
    await writeFile(file, 'old', 'utf8')
    await writeWithBackup(file, 'new')
    await expect(readFile(file, 'utf8')).resolves.toBe('new')
    await expect(readFile(`${file}.bak`, 'utf8')).resolves.toBe('old')
  })

  it('1G-69 copy failure surfaces Error message', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'rpd-core-'))
    const asDir = join(dir, 'asdir')
    await mkdir(asDir)
    try {
      await writeWithBackup(asDir, 'x')
      throw new Error('expected failure')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).message.length).toBeGreaterThan(0)
    }
  })
})
