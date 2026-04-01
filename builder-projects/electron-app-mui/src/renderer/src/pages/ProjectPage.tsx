import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove'
import EditIcon from '@mui/icons-material/Edit'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import PreviewIcon from '@mui/icons-material/Preview'
import RedoIcon from '@mui/icons-material/Redo'
import SaveIcon from '@mui/icons-material/Save'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import SettingsIcon from '@mui/icons-material/Settings'
import UndoIcon from '@mui/icons-material/Undo'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useSettings } from '@renderer/hooks/useSettings'
import { JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import SettingsPanel from '../components/SettingsPanel'
import {
  getHistoryArray,
  ProjectHistoryProvider,
  useProjectHistory
} from '../context/ProjectHistoryContext'
import { useProjectShortcuts } from '../hooks/useProjectShortcuts'
import { useTemplateManager } from '../hooks/useTemplates'
import { AnyAppData, ProjectFile, ProjectMeta } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────
const AUTO_SAVE_DEBOUNCE_MS = 1000
const SNACKBAR_AUTO_HIDE_MS = 3500

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTitle(templateId: string, projectName: string, filePath: string): string {
  return `[${templateId}] ${projectName} — ${filePath}`
}

function buildProjectFile(meta: ProjectMeta, appData: AnyAppData): ProjectFile {
  return {
    version: '1.0.0',
    templateId: meta.templateId,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
    settings: meta.settings,
    appData
  }
}

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
    setPresent: setAppData,
    undo: historyUndo,
    redo: historyRedo,
    getHistory,
    canUndo,
    canRedo
  } = useProjectHistory()

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
    const title = buildTitle(tName, meta.name, meta.filePath)
    document.title = title
    window.electronAPI.setTitle(title)
  }, [meta, templateId, manager])

  const [snack, setSnack] = useState<{
    msg: string
    severity: 'success' | 'error' | 'info'
  } | null>(null)
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [backConfirm, setBackConfirm] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveAsConfirmFolder, setSaveAsConfirmFolder] = useState<string | null>(null)

  const showSnack = useCallback(
    (msg: string, severity: 'success' | 'error' | 'info' = 'success'): void =>
      setSnack({ msg, severity }),
    []
  )

  // ── Refs for auto-save (kept in sync via effect below) ─────────────────────
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
  }, [])

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
    [meta, appData, showSnack]
  )

  // ── Auto-save: interval mode ───────────────────────────────────────────────
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Set up new interval if mode is 'interval'
    if (resolved.autoSave.mode === 'interval') {
      intervalRef.current = setInterval(() => {
        if (isDirtyRef.current && metaRef.current) {
          doSave(metaRef.current, appDataRef.current).catch(() => {
            // Silently fail - user will see dirty indicator
          })
        }
      }, resolved.autoSave.intervalSeconds * 1000)
    }

    // Cleanup on unmount or mode change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [resolved.autoSave.mode, resolved.autoSave.intervalSeconds, doSave])

  // ── Auto-save: on-edit mode ────────────────────────────────────────────────
  useEffect(() => {
    // Cleanup on unmount or mode change
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
      setAppData(newData)
      setIsDirty(true)

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
    [setAppData, resolved.autoSave.mode, doSave]
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
      // Revert the rename if save fails
      setMeta(meta)
      showSnack(`Rename failed: ${e}`, 'error')
      throw e
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useProjectShortcuts({
    // Navigation
    onUndo: canUndo ? handleUndo : undefined,
    onRedo: canRedo ? handleRedo : undefined,

    // File operations
    onSave: handleSave,
    onSaveAs: handleSaveAs,

    // Preview and Export
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          background: '#13161f'
        }}
      >
        <Tooltip title="Back to home">
          <IconButton size="small" onClick={() => (isDirty ? setBackConfirm(true) : navigate('/'))}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Game type badge */}
        <Chip
          label={templateName}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.65rem', flexShrink: 0 }}
        />

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {meta.name}
          </Typography>
          <Tooltip title="Rename project">
            <IconButton
              size="small"
              sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
              onClick={() => {
                setRenameValue(meta.name)
                setRenameOpen(true)
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          {isDirty && (
            <Chip
              label="unsaved"
              size="small"
              color="warning"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
          {autoSaveLabel && !isDirty && (
            <Chip
              label={autoSaveLabel}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', opacity: 0.4 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={!canUndo}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={!canRedo}>
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Settings">
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save (Ctrl+S)">
            <Button
              size="small"
              startIcon={<SaveIcon />}
              variant={isDirty ? 'contained' : 'outlined'}
              color={isDirty ? 'primary' : 'inherit'}
              onClick={handleSave}
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip title="Save As (Ctrl+Shift+S)">
            <IconButton size="small" onClick={handleSaveAs}>
              <SaveAsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview (Ctrl+P)">
            <IconButton size="small" onClick={handlePreview}>
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <Button
              size="small"
              startIcon={<FileDownloadIcon />}
              variant="outlined"
              onClick={(e) => setExportAnchor(e.currentTarget)}
            >
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>

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
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('folder')}>
          <ListItemIcon>
            <DriveFileMoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Export to folder"
            secondary={
              <>
                Copies game + assets
                <Box
                  component="span"
                  sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}
                >
                  Ctrl+Shift+P
                </Box>
              </>
            }
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleExport('zip')}>
          <ListItemIcon>
            <FolderZipIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Export as ZIP"
            secondary={
              <>
                Single archive
                <Box
                  component="span"
                  sx={{ display: 'block', fontSize: '0.65rem', color: 'text.secondary' }}
                >
                  Ctrl+Alt+P
                </Box>
              </>
            }
          />
        </MenuItem>
      </Menu>

      {/* ── Save As overwrite confirm ── */}
      <Dialog
        open={!!saveAsConfirmFolder}
        onClose={() => setSaveAsConfirmFolder(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Overwrite existing project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            That folder already contains a project. This will overwrite it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveAsConfirmFolder(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              const f = saveAsConfirmFolder!
              setSaveAsConfirmFolder(null)
              performSaveAs(f)
            }}
          >
            Overwrite
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Rename dialog ── */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Back confirm ── */}
      <Dialog open={backConfirm} onClose={() => setBackConfirm(false)}>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>Save before leaving?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBackConfirm(false)
              navigate('/')
            }}
            color="error"
          >
            Discard &amp; leave
          </Button>
          <Button
            onClick={async () => {
              setBackConfirm(false)
              await handleSave()
              navigate('/')
            }}
            variant="contained"
          >
            Save &amp; leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={SNACKBAR_AUTO_HIDE_MS}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)}>
          {snack?.msg}
        </Alert>
      </Snackbar>
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
