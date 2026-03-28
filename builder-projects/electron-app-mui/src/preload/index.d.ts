/**
 * Preload Script Type Definitions
 *
 * Re-exports types from the shared module and defines the ElectronAPI interface
 * that is exposed to the renderer process via contextBridge.
 */

import type {
  GameTemplate,
  FolderStatus,
  ProjectFile,
  GlobalSettings,
  AnyAppData
} from '../shared'

export interface ElectronAPI {
  // Templates
  getTemplates: () => Promise<GameTemplate[]>

  // Project management
  checkFolderStatus: (folderPath: string) => Promise<FolderStatus>
  chooseProjectFolder: () => Promise<string | null>
  openProjectFile: (filePath?: string) => Promise<{ filePath: string; data: ProjectFile } | null>
  saveProject: (data: object, projectPath: string) => Promise<boolean>
  saveProjectAs: (opts: {
    projectData: object
    oldProjectDir: string
  }) => Promise<{ folder: string; status: FolderStatus } | null>
  doSaveAs: (opts: {
    projectData: object
    oldProjectDir: string
    newFolder: string
  }) => Promise<{ filePath: string; projectDir: string }>

  // Assets
  pickImage: () => Promise<string | null>
  importImage: (sourcePath: string, projectDir: string, desiredNamePrefix: string) => Promise<string>
  resolveAssetUrl: (projectDir: string, relativePath: string) => Promise<string>

  // Settings
  settingsReadGlobal: () => Promise<GlobalSettings>
  settingsWriteGlobal: (data: GlobalSettings) => Promise<boolean>

  // Window
  setTitle: (title: string) => Promise<void>

  // Preview
  previewProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
  }) => Promise<{ success: boolean }>

  // Export
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => Promise<{ success?: boolean; canceled?: boolean; path?: string }>

  // File utilities
  getPathForFile: (file: File) => string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
