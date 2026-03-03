import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'node:path'
import { ipcMain } from 'electron'
import { FileWatchRegistry, registerWorkspaceIpcHandlers } from './workspaceIpc'

let ipcRegistration: ReturnType<typeof registerWorkspaceIpcHandlers> | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#fafafa',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: app.isPackaged,
      preload: join(__dirname, 'preload.js'),
    },
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/dist/index.html'))
  }
}

app.whenReady().then(() => {
  ipcRegistration = registerWorkspaceIpcHandlers(ipcMain, new FileWatchRegistry(), {
    showOpenDialog: dialog.showOpenDialog.bind(dialog),
    fromWebContents: BrowserWindow.fromWebContents,
  })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  ipcRegistration?.dispose()
  ipcRegistration = null
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
