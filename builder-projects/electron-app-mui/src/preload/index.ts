/**
 * Preload Script
 *
 * Exposes typed IPC methods to the renderer process via contextBridge.
 * Uses centralized channel definitions from the shared module for type safety.
 */

import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  IPCChannelDefinitions,
  IPCReturn,
  RendererInvokeArgs,
  GlobalSettings
} from '../shared'

/**
 * Type-safe IPC renderer wrapper.
 * Provides methods to invoke IPC handlers with full type inference.
 *
 * Note: The IpcMainInvokeEvent parameter is automatically provided by Electron
 * and should NOT be passed when invoking from the renderer.
 */
const typedIpcRenderer = {
  /**
   * Invoke an IPC handler with type-safe arguments and return type.
   *
   * @param channel - The IPC channel name (type-safe, autocomplete enabled)
   * @param args - Arguments to pass to the handler (excludes IpcMainInvokeEvent)
   * @returns Promise resolving to the handler's return value (type-safe)
   */
  invoke: <T extends keyof IPCChannelDefinitions>(
    channel: T,
    ...args: RendererInvokeArgs<T>
  ): IPCReturn<T> => {
    return ipcRenderer.invoke(channel, ...args) as IPCReturn<T>
  }
}

// Expose the Electron API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Templates
  getTemplates: () => typedIpcRenderer.invoke('get-templates'),

  // Project management
  checkFolderStatus: (folderPath: string) =>
    typedIpcRenderer.invoke('check-folder-status', folderPath),
  chooseProjectFolder: () => typedIpcRenderer.invoke('choose-project-folder'),
  openProjectFile: (filePath?: string) => typedIpcRenderer.invoke('open-project-file', filePath),
  saveProject: (data: object, projectPath: string) =>
    typedIpcRenderer.invoke('save-project', data, projectPath),
  saveProjectAs: (opts: { projectData: object; oldProjectDir: string }) =>
    typedIpcRenderer.invoke('save-project-as', opts),
  doSaveAs: (opts: { projectData: object; oldProjectDir: string; newFolder: string }) =>
    typedIpcRenderer.invoke('do-save-as', opts),

  // Assets
  pickImage: () => typedIpcRenderer.invoke('pick-image'),
  importImage: (sourcePath: string, projectDir: string, desiredNamePrefix: string) =>
    typedIpcRenderer.invoke('import-image', sourcePath, projectDir, desiredNamePrefix),
  resolveAssetUrl: (projectDir: string, relativePath: string) =>
    typedIpcRenderer.invoke('resolve-asset-url', projectDir, relativePath),

  // Settings
  settingsReadGlobal: () => typedIpcRenderer.invoke('settings-read-global'),
  settingsWriteGlobal: (data: GlobalSettings) => typedIpcRenderer.invoke('settings-write-global', data),

  // Window
  setTitle: (title: string) => typedIpcRenderer.invoke('set-title', title),

  // Preview
  previewProject: (opts: { templateId: string; appData: object; projectDir: string }) =>
    typedIpcRenderer.invoke('preview-project', opts),

  // Export
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => typedIpcRenderer.invoke('export-project', opts),

  // File utilities
  getPathForFile: (file: File) => webUtils.getPathForFile(file)
})
