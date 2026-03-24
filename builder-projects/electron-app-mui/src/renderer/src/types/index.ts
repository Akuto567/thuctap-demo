// ── Template ──────────────────────────────────────────────────────────────────
export interface GameTemplate {
  id: string
  name: string
  description: string
  gameType: 'group-sort' | 'plane-quiz' | 'balloon-letter-picker' | 'pair-matching' | string
  version: string
  thumbnailUrl: string | null // file:// URL resolved by main process, or null
}

// ── Group Sort ────────────────────────────────────────────────────────────────
export interface GroupSortGroup {
  id: string
  name: string
  imagePath: string | null
}
export interface GroupSortItem {
  id: string
  name: string
  imagePath: string | null
  groupId: string
}
export interface GroupSortAppData {
  groups: GroupSortGroup[]
  items: GroupSortItem[]
  _groupCounter: number
  _itemCounter: number
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export interface QuizAnswer {
  id: string
  text: string
  isCorrect: boolean
}
export interface QuizQuestion {
  id: string
  question: string
  imagePath: string | null
  answers: QuizAnswer[]
  multipleCorrect: boolean
  _answerCounter: number
}
export interface QuizAppData {
  questions: QuizQuestion[]
  _questionCounter: number
}

// ── Balloon Letter Picker ─────────────────────────────────────────────────────
export interface BalloonWord {
  id: string
  word: string
  imageUrl: string // relative path, e.g. './images/words/jump.png'
  hint: string
}
export interface BalloonLetterPickerAppData {
  words: BalloonWord[]
  _wordCounter: number
}

export type AnyAppData =
  | GroupSortAppData
  | QuizAppData
  | BalloonLetterPickerAppData
  | PairMatchingAppData

// ── Pair Matching ─────────────────────────────────────────────────────────────
export interface PairMatchingItem {
  id: string
  imagePath: string | null
  keyword: string
  minPairs?: number | null
}
export interface PairMatchingAppData {
  items: PairMatchingItem[]
  minTotalPairs?: number | null
  cardBackColor?: string
  cardBackImage?: string | null
  _itemCounter: number
}

// ── Settings ──────────────────────────────────────────────────────────────────
export type AutoSaveMode = 'off' | 'on-edit' | 'interval'

export interface GlobalSettings {
  autoSave: { mode: AutoSaveMode; intervalSeconds: number }
  prefillNames: boolean
}
export interface ProjectSettings {
  autoSave?: { mode?: AutoSaveMode; intervalSeconds?: number } | null
  prefillNames?: boolean | null
}
export type ResolvedSettings = GlobalSettings

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  autoSave: { mode: 'on-edit', intervalSeconds: 30 },
  prefillNames: true
}

// ── Recent projects ───────────────────────────────────────────────────────────
export interface RecentProject {
  filePath: string
  projectDir: string
  templateId: string
  templateName: string
  projectName: string
  lastOpened: string // ISO date string
}

// ── Project file ──────────────────────────────────────────────────────────────
export interface ProjectFile {
  version: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  settings?: ProjectSettings | null
  appData: AnyAppData
}

// ── In-memory project state ───────────────────────────────────────────────────
export interface ProjectMeta {
  filePath: string
  projectDir: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  settings?: ProjectSettings | null
}

// ── Electron API ──────────────────────────────────────────────────────────────
export interface ElectronAPI {
  getTemplates: () => Promise<GameTemplate[]>
  checkFolderStatus: (folderPath: string) => Promise<'empty' | 'has-project' | 'non-empty'>
  chooseProjectFolder: () => Promise<string | null>
  openProjectFile: (filePath?: string) => Promise<{ filePath: string; data: ProjectFile } | null>
  saveProject: (data: object, projectPath: string) => Promise<boolean>
  saveProjectAs: (opts: {
    projectData: object
    oldProjectDir: string
  }) => Promise<{ folder: string; status: 'empty' | 'has-project' | 'non-empty' } | null>
  doSaveAs: (opts: {
    projectData: object
    oldProjectDir: string
    newFolder: string
  }) => Promise<{ filePath: string; projectDir: string }>
  pickImage: () => Promise<string | null>
  importImage: (sourcePath: string, projectDir: string, desiredName: string) => Promise<string>
  resolveAssetUrl: (projectDir: string, relativePath: string) => Promise<string>
  settingsReadGlobal: () => Promise<object>
  settingsWriteGlobal: (data: object) => Promise<boolean>
  setTitle: (title: string) => Promise<void>
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => Promise<{ success?: boolean; canceled?: boolean; path?: string }>
  previewProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
  }) => Promise<{ success?: boolean }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
