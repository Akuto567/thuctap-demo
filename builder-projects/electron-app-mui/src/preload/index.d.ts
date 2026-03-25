export interface ElectronAPI {
  getTemplates: () => Promise<import('../renderer/src/types').GameTemplate[]>
  checkFolderStatus: (folderPath: string) => Promise<'empty' | 'has-project' | 'non-empty'>
  chooseProjectFolder: () => Promise<string | null>
  openProjectFile: (
    filePath?: string
  ) => Promise<{ filePath: string; data: import('../renderer/src/types').ProjectFile } | null>
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
  }) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
