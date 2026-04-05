import archiver from 'archiver'
import { app, BrowserWindow, dialog, net, protocol, shell } from 'electron'
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import * as fs from 'fs'
import * as path from 'path'
import type { AnyAppData, FolderStatus, GameTemplate, GlobalSettings, ProjectFile } from '../shared'
import { EXPORT_ASSETS_DIR, PROJECT_ASSETS_DIR } from '../shared'
import { prepareAppDataForTemplate } from './gameRegistry'
import { createHandler } from './ipc-handlers'

const isDev = process.env.NODE_ENV === 'development'

// ── Backward Compatibility Flag ──────────────────────────────────────────────
/**
 * When true, asset paths that start with './', 'assets/', or './assets/' will be
 * normalized to just the filename when loading old project files.
 *
 * This ensures that after opening and re-saving, all paths are in the new format.
 *
 * TODO: Remove this flag once all project files have been migrated to the new format.
 */
const ENABLE_BACKWARD_COMPAT_ASSET_PATHS = true

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

function writeSettings(data: object): void {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTemplatesDir(): string {
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

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d)
  }
}

/**
 * Normalizes asset paths in project data by stripping './' and 'assets/' prefixes.
 * This is called when loading old project files to migrate them to the new format.
 * After normalization and re-save, paths will be stored as just filenames.
 */
function normalizeAssetPathsInProject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map((item) => normalizeAssetPathsInProject(item))
  if (typeof obj !== 'object') return obj

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    const isImageKey = /(img|image|src|path|url|background)/.test(lowerKey)

    if (isImageKey && typeof value === 'string' && ENABLE_BACKWARD_COMPAT_ASSET_PATHS) {
      let normalized = value

      // Strip leading './' if present
      if (normalized.startsWith('./')) {
        normalized = normalized.slice(2)
      }

      // Strip 'assets/' prefix if present (handles both 'assets/' and './assets/' after ./ stripped)
      const assetsPrefix = PROJECT_ASSETS_DIR + '/'
      if (normalized.startsWith(assetsPrefix)) {
        normalized = normalized.slice(assetsPrefix.length)
      }

      result[key] = normalized
    } else {
      result[key] = normalizeAssetPathsInProject(value)
    }
  }

  return result
}

function resolveAssetRelativePath(key: string, value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value) return null

  const lowerKey = key.toLowerCase()
  const isImageKey = /(img|image|src|path|url|background)/.test(lowerKey)
  if (!isImageKey) return null

  // New format: just the filename (no directory separators)
  // This is a valid asset reference if it doesn't contain path separators
  // and looks like a file (has an extension)
  const hasPathSeparator = value.includes('/') || value.includes('\\')
  if (!hasPathSeparator && path.extname(value)) {
    return value
  }

  return null
}

/** Recursively collect all values of keys named 'imagePath' or 'imageUrl' that reference assets/ */
function collectUsedAssets(obj: unknown, out = new Set<string>()): Set<string> {
  if (!obj || typeof obj !== 'object') return out

  if (Array.isArray(obj)) {
    obj.forEach((v) => collectUsedAssets(v, out))
    return out
  }

  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const rel = resolveAssetRelativePath(k, v)
    if (rel) {
      out.add(rel)
    } else {
      collectUsedAssets(v, out)
    }
  }

  return out
}

/** Collect used assets from current state and all history states */
function collectUsedAssetsWithHistory(currentData: object, history?: object[]): Set<string> {
  const used = collectUsedAssets(currentData)

  if (history) {
    // Include assets from all history states
    for (const state of history) {
      collectUsedAssets(state, used)
    }
  }

  return used
}

/** Delete files in <projectDir>/assets/ that are not in the used set */
function purgeUnusedAssets(projectDir: string, projectData: object, history?: object[]): void {
  const assetsDir = path.join(projectDir, PROJECT_ASSETS_DIR)
  if (!fs.existsSync(assetsDir)) return

  const usedPaths = collectUsedAssetsWithHistory(projectData, history)
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

/** Copy only used assets to a destination directory */
function copyUsedAssetsOnly(projectDir: string, destDir: string, projectData: object): void {
  const srcAssetsDir = path.join(projectDir, PROJECT_ASSETS_DIR)
  const destAssetsDir = path.join(destDir, EXPORT_ASSETS_DIR)

  if (!fs.existsSync(srcAssetsDir)) return

  const usedPaths = collectUsedAssets(projectData)
  const usedFiles = new Set([...usedPaths].map((p) => path.basename(p)))

  // Create destination assets directory
  fs.mkdirSync(destAssetsDir, { recursive: true })

  // Copy only used files
  for (const file of fs.readdirSync(srcAssetsDir)) {
    if (usedFiles.has(file)) {
      fs.copyFileSync(path.join(srcAssetsDir, file), path.join(destAssetsDir, file))
    }
  }
}

function injectAppData(html: string, appData: object): string {
  const scriptTag = `<script>window.APP_DATA = ${JSON.stringify(appData)};window.MY_APP_DATA=window.APP_DATA;window.win={DATA:window.APP_DATA}</script>`
  return html.replace(/<script/, `${scriptTag}\n<script`)
}

function normalizeAssetPaths(obj: unknown, projectDir: string): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map((item) => normalizeAssetPaths(item, projectDir))
  if (typeof obj !== 'object') return obj

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const rel = resolveAssetRelativePath(key, value)

    if (rel) {
      // rel is the filename (extracted from old or new format), prepend PROJECT_ASSETS_DIR
      const absPath = path.join(projectDir, PROJECT_ASSETS_DIR, rel)
      result[key] = `file://${absPath.split(path.sep).join('/')}`
      continue
    }

    result[key] = normalizeAssetPaths(value, projectDir)
  }

  return result
}

/**
 * Resolves asset paths for export by prepending the export assets directory.
 * Project files store only filenames (normalized at load time),
 * but the exported game expects assets to be in assets/user/<filename>.
 */
function resolveAssetPathsForExport(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map((item) => resolveAssetPathsForExport(item))
  if (typeof obj !== 'object') return obj

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const rel = resolveAssetRelativePath(key, value)

    if (rel) {
      // rel is the filename, prepend EXPORT_ASSETS_DIR for the exported game
      result[key] = `${EXPORT_ASSETS_DIR}/${rel}`
      continue
    }

    result[key] = resolveAssetPathsForExport(value)
  }

  return result
}

// Register the protocol early
// Note: This only needs to be done ONCE in your main entry point
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'preview-project',
    privileges: { standard: true /* , secure: true, supportFetchAPI: true */ }
  }
])

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow(): void {
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

const projectPreviewSessions = new Map<string, { html: string; gameDir: string }>()

app.whenReady().then(() => {
  protocol.handle('preview-project', async (request) => {
    console.log(`Protocol request received:`, request.url)
    console.log(`Available sessions:`, Array.from(projectPreviewSessions.keys()))

    const url = new URL(request.url)
    const sessionId = url.hostname // e.g., session-12345
    const pathName = url.pathname // e.g., /index.html or /css/style.css

    const session = projectPreviewSessions.get(sessionId)
    if (!session) return new Response('Session expired', { status: 404 })

    // Serve HTML from memory
    if (pathName === '/' || pathName === '/index.html') {
      console.log(`Serving HTML from memory: ${pathName}`)
      return new Response(session.html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Serve assets from the specific directory saved for THIS session
    const filePath = path.join(session.gameDir, pathName)
    console.log(`Serving assets from filePath: ${filePath}`)
    return net.fetch(`file://${filePath}`)
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  if (isDev) {
    const extensions = [REACT_DEVELOPER_TOOLS]
    console.log('Installing extensions', extensions)
    installExtension(extensions, { loadExtensionOptions: { allowFileAccess: true } })
      .then((exts) => console.log(`Added Extensions:`, exts))
      .catch((err) => console.log('An error occurred Adding Extensions: ', err))
  }
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Templates ────────────────────────────────────────────────────────────
createHandler('get-templates', async () => {
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
    .filter(Boolean) as GameTemplate[]
})

// ── IPC: Project management ───────────────────────────────────────────────────
createHandler('check-folder-status', async (_e, folderPath: string) =>
  checkFolderStatus(folderPath)
)

createHandler('choose-project-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose Project Save Location'
  })
  return result.canceled ? null : result.filePaths[0]
})

createHandler('open-project-file', async (_e, filePath?: string) => {
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
  const projectFile = JSON.parse(content) as ProjectFile

  // Normalize asset paths in appData (strip './' and 'assets/' prefixes)
  // This migrates old project files to the new format on load
  const normalizedAppData = normalizeAssetPathsInProject(projectFile.appData) as AnyAppData

  return { filePath: resolved, data: { ...projectFile, appData: normalizedAppData } } as {
    filePath: string
    data: ProjectFile
  }
})

createHandler('save-project', async (_e, projectData: object, projectPath: string, history) => {
  const normalized = normalizeAssetPathsInProject(projectData) as object
  fs.writeFileSync(projectPath, JSON.stringify(normalized, null, 2), 'utf-8')
  purgeUnusedAssets(path.dirname(projectPath), normalized, history)
  return true
})

/** Save As: pick folder, copy assets, write file. Returns new paths or null if canceled. */
createHandler('save-project-as', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Save Project As — Choose New Folder'
  })
  if (result.canceled) return null

  const newFolder = result.filePaths[0]
  const status = checkFolderStatus(newFolder)
  // Return status so renderer can confirm overwrite if needed
  return { folder: newFolder, status } as { folder: string; status: FolderStatus }
})

/** Actually perform the save-as copy after the renderer has confirmed */
createHandler(
  'do-save-as',
  async (
    _e,
    opts: {
      projectData: object
      oldProjectDir: string
      newFolder: string
      history?: object[]
    }
  ) => {
    const { projectData, oldProjectDir, newFolder, history } = opts

    // Copy assets from old location
    const oldAssets = path.join(oldProjectDir, PROJECT_ASSETS_DIR)
    if (fs.existsSync(oldAssets)) copyDirSync(oldAssets, path.join(newFolder, PROJECT_ASSETS_DIR))

    // Write project file
    const newFilePath = path.join(newFolder, 'project.mgproj')
    fs.writeFileSync(newFilePath, JSON.stringify(projectData, null, 2), 'utf-8')
    purgeUnusedAssets(newFolder, projectData, history)

    return { filePath: newFilePath, projectDir: newFolder }
  }
)

// ── IPC: Assets ───────────────────────────────────────────────────────────────
createHandler('pick-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
    title: 'Select Image'
  })
  return result.canceled ? null : result.filePaths[0]
})

createHandler(
  'import-image',
  async (_e, sourcePath: string, projectDir: string, desiredNamePrefix: string) => {
    const assetsDir = path.join(projectDir, PROJECT_ASSETS_DIR)
    fs.mkdirSync(assetsDir, { recursive: true })
    const ext = path.extname(sourcePath).toLowerCase()
    const uniqueName = `${desiredNamePrefix}-${Date.now()}-${Math.random()}`
    const destName = `${uniqueName}${ext}`
    fs.copyFileSync(sourcePath, path.join(assetsDir, destName))
    // Store only the filename - the 'assets/' prefix is added by the renderer/main process
    return destName
  }
)

createHandler('resolve-asset-url', async (_e, projectDir: string, relativePath: string) => {
  // relativePath is just the filename (normalized at project load time)
  const abs = path.join(projectDir, PROJECT_ASSETS_DIR, relativePath)
  return `file://${abs.replace(/\\/g, '/')}`
})

// ── IPC: Settings ─────────────────────────────────────────────────────────────
createHandler('settings-read-global', async () => readSettings() as unknown as GlobalSettings)
createHandler('settings-write-global', async (_e, data: GlobalSettings) => {
  writeSettings(data)
  return true
})

// ── IPC: Window title ─────────────────────────────────────────────────────────
createHandler('set-title', async (_e, title: string) => {
  mainWindow?.setTitle(title)
})

// ── IPC: Preview ─────────────────────────────────────────────────────────────
createHandler('preview-project', async (_, opts) => {
  const { templateId, appData, projectDir } = opts
  const gameDir = getGameDir(templateId)
  const htmlPath = path.join(gameDir, 'index.html')

  if (!fs.existsSync(htmlPath)) throw new Error('Template not found')

  const sanitizedData = normalizeAssetPaths(normalizeAssetPathsInProject(appData), projectDir)
  const templateData = prepareAppDataForTemplate(templateId, sanitizedData as AnyAppData)
  const injectedHtml = injectAppData(fs.readFileSync(htmlPath, 'utf-8'), templateData)

  // Unique ID for this specific window instance
  const sessionId = `session-${Date.now()}-${crypto.randomUUID()}`

  const devInjectedHtml = injectedHtml.replace(
    '</body>',
    `<script>
    window.__PREVIEW_DEBUG__ = ${JSON.stringify({
      sessionId,
      templateId,
      gameDir,
      projectDir,
      timestamp: Date.now(),
      appData
    })}
    </script>
    </body>`
  )

  // Save both the content AND the path so the protocol knows where to look for assets
  projectPreviewSessions.set(sessionId, {
    html: devInjectedHtml,
    gameDir: gameDir
  })

  const previewWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    webPreferences: {
      contextIsolation: true,
      webSecurity: false // Required to let preview-project:// load file:// assets
    }
  })

  if (isDev) {
    previewWindow.webContents.openDevTools()
  }

  previewWindow.loadURL(`preview-project://${sessionId}/index.html`)

  previewWindow.on('closed', () => {
    projectPreviewSessions.delete(sessionId)
  })

  return { success: true }
})

// ── IPC: Export ───────────────────────────────────────────────────────────────
createHandler(
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

    // Resolve asset paths for export (prepends assets/user/ to filenames)
    const exportedAppData = resolveAssetPathsForExport(
      normalizeAssetPathsInProject(appData)
    ) as object
    const templateData = prepareAppDataForTemplate(templateId, exportedAppData)
    const injectedHtml = injectAppData(fs.readFileSync(htmlPath, 'utf-8'), templateData)

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
      // Copy only used project assets (not all assets)
      copyUsedAssetsOnly(projectDir, destDir, appData)
      shell.openPath(destDir)
      return { success: true, path: destDir }
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        defaultPath: 'game-export.zip',
        title: 'Save Export ZIP'
      })
      if (result.canceled) return { canceled: true }
      await exportToZip(injectedHtml, gameDir, projectDir, appData, result.filePath!)
      shell.showItemInFolder(result.filePath!)
      return { success: true, path: result.filePath }
    }
  }
)

async function exportToZip(
  injectedHtml: string,
  gameDir: string,
  projectDir: string,
  appData: object,
  zipPath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    // Add all game resources except root index.html
    archive.directory(gameDir, false, (entry) => {
      // Only exclude index.html at the root level
      if (entry.name === 'index.html') return false
      return entry
    })
    // Add injected index.html
    archive.append(injectedHtml, { name: 'index.html' })
    // Add only used project assets (not all assets)
    const srcAssetsDir = path.join(projectDir, PROJECT_ASSETS_DIR)
    if (fs.existsSync(srcAssetsDir)) {
      const usedPaths = collectUsedAssets(appData)
      const usedFiles = new Set([...usedPaths].map((p) => path.basename(p)))
      // Add each used file individually to assets/user/
      for (const file of usedFiles) {
        const filePath = path.join(srcAssetsDir, file)
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: path.posix.join(EXPORT_ASSETS_DIR, file) })
        }
      }
    }
    archive.finalize()
  })
}
