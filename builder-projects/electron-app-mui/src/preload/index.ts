import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  checkFolderStatus: (folderPath: string) => ipcRenderer.invoke('check-folder-status', folderPath),
  chooseProjectFolder: () => ipcRenderer.invoke('choose-project-folder'),
  openProjectFile: (filePath?: string) => ipcRenderer.invoke('open-project-file', filePath),
  saveProject: (data: object, projectPath: string) =>
    ipcRenderer.invoke('save-project', data, projectPath),
  saveProjectAs: (opts: { projectData: object; oldProjectDir: string }) =>
    ipcRenderer.invoke('save-project-as', opts),
  doSaveAs: (opts: { projectData: object; oldProjectDir: string; newFolder: string }) =>
    ipcRenderer.invoke('do-save-as', opts),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  importImage: (sourcePath: string, projectDir: string, desiredName: string) =>
    ipcRenderer.invoke('import-image', sourcePath, projectDir, desiredName),
  resolveAssetUrl: (projectDir: string, relativePath: string) =>
    ipcRenderer.invoke('resolve-asset-url', projectDir, relativePath),
  settingsReadGlobal: () => ipcRenderer.invoke('settings-read-global'),
  settingsWriteGlobal: (data: object) => ipcRenderer.invoke('settings-write-global', data),
  setTitle: (title: string) => ipcRenderer.invoke('set-title', title),
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => ipcRenderer.invoke('export-project', opts),
  previewProject: (opts: { templateId: string; appData: object; projectDir: string }) =>
    ipcRenderer.invoke('preview-project', opts)
})
