import { useCallback } from 'react'
import { AnyAppData, ProjectMeta } from '../types'
import { getHistoryArray } from '../utils/historyUtils'
import { buildProjectFile } from '../utils/projectFileUtils'

export interface ProjectActionsOptions {
  meta: ProjectMeta | null
  appData: AnyAppData
  getHistory: () => { data: AnyAppData }[]
  onSnack: (msg: string, severity?: 'success' | 'error' | 'info') => void
}

export interface SaveAsResult {
  filePath: string
  projectDir: string
}

/**
 * Hook for project file operations (save, saveAs, export, preview, rename).
 * Extracted from ProjectPage to reduce component complexity.
 */
export function useProjectActions({
  meta,
  appData,
  getHistory,
  onSnack
}: ProjectActionsOptions) {
  // ── Save ─────────────────────────────────────────────────────────────────────
  const doSave = useCallback(async (currentMeta: ProjectMeta): Promise<void> => {
    const file = buildProjectFile(currentMeta, appData)
    const history = getHistoryArray(getHistory())
    await window.electronAPI.saveProject(file, currentMeta.filePath, history)
  }, [appData, getHistory])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!meta) return
    try {
      await doSave(meta)
      onSnack('Project saved!')
    } catch (e) {
      onSnack(`Save failed: ${e}`, 'error')
    }
  }, [meta, doSave, onSnack])

  // ── Save As ──────────────────────────────────────────────────────────────────
  const performSaveAs = useCallback(
    async (folder: string): Promise<SaveAsResult | null> => {
      if (!meta) return null
      try {
        const history = getHistoryArray(getHistory())
        const newLoc = await window.electronAPI.doSaveAs({
          projectData: buildProjectFile(meta, appData),
          oldProjectDir: meta.projectDir,
          newFolder: folder,
          history
        })
        onSnack(`Saved to: ${newLoc.projectDir}`)
        return newLoc
      } catch (e) {
        onSnack(`Save As failed: ${e}`, 'error')
        return null
      }
    },
    [meta, appData, getHistory, onSnack]
  )

  const handleSaveAs = useCallback(async (): Promise<
    | { status: 'has-project' | 'non-empty'; folder: string }
    | { status: 'success'; folder: string }
    | null
  > => {
    if (!meta) return null
    const result = await window.electronAPI.saveProjectAs({
      projectData: buildProjectFile(meta, appData),
      oldProjectDir: meta.projectDir
    })
    if (!result) return null
    if (result.status === 'has-project' || result.status === 'non-empty') {
      if (result.status === 'non-empty') {
        onSnack('That folder already has files — choose an empty one.', 'info')
      }
      return { status: result.status, folder: result.folder }
    }
    // For 'empty-folder' status, we need to perform the actual save
    const saved = await performSaveAs(result.folder)
    if (saved) {
      return { status: 'success', folder: result.folder }
    }
    return null
  }, [meta, buildProjectFile, onSnack, performSaveAs])

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = useCallback(
    async (mode: 'folder' | 'zip'): Promise<void> => {
      if (!meta) return
      try {
        const result = await window.electronAPI.exportProject({
          templateId: meta.templateId,
          appData,
          projectDir: meta.projectDir,
          mode
        })
        if (!result.canceled) {
          onSnack(`Exported to: ${result.path}`)
        }
      } catch (e) {
        onSnack(`Export failed: ${e}`, 'error')
      }
    },
    [meta, appData, onSnack]
  )

  // ── Preview ──────────────────────────────────────────────────────────────────
  const handlePreview = useCallback(async (): Promise<void> => {
    if (!meta) return
    try {
      await window.electronAPI.previewProject({
        templateId: meta.templateId,
        appData,
        projectDir: meta.projectDir
      })
      onSnack('Preview opened')
    } catch (e) {
      onSnack(`Preview failed: ${e}`, 'error')
    }
  }, [meta, appData, onSnack])

  // ── Rename ───────────────────────────────────────────────────────────────────
  const handleRename = useCallback(
    async (newName: string): Promise<boolean> => {
      if (!meta || !newName.trim()) return false
      const updated = { ...meta, name: newName.trim() }
      try {
        await doSave(updated)
        return true
      } catch (e) {
        onSnack(`Rename failed: ${e}`, 'error')
        throw e
      }
    },
    [meta, doSave, onSnack]
  )

  return {
    handleSave,
    handleSaveAs,
    performSaveAs,
    handleExport,
    handlePreview,
    handleRename,
    buildProjectFile
  }
}
