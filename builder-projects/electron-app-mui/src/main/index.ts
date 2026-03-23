import archiver from 'archiver'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const isDev = process.env.NODE_ENV === 'development'

// ── Persist a reference to the main window for modal dialogs ─────────────────
let mainWindow: BrowserWindow | null = null

// ── Settings ──────────────────────────────────────────────────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

function readSettings(): Record<string, unknown> {
  try {
    if (fs.existsSync(settingsPath)) return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  } catch {
    /* ignore */
  }
  return {}
}
function writeSettings(data: object) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTemplatesDir() {
  return isDev
    ? path.join(process.cwd(), 'templates')
    : path.join(process.resourcesPath, 'templates')
}

/** Returns the game directory for a template — supports both new (game/) and legacy (root) layout */
function getGameDir(templateId: string): string {
  const templatesDir = getTemplatesDir()
  const gameSubdir = path.join(templatesDir, templateId, 'game')
  return fs.existsSync(gameSubdir) ? gameSubdir : path.join(templatesDir, templateId)
}

function checkFolderStatus(folderPath: string): 'empty' | 'has-project' | 'non-empty' {
  if (!fs.existsSync(folderPath)) return 'empty'
  const entries = fs.readdirSync(folderPath)
  if (entries.length === 0) return 'empty'
  if (fs.existsSync(path.join(folderPath, 'project.mgproj'))) return 'has-project'
  return 'non-empty'
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d)
  }
}

/** Recursively collect all values of keys named 'imagePath' that start with 'assets/' */
function collectUsedAssets(obj: unknown, out = new Set<string>()): Set<string> {
  if (!obj || typeof obj !== 'object') return out
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectUsedAssets(v, out))
    return out
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === 'imagePath' && typeof v === 'string' && v.startsWith('assets/')) out.add(v)
    else collectUsedAssets(v, out)
  }
  return out
}

/** Delete files in <projectDir>/assets/ that are not in the used set */
function purgeUnusedAssets(projectDir: string, projectData: object) {
  const assetsDir = path.join(projectDir, 'assets')
  if (!fs.existsSync(assetsDir)) return
  const usedPaths = collectUsedAssets(projectData)
  const usedFiles = new Set([...usedPaths].map((p) => path.basename(p)))
  for (const file of fs.readdirSync(assetsDir)) {
    if (!usedFiles.has(file)) {
      try {
        fs.unlinkSync(path.join(assetsDir, file))
      } catch {
        /* ignore */
      }
    }
  }
}

function injectAppData(html: string, appData: object): string {
  const scriptTag = `<script>window.APP_DATA = ${JSON.stringify(appData)};window.MY_APP_DATA=window.APP_DATA</script>`
  return html.replace(/<script/, scriptTag + '\n<script')
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    backgroundColor: '#0f1117'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Templates ────────────────────────────────────────────────────────────
ipcMain.handle('get-templates', async () => {
  const templatesDir = getTemplatesDir()
  if (!fs.existsSync(templatesDir)) return []

  const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

  return fs
    .readdirSync(templatesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const base = path.join(templatesDir, dir.name)
      const metaPath = path.join(base, 'meta.json')
      const gameDir = getGameDir(dir.name)
      const htmlPath = path.join(gameDir, 'index.html')
      if (!fs.existsSync(metaPath) || !fs.existsSync(htmlPath)) return null

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

      // Find thumbnail (sibling of meta.json)
      const thumbFile = IMAGE_EXTS.map((ext) => path.join(base, `thumbnail${ext}`)).find(
        fs.existsSync
      )
      const thumbnailUrl = thumbFile ? `file://${thumbFile.replace(/\\/g, '/')}` : null

      return { id: dir.name, ...meta, thumbnailUrl }
    })
    .filter(Boolean)
})

// ── IPC: Project management ───────────────────────────────────────────────────
ipcMain.handle('check-folder-status', async (_e, folderPath: string) =>
  checkFolderStatus(folderPath)
)

ipcMain.handle('choose-project-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose Project Save Location'
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('open-project-file', async (_e, filePath?: string) => {
  let resolved = filePath
  if (!resolved) {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'Minigame Project', extensions: ['mgproj'] }],
      title: 'Open Project'
    })
    if (result.canceled || !result.filePaths[0]) return null
    resolved = result.filePaths[0]
  }
  const content = fs.readFileSync(resolved, 'utf-8')
  return { filePath: resolved, data: JSON.parse(content) }
})

ipcMain.handle('save-project', async (_e, projectData: object, projectPath: string) => {
  fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), 'utf-8')
  purgeUnusedAssets(path.dirname(projectPath), projectData)
  return true
})

/** Save As: pick folder, copy assets, write file. Returns new paths or null if canceled. */
ipcMain.handle(
  'save-project-as',
  async (_e, _opts: { projectData: object; oldProjectDir: string }) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Save Project As — Choose New Folder'
    })
    if (result.canceled) return null

    const newFolder = result.filePaths[0]
    const status = checkFolderStatus(newFolder)
    // Return status so renderer can confirm overwrite if needed
    return { folder: newFolder, status }
  }
)

/** Actually perform the save-as copy after the renderer has confirmed */
ipcMain.handle(
  'do-save-as',
  async (_e, opts: { projectData: object; oldProjectDir: string; newFolder: string }) => {
    const { projectData, oldProjectDir, newFolder } = opts

    // Copy assets from old location
    const oldAssets = path.join(oldProjectDir, 'assets')
    if (fs.existsSync(oldAssets)) copyDirSync(oldAssets, path.join(newFolder, 'assets'))

    // Write project file
    const newFilePath = path.join(newFolder, 'project.mgproj')
    fs.writeFileSync(newFilePath, JSON.stringify(projectData, null, 2), 'utf-8')
    purgeUnusedAssets(newFolder, projectData)

    return { filePath: newFilePath, projectDir: newFolder }
  }
)

// ── IPC: Assets ───────────────────────────────────────────────────────────────
ipcMain.handle('pick-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
    title: 'Select Image'
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle(
  'import-image',
  async (_e, sourcePath: string, projectDir: string, desiredName: string) => {
    const assetsDir = path.join(projectDir, 'assets')
    fs.mkdirSync(assetsDir, { recursive: true })
    const ext = path.extname(sourcePath).toLowerCase()
    const destName = `${desiredName}${ext}`
    fs.copyFileSync(sourcePath, path.join(assetsDir, destName))
    return `assets/${destName}`
  }
)

ipcMain.handle('resolve-asset-url', async (_e, projectDir: string, relativePath: string) => {
  const abs = path.join(projectDir, relativePath)
  return `file://${abs.replace(/\\/g, '/')}`
})

// ── IPC: Settings ─────────────────────────────────────────────────────────────
ipcMain.handle('settings-read-global', async () => readSettings())
ipcMain.handle('settings-write-global', async (_e, data: object) => {
  writeSettings(data)
  return true
})

// ── IPC: Window title ─────────────────────────────────────────────────────────
ipcMain.handle('set-title', async (_e, title: string) => {
  mainWindow?.setTitle(title)
})

// ── IPC: Export ───────────────────────────────────────────────────────────────
ipcMain.handle(
  'export-project',
  async (
    _e,
    opts: {
      templateId: string
      appData: object
      projectDir: string
      mode: 'folder' | 'zip'
    }
  ) => {
    const { templateId, appData, projectDir, mode } = opts
    const gameDir = getGameDir(templateId)
    const htmlPath = path.join(gameDir, 'index.html')
    if (!fs.existsSync(htmlPath)) throw new Error(`Template HTML not found for: ${templateId}`)

    const injectedHtml = injectAppData(fs.readFileSync(htmlPath, 'utf-8'), appData)

    if (mode === 'folder') {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Export Destination'
      })
      if (result.canceled) return { canceled: true }
      const destDir = result.filePaths[0]
      // Copy all game resources, then overwrite index.html with injected version
      copyDirSync(gameDir, destDir)
      fs.writeFileSync(path.join(destDir, 'index.html'), injectedHtml, 'utf-8')
      // Copy project assets
      const assetsDir = path.join(projectDir, 'assets')
      if (fs.existsSync(assetsDir)) copyDirSync(assetsDir, path.join(destDir, 'assets'))
      shell.openPath(destDir)
      return { success: true, path: destDir }
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        defaultPath: 'game-export.zip',
        title: 'Save Export ZIP'
      })
      if (result.canceled) return { canceled: true }
      await exportToZip(injectedHtml, gameDir, projectDir, result.filePath!)
      shell.showItemInFolder(result.filePath!)
      return { success: true, path: result.filePath }
    }
  }
)

async function exportToZip(
  injectedHtml: string,
  gameDir: string,
  projectDir: string,
  zipPath: string
) {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    // Add all game resources
    archive.directory(gameDir, false)
    // Overwrite index.html with injected version
    archive.append(injectedHtml, { name: 'index.html' })
    // Add project assets
    const assetsDir = path.join(projectDir, 'assets')
    if (fs.existsSync(assetsDir)) archive.directory(assetsDir, 'assets')
    archive.finalize()
  })
}
