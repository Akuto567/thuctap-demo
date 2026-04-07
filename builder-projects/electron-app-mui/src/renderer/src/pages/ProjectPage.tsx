import { Box, Button, Typography } from '@mui/material'
import { useProjectHistory } from '@renderer/context/useProjectHistory'
import { useAppDocumentTitle } from '@renderer/hooks/useAppDocumentTitle'
import { useSettings } from '@renderer/hooks/useSettings'
import { useSettingsStore } from '@renderer/stores/settingsStore'
import { useBoolean, useInterval, useUnmount } from 'usehooks-ts'
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { MoreActionsMenu } from '../components/project/MoreActionsMenu'
import {
  BackConfirmDialog,
  ExportMenu,
  ProjectSnackbar,
  RenameDialog,
  SaveAsConfirmDialog
} from '../components/project/ProjectDialogs'
import { ProjectToolbar } from '../components/project/ProjectToolbar'
import SettingsPanel from '../components/SettingsPanel'
import { ProjectHistoryProvider } from '../context/ProjectHistoryProvider'
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
  const { resolved, projectSettings, setProjectSettings } = useSettings()
  const manager = useTemplateManager()
  const addRecentProject = useSettingsStore((s) => s.addRecentProject)

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
          settings: locationState.data.settings,
          isTemporary: (locationState as { isTemporary?: boolean }).isTemporary ?? false
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

  // Update window title whenever meta or appData changes
  const documentTitle = useMemo(() => {
    if (!meta || !templateId) return 'Loading project'
    const template = manager.getTemplate(templateId)
    const tName = template?.name ?? templateId
    const title = buildProjectTitle(tName, meta.name, meta.filePath)
    return title
    // document.title = title
    // window.electronAPI.setTitle(title)
  }, [meta, templateId, manager])
  useAppDocumentTitle(documentTitle)

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
  }, [locationState?.data?.settings, setProjectSettings])

  // Track previous projectSettings to detect changes
  const [prevProjectSettings, setPrevProjectSettings] = useState(projectSettings)

  // Sync project settings from context to meta (for saving)
  // Only update meta when projectSettings change, not vice versa
  if (prevProjectSettings !== projectSettings) {
    setPrevProjectSettings(projectSettings)
    setMeta((prev) => {
      if (!prev) return prev
      if (prev.settings === projectSettings) return prev
      setIsDirty(true)
      return { ...prev, settings: projectSettings }
    })
  }

  // UI state
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const renameOpen = useBoolean(false)
  const [renameValue, setRenameValue] = useState('')
  const backConfirm = useBoolean(false)
  const settingsOpen = useBoolean(false)
  const [saveAsConfirmFolder, setSaveAsConfirmFolder] = useState<string | null>(null)

  // ── Refs for auto-save ─────────────────────────────────────────────────────
  const onEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metaRef = useRef(meta)
  const appDataRef = useRef(appData)
  const isDirtyRef = useRef(isDirty)

  // Keep refs in sync - update synchronously to avoid stale closures
  useEffect(() => {
    metaRef.current = meta
    appDataRef.current = appData
    isDirtyRef.current = isDirty
  }, [meta, appData, isDirty])

  // ── Save ─────────────────────────────────────────────────────────────────
  const doSave = useCallback(
    async (currentMeta: ProjectMeta, appDataToSave: AnyAppData) => {
      const file = buildProjectFile(currentMeta, appDataToSave)
      const history = getHistoryArray(getHistory())
      await window.electronAPI.saveProject(file, currentMeta.filePath, history)
      setIsDirty(false)
    },
    [getHistory]
  )

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

        // Update meta and clear isTemporary flag
        setMeta((prev) =>
          prev
            ? {
                ...prev,
                filePath: newLoc.filePath,
                projectDir: newLoc.projectDir,
                isTemporary: false
              }
            : prev
        )

        // Add new project to recent projects list (treat like a new save)
        const template = manager.getTemplate(meta.templateId)
        await addRecentProject({
          filePath: newLoc.filePath,
          projectDir: newLoc.projectDir,
          templateId: meta.templateId,
          templateName: template?.name ?? meta.templateId,
          projectName: meta.name,
          lastOpened: new Date().toISOString()
        })

        setIsDirty(false)
        setSaveAsConfirmFolder(null)
        showSnack(`Saved to: ${newLoc.projectDir}`)
      } catch (e) {
        showSnack(`Save As failed: ${e}`, 'error')
      }
    },
    [meta, appData, getHistory, showSnack, addRecentProject, manager]
  )

  // ── Auto-save: interval mode ───────────────────────────────────────────────
  // Use useInterval hook for cleaner interval management with automatic cleanup
  useInterval(
    () => {
      if (isDirtyRef.current && metaRef.current) {
        doSave(metaRef.current, appDataRef.current).catch(() => {
          // Silently fail - user will see dirty indicator
        })
      }
    },
    resolved.autoSave.mode === 'interval' ? resolved.autoSave.intervalSeconds * 1000 : null
  )

  // ── Auto-save: on-edit mode cleanup ────────────────────────────────────────
  // Use useUnmount for cleanup-only effect (clearer intent than useEffect with empty deps)
  useUnmount(() => {
    if (onEditTimerRef.current) {
      clearTimeout(onEditTimerRef.current)
      onEditTimerRef.current = null
    }
  })

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

  const handleSave = useCallback(async (): Promise<void> => {
    if (!meta) return

    // If temporary, trigger save-as instead
    if (meta.isTemporary) {
      await handleSaveAs()
      return
    }

    try {
      await doSave(meta, appData)
      showSnack('Project saved!')
    } catch (e) {
      showSnack(`Save failed: ${e}`, 'error')
    }
  }, [meta, appData, doSave, showSnack, handleSaveAs])

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
    setIsDirty(true)
    renameOpen.setFalse()
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
        onBack={() => (isDirty ? backConfirm.setTrue() : navigate('/'))}
        onRename={() => {
          setRenameValue(meta.name)
          renameOpen.setTrue()
        }}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPreview={handlePreview}
        onExport={(e) => setExportAnchor(e.currentTarget)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        renderMoreActions={() => (
          <MoreActionsMenu
            pathToOpen={meta.projectDir}
            onOpenSettings={() => settingsOpen.setTrue()}
          />
        )}
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
      <SettingsPanel open={settingsOpen.value} onClose={settingsOpen.setFalse} hasProject />

      {/* ── Export menu ── */}
      <ExportMenu
        anchorEl={exportAnchor}
        onClose={() => setExportAnchor(null)}
        onExport={handleExport}
      />

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
        open={renameOpen.value}
        onClose={renameOpen.setFalse}
        currentValue={renameValue}
        onChange={setRenameValue}
        onConfirm={handleRename}
      />

      {/* ── Back confirm ── */}
      <BackConfirmDialog
        open={backConfirm.value}
        onClose={backConfirm.setFalse}
        onDiscard={() => {
          backConfirm.setFalse()
          navigate('/')
        }}
        onSaveAndLeave={async () => {
          backConfirm.setFalse()
          await handleSave()
          navigate('/')
        }}
      />

      {/* ── Snackbar ── */}
      <ProjectSnackbar message={snackMsg} severity={snackSeverity} onClose={hideSnack} />
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
