/**
 * Shared Types Module
 *
 * This module contains type definitions that are shared between the main process,
 * preload script, and renderer process. This ensures type safety across all three
 * layers without duplicating type definitions.
 *
 * Key exports:
 * - IPC_CHANNEL_DEFINITIONS: Maps channel names to their handler function signatures
 * - IPCChannels: Type-safe channel name constants
 * - AppData types for all game templates
 */

// ── AppData Types ─────────────────────────────────────────────────────────────
// These types are used by both main process (for transforms) and renderer (for editors)

// Group Sort
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

// Quiz (Plane Quiz)
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

// Balloon Letter Picker
export interface BalloonWord {
  id: string
  word: string
  imagePath: string
  hint: string
}
export interface BalloonLetterPickerAppData {
  words: BalloonWord[]
  _wordCounter: number
}

// Pair Matching
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

// Word Search
export interface WordSearchItem {
  id: string
  word: string
  imagePath: string | null
}
export interface WordSearchAppData {
  items: WordSearchItem[]
  backgroundImagePath?: string | null
  _itemCounter: number
}

// Whack-a-Mole
export interface WhackAMoleQuestion {
  id: string
  question: string
  questionImage: string | null
  answerText: string
  answerImage: string | null
}
export interface WhackAMoleAppData {
  questions: WhackAMoleQuestion[]
  _questionCounter: number
}

// Union type for any game's AppData
export type AnyAppData =
  | GroupSortAppData
  | QuizAppData
  | BalloonLetterPickerAppData
  | PairMatchingAppData
  | WordSearchAppData
  | WhackAMoleAppData

// Map of game type to its AppData type (for generic lookups)
export interface GameAppDataMap {
  'group-sort': GroupSortAppData
  'plane-quiz': QuizAppData
  'balloon-letter-picker': BalloonLetterPickerAppData
  'pair-matching': PairMatchingAppData
  'word-search': WordSearchAppData
  'whack-a-mole': WhackAMoleAppData
}

// ── Other Shared Types ────────────────────────────────────────────────────────

export interface GameTemplate {
  id: string
  name: string
  description: string
  gameType: string
  version: string
  thumbnailUrl: string | null
}

export type AutoSaveMode = 'off' | 'on-edit' | 'interval'

export interface GlobalSettings {
  autoSave: { mode: AutoSaveMode; intervalSeconds: number }
  prefillNames: boolean
  // Allow additional properties to be stored in settings
  [key: string]: unknown
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  autoSave: { mode: 'on-edit', intervalSeconds: 30 },
  prefillNames: true
}

export interface ProjectSettings {
  autoSave?: { mode?: AutoSaveMode; intervalSeconds?: number } | null
  prefillNames?: boolean | null
}

/**
 * ResolvedSettings is the result of merging GlobalSettings with ProjectSettings.
 * Project settings override global settings.
 */
export interface ResolvedSettings {
  autoSave: { mode: AutoSaveMode; intervalSeconds: number }
  prefillNames: boolean
}

export interface RecentProject {
  filePath: string
  projectDir: string
  templateId: string
  templateName: string
  projectName: string
  lastOpened: string
}

export interface ProjectFile {
  version: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  settings?: ProjectSettings | null
  appData: AnyAppData
}

export interface ProjectMeta {
  filePath: string
  projectDir: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  settings?: ProjectSettings | null
}

export type FolderStatus = 'empty' | 'has-project' | 'non-empty'

// ── IPC Channel Definitions ───────────────────────────────────────────────────
// Define all IPC channels with their handler function signatures in one place
// This eliminates the need to duplicate types between main, preload, and renderer
//
// Note: Handler signatures include the IpcMainInvokeEvent parameter for the main process.
// The renderer process does NOT pass this event - it's automatically provided by Electron.

import type { IpcMainInvokeEvent } from 'electron'

/**
 * IPC Channel Definitions
 *
 * Each channel is defined with its MAIN PROCESS handler signature.
 * The first parameter is always IpcMainInvokeEvent (automatically provided by Electron).
 *
 * When invoking from the renderer, omit the event parameter.
 * Example:
 *   // Main process:
 *   createHandler('check-folder-status', (event, folderPath) => { ... })
 *
 *   // Renderer process:
 *   window.electronAPI.checkFolderStatus(folderPath)
 */
export interface IPCChannelDefinitions {
  // Templates
  'get-templates': {
    handler: () => Promise<GameTemplate[]>
  }

  // Project management
  'check-folder-status': {
    handler: (event: IpcMainInvokeEvent, folderPath: string) => Promise<FolderStatus>
  }
  'choose-project-folder': {
    handler: (event: IpcMainInvokeEvent) => Promise<string | null>
  }
  'open-project-file': {
    handler: (
      event: IpcMainInvokeEvent,
      filePath?: string
    ) => Promise<{ filePath: string; data: ProjectFile } | null>
  }
  'save-project': {
    handler: (event: IpcMainInvokeEvent, data: object, projectPath: string) => Promise<boolean>
  }
  'save-project-as': {
    handler: (
      event: IpcMainInvokeEvent,
      opts: { projectData: object; oldProjectDir: string }
    ) => Promise<{
      folder: string
      status: FolderStatus
    } | null>
  }
  'do-save-as': {
    handler: (
      event: IpcMainInvokeEvent,
      opts: {
        projectData: object
        oldProjectDir: string
        newFolder: string
      }
    ) => Promise<{ filePath: string; projectDir: string }>
  }

  // Assets
  'pick-image': {
    handler: (event: IpcMainInvokeEvent) => Promise<string | null>
  }
  'import-image': {
    handler: (
      event: IpcMainInvokeEvent,
      sourcePath: string,
      projectDir: string,
      desiredNamePrefix: string
    ) => Promise<string>
  }
  'resolve-asset-url': {
    handler: (
      event: IpcMainInvokeEvent,
      projectDir: string,
      relativePath: string
    ) => Promise<string>
  }

  // Settings
  'settings-read-global': {
    handler: (event: IpcMainInvokeEvent) => Promise<GlobalSettings>
  }
  'settings-write-global': {
    handler: (event: IpcMainInvokeEvent, data: GlobalSettings) => Promise<boolean>
  }

  // Window
  'set-title': {
    handler: (event: IpcMainInvokeEvent, title: string) => Promise<void>
  }

  // Preview
  'preview-project': {
    handler: (
      event: IpcMainInvokeEvent,
      opts: {
        templateId: string
        appData: object
        projectDir: string
      }
    ) => Promise<{ success: boolean }>
  }

  // Export
  'export-project': {
    handler: (
      event: IpcMainInvokeEvent,
      opts: {
        templateId: string
        appData: object
        projectDir: string
        mode: 'folder' | 'zip'
      }
    ) => Promise<{ success?: boolean; canceled?: boolean; path?: string }>
  }
}

/**
 * Extract the renderer-side invoke arguments for a channel.
 * Removes the IpcMainInvokeEvent parameter from the handler signature.
 */
export type RendererInvokeArgs<T extends keyof IPCChannelDefinitions> =
  IPCChannelDefinitions[T]['handler'] extends (
    event: IpcMainInvokeEvent,
    ...args: infer U
  ) => unknown
    ? U
    : IPCChannelDefinitions[T]['handler'] extends () => unknown
      ? []
      : Parameters<IPCChannelDefinitions[T]['handler']>

// Type helper to extract the handler function type for a channel
export type IPCHandler<T extends keyof IPCChannelDefinitions> = IPCChannelDefinitions[T]['handler']

// Type helper to extract the return type of an IPC handler
export type IPCReturn<T extends keyof IPCChannelDefinitions> = ReturnType<IPCHandler<T>>

// Type-safe channel names (autocomplete + type checking)
export const IPCChannels = {
  getTemplates: 'get-templates' as const,
  checkFolderStatus: 'check-folder-status' as const,
  chooseProjectFolder: 'choose-project-folder' as const,
  openProjectFile: 'open-project-file' as const,
  saveProject: 'save-project' as const,
  saveProjectAs: 'save-project-as' as const,
  doSaveAs: 'do-save-as' as const,
  pickImage: 'pick-image' as const,
  importImage: 'import-image' as const,
  resolveAssetUrl: 'resolve-asset-url' as const,
  settingsReadGlobal: 'settings-read-global' as const,
  settingsWriteGlobal: 'settings-write-global' as const,
  setTitle: 'set-title' as const,
  previewProject: 'preview-project' as const,
  exportProject: 'export-project' as const
} as const

export type IPCChannelName = keyof IPCChannelDefinitions
