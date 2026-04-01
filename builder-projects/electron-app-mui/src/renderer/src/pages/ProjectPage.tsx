import { Box, Button, Typography } from '@mui/material'
import { useSettings } from '@renderer/hooks/useSettings'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  BackConfirmDialog,
  ExportMenu,
  ProjectSnackbar,
  RenameDialog,
  SaveAsConfirmDialog
} from '../components/project/ProjectDialogs'
import { ProjectToolbar } from '../components/project/ProjectToolbar'
import SettingsPanel from '../components/SettingsPanel'
import { ProjectHistoryProvider, useProjectHistory } from '../context/ProjectHistoryContext'
import { useSnackbar } from '../hooks'
import { useProjectShortcuts } from '../hooks/useProjectShortcuts'
import { useTemplateManager } from '../hooks/useTemplates'
import { AnyAppData, ProjectFile, ProjectMeta } from '../types'
import { getHistoryArray } from '../utils/historyUtils'
import { buildProjectFile, buildProjectTitle } from '../utils/projectFileUtils'

// ── Constants ────────────────────────────────────────────────────────────────
const AUTO_SAVE_DEBOUNCE_MS = 1000

// ── Inner Component (uses history) ───────────────────────────────────────────
interface ProjectPageInnerProps {
  templateId: string
  locationState: {
    filePath: string
    projectDir: string
    data: ProjectFile
  } | null
}

function ProjectPageInner({ templateId, locationState }: ProjectPageInnerProps): JSX.Element {
  const navigate = useNavigate()
  const { resolved, setProjectSettings } = useSettings()
  const manager = useTemplateManager()

  // Split project state: meta (file location, name) is separate from app data (game content)
  const [meta, setMeta] = useState<ProjectMeta | null>(
    locationState
      ? {
          filePath: locationState.filePath,
          projectDir: locationState.projectDir,
          templateId: locationState.data.templateId,
          name: locationState.data.name,
          createdAt: locationState.data.createdAt,
          updatedAt: locationState.data.updatedAt,
          settings: locationState.data.settings
        }
      : null
  )
  const [isDirty, setIsDirty] = useState(false)

  const {
    present: appData,
    setPresent,
    undo: historyUndo,
    redo: historyRedo,
    getHistory,
    canUndo,
    canRedo
  } = useProjectHistory()

  // Snackbar hook
  const { message: snackMsg, severity: snackSeverity, showSnack, hideSnack } = useSnackbar()

  // Wrapped undo/redo that marks document as dirty
  const handleUndo = useCallback(() => {
    historyUndo()
    setIsDirty(true)
  }, [historyUndo])

  const handleRedo = useCallback(() => {
    historyRedo()
    setIsDirty(true)
  }, [historyRedo])

  // Sync project settings to context
  useEffect(() => {
    setProjectSettings(locationState?.data?.settings ?? null)
    return () => setProjectSettings(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (meta?.settings !== undefined) setProjectSettings(meta.settings ?? null)
  }, [meta?.settings, setProjectSettings])

  // Update window title whenever meta or appData changes
  useEffect(() => {
    if (!meta || !templateId) return
    const template = manager.getTemplate(templateId)
    const tName = template?.name ?? templateId
    const title = buildProjectTitle(tName, meta.name, meta.filePath)
    document.title = title
    window.electronAPI.setTitle(title)
  }, [meta, templateId, manager])

  // UI state
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [backConfirm, setBackConfirm] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveAsConfirmFolder, setSaveAsConfirmFolder] = useState<string | null>(null)

  // ── Refs for auto-save ─────────────────────────────────────────────────────
  const onEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const metaRef = useRef(meta)
  const appDataRef = useRef(appData)
  const isDirtyRef = useRef(isDirty)

  // Keep refs in sync - update synchronously to avoid stale closures
  metaRef.current = meta
  appDataRef.current = appData
  isDirtyRef.current = isDirty

  // ── Save ─────────────────────────────────────────────────────────────────
  const doSave = useCallback(async (currentMeta: ProjectMeta, appDataToSave: AnyAppData) => {
    const file = buildProjectFile(currentMeta, appDataToSave)
    const history = getHistoryArray(getHistory())
    await window.electronAPI.saveProject(file, currentMeta.filePath, history)
    setIsDirty(false)
  }, [getHistory])

  const performSaveAs = useCallback(
    async (folder: string): Promise<void> => {
      if (!meta) return
      try {
        const history = getHistoryArray(getHistory())
        const newLoc = await window.electronAPI.doSaveAs({
          projectData: buildProjectFile(meta, appData),
          oldProjectDir: meta.projectDir,
          newFolder: folder,
          history
        })
        setMeta((prev) =>
          prev ? { ...prev, filePath: newLoc.filePath, projectDir: newLoc.projectDir } : prev
        )
        setIsDirty(false)
        setSaveAsConfirmFolder(null)
        showSnack(`Saved to: ${newLoc.projectDir}`)
      } catch (e) {
        showSnack(`Save As failed: ${e}`, 'error')
      }
    },
    [meta, appData, getHistory, showSnack]
  )

  // ── Auto-save: interval mode ───────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (resolved.autoSave.mode === 'interval') {
      intervalRef.current = setInterval(() => {
        if (isDirtyRef.current && metaRef.current) {
          doSave(metaRef.current, appDataRef.current).catch(() => {
            // Silently fail - user will see dirty indicator
          })
        }
      }, resolved.autoSave.intervalSeconds * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [resolved.autoSave.mode, resolved.autoSave.intervalSeconds, doSave])

  // ── Auto-save: on-edit mode cleanup ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (onEditTimerRef.current) {
        clearTimeout(onEditTimerRef.current)
        onEditTimerRef.current = null
      }
    }
  }, [])

  // ── App data change (from editor) ─────────────────────────────────────────
  const handleAppDataChange = useCallback(
    (newData: AnyAppData) => {
      // Update history state (for undo/redo)
      setPresent(newData)
      
      // Update dirty state
      setIsDirty(true)
      
      // Update refs for auto-save
      appDataRef.current = newData
      isDirtyRef.current = true

      // Auto-save on edit with debounce
      if (resolved.autoSave.mode === 'on-edit') {
        if (onEditTimerRef.current) clearTimeout(onEditTimerRef.current)
        onEditTimerRef.current = setTimeout(() => {
          if (metaRef.current) {
            doSave(metaRef.current, newData).catch(() => {
              // Silently fail - user will see dirty indicator
            })
          }
        }, AUTO_SAVE_DEBOUNCE_MS)
      }
    },
    [setPresent, resolved.autoSave.mode, doSave]
  )

  const handleSave = useCallback(async (): Promise<void> => {
    if (!meta) return
    try {
      await doSave(meta, appData)
      showSnack('Project saved!')
    } catch (e) {
      showSnack(`Save failed: ${e}`, 'error')
    }
  }, [meta, appData, doSave, showSnack])

  // ── Save As ───────────────────────────────────────────────────────────────
  const handleSaveAs = useCallback(async (): Promise<void> => {
    if (!meta) return
    const result = await window.electronAPI.saveProjectAs({
      projectData: buildProjectFile(meta, appData),
      oldProjectDir: meta.projectDir
    })
    if (!result) return
    if (result.status === 'has-project' || result.status === 'non-empty') {
      setSaveAsConfirmFolder(result.status === 'has-project' ? result.folder : null)
      if (result.status === 'non-empty') {
        showSnack('That folder already has files — choose an empty one.', 'info')
        return
      }
    }
    await performSaveAs(result.folder)
  }, [meta, appData, showSnack, performSaveAs])

  // ── Export / Preview ───────────────────────────────────────────────────────
  const handleExport = async (mode: 'folder' | 'zip'): Promise<void> => {
    setExportAnchor(null)
    if (!meta) return
    try {
      const result = await window.electronAPI.exportProject({
        templateId: meta.templateId,
        appData: appData,
        projectDir: meta.projectDir,
        mode
      })
      if (result.canceled) return
      showSnack(`Exported to: ${result.path}`)
    } catch (e) {
      showSnack(`Export failed: ${e}`, 'error')
    }
  }

  const handlePreview = async (): Promise<void> => {
    if (!meta) return
    try {
      await window.electronAPI.previewProject({
        templateId: meta.templateId,
        appData: appData,
        projectDir: meta.projectDir
      })
      showSnack('Preview opened')
    } catch (e) {
      showSnack(`Preview failed: ${e}`, 'error')
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  const handleRename = async (): Promise<void> => {
    if (!meta || !renameValue.trim()) return
    const updated = { ...meta, name: renameValue.trim() }
    setMeta(updated)
    setRenameOpen(false)
    try {
      await doSave(updated, appData)
    } catch (e) {
      setMeta(meta)
      showSnack(`Rename failed: ${e}`, 'error')
      throw e
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useProjectShortcuts({
    onUndo: canUndo ? handleUndo : undefined,
    onRedo: canRedo ? handleRedo : undefined,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onPreview: handlePreview,
    onExportFolder: () => handleExport('folder'),
    onExportZip: () => handleExport('zip')
  })

  if (!meta || !templateId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data. Go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  const template = manager.getTemplate(templateId)
  const templateName = template?.name ?? templateId
  const autoSaveLabel =
    resolved.autoSave.mode === 'off'
      ? null
      : resolved.autoSave.mode === 'on-edit'
        ? 'auto-save: on edit'
        : `auto-save: ${resolved.autoSave.intervalSeconds}s`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <ProjectToolbar
        templateName={templateName}
        projectName={meta.name}
        isDirty={isDirty}
        autoSaveLabel={autoSaveLabel}
        canUndo={canUndo}
        canRedo={canRedo}
        onBack={() => (isDirty ? setBackConfirm(true) : navigate('/'))}
        onRename={() => {
          setRenameValue(meta.name)
          setRenameOpen(true)
        }}
        onSettings={() => setSettingsOpen(true)}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPreview={handlePreview}
        onExport={(e) => setExportAnchor(e.currentTarget)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* ── Editor ── */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {(() => {
          const entry = manager.getRegistryEntry(templateId)
          if (!entry)
            return (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error">
                  No editor registered for game type: {templateId}
                </Typography>
              </Box>
            )
          const { Editor } = entry
          return (
            <Editor appData={appData} projectDir={meta.projectDir} onChange={handleAppDataChange} />
          )
        })()}
      </Box>

      {/* ── Settings panel ── */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} hasProject />

      {/* ── Export menu ── */}
      <ExportMenu anchorEl={exportAnchor} onClose={() => setExportAnchor(null)} onExport={handleExport} />

      {/* ── Save As overwrite confirm ── */}
      <SaveAsConfirmDialog
        open={!!saveAsConfirmFolder}
        onClose={() => setSaveAsConfirmFolder(null)}
        onConfirm={() => {
          const f = saveAsConfirmFolder!
          setSaveAsConfirmFolder(null)
          performSaveAs(f)
        }}
      />

      {/* ── Rename dialog ── */}
      <RenameDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        currentValue={renameValue}
        onChange={setRenameValue}
        onConfirm={handleRename}
      />

      {/* ── Back confirm ── */}
      <BackConfirmDialog
        open={backConfirm}
        onClose={() => setBackConfirm(false)}
        onDiscard={() => {
          setBackConfirm(false)
          navigate('/')
        }}
        onSaveAndLeave={async () => {
          setBackConfirm(false)
          await handleSave()
          navigate('/')
        }}
      />

      {/* ── Snackbar ── */}
      <ProjectSnackbar
        message={snackMsg}
        severity={snackSeverity}
        onClose={hideSnack}
      />
    </Box>
  )
}

// ── Main Component (wraps with Provider) ─────────────────────────────────────
export default function ProjectPage(): JSX.Element {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as {
    filePath: string
    projectDir: string
    data: ProjectFile
  } | null

  if (!templateId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data. Go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  return (
    <ProjectHistoryProvider initialState={locationState?.data.appData ?? ({} as AnyAppData)}>
      <ProjectPageInner templateId={templateId} locationState={locationState} />
    </ProjectHistoryProvider>
  )
}
