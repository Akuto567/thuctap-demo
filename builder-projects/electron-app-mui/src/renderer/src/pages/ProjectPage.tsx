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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import GroupSortEditor from '../components/GroupSortEditor'
import QuizEditor from '../components/QuizEditor'
import SettingsPanel from '../components/SettingsPanel'
import WordSearchEditor from '../components/WordSearchEditor'
import { useSettings } from '../context/SettingsContext'
import { useHistory } from '../hooks/useHistory'
import { AnyAppData, GameTemplate, ProjectFile, ProjectMeta, WordSearchAppData } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildTitle(templateName: string, projectName: string, filePath: string) {
  return `[${templateName}] ${projectName} — ${filePath}`
}

function buildProjectFile(meta: ProjectMeta, appData: AnyAppData): ProjectFile {
  return {
    version: meta.name ? '1.0.0' : '1.0.0', // always same, could track version
    templateId: meta.templateId,
    name: meta.name,
    createdAt: meta.createdAt,
    updatedAt: new Date().toISOString(),
    settings: meta.settings,
    appData
  }
}

function normalizeWordSearchData(appData: AnyAppData): WordSearchAppData | null {
  if (!('items' in appData) || !('gridSize' in appData) || !('backgroundImagePath' in appData)) {
    return null
  }
  return appData as WordSearchAppData
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { resolved, setProjectSettings } = useSettings()

  const locationState = location.state as {
    filePath: string
    projectDir: string
    data: ProjectFile
  } | null

  // Split project state: meta (file location, name) is separate from app data (game content)
  const [meta, setMeta] = useState<ProjectMeta | null>(() =>
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
  const [templates, setTemplates] = useState<GameTemplate[]>([])

  // History tracks only the game data, not meta
  const history = useHistory<AnyAppData>(locationState?.data.appData ?? ({} as AnyAppData))

  // Load templates list for display names
  useEffect(() => {
    window.electronAPI.getTemplates().then(setTemplates)
  }, [])

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
    const tName = templates.find((t) => t.id === templateId)?.name ?? templateId
    const title = buildTitle(tName, meta.name, meta.filePath)
    document.title = title
    window.electronAPI.setTitle(title)
  }, [meta, templateId, templates])

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

  const showSnack = (msg: string, severity: 'success' | 'error' | 'info' = 'success') =>
    setSnack({ msg, severity })

  // ── Save ─────────────────────────────────────────────────────────────────
  const doSave = useCallback(async (currentMeta: ProjectMeta, appData: AnyAppData) => {
    const file = buildProjectFile(currentMeta, appData)
    await window.electronAPI.saveProject(file, currentMeta.filePath)
    setIsDirty(false)
  }, [])

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const onEditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const metaRef = useRef(meta)
  metaRef.current = meta
  const appDataRef = useRef(history.present)
  appDataRef.current = history.present
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (resolved.autoSave.mode === 'interval') {
      intervalRef.current = setInterval(() => {
        if (isDirtyRef.current && metaRef.current)
          doSave(metaRef.current, appDataRef.current).catch(() => {})
      }, resolved.autoSave.intervalSeconds * 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [resolved.autoSave.mode, resolved.autoSave.intervalSeconds, doSave])

  // ── App data change (from editor) ─────────────────────────────────────────
  const handleAppDataChange = useCallback(
    (newData: AnyAppData) => {
      history.push(newData)
      setIsDirty(true)
      if (resolved.autoSave.mode === 'on-edit') {
        if (onEditTimerRef.current) clearTimeout(onEditTimerRef.current)
        onEditTimerRef.current = setTimeout(() => {
          if (metaRef.current) doSave(metaRef.current, newData).catch(() => {})
        }, 1000)
      }
    },
    [history, resolved.autoSave.mode, doSave]
  )

  const handleSave = async () => {
    if (!meta) return
    try {
      await doSave(meta, history.present)
      showSnack('Project saved!')
    } catch (e) {
      showSnack(`Save failed: ${e}`, 'error')
    }
  }

  // ── Save As ───────────────────────────────────────────────────────────────
  const handleSaveAs = async () => {
    if (!meta) return
    const result = await window.electronAPI.saveProjectAs({
      projectData: buildProjectFile(meta, history.present),
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
  }

  const performSaveAs = async (folder: string) => {
    if (!meta) return
    try {
      const newLoc = await window.electronAPI.doSaveAs({
        projectData: buildProjectFile(meta, history.present),
        oldProjectDir: meta.projectDir,
        newFolder: folder
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
  }

  // ── Export / Preview ───────────────────────────────────────────────────────
  const handleExport = async (mode: 'folder' | 'zip') => {
    setExportAnchor(null)
    if (!meta) return
    try {
      const result = await window.electronAPI.exportProject({
        templateId: meta.templateId,
        appData: history.present,
        projectDir: meta.projectDir,
        mode
      })
      if (result.canceled) return
      showSnack(`Exported to: ${result.path}`)
    } catch (e) {
      showSnack(`Export failed: ${e}`, 'error')
    }
  }

  const handlePreview = async () => {
    if (!meta) return
    try {
      await window.electronAPI.previewProject({
        templateId: meta.templateId,
        appData: history.present,
        projectDir: meta.projectDir
      })
      showSnack('Preview opened')
    } catch (e) {
      showSnack(`Preview failed: ${e}`, 'error')
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  const handleRename = async () => {
    if (!meta || !renameValue.trim()) return
    const updated = { ...meta, name: renameValue.trim() }
    setMeta(updated)
    setRenameOpen(false)
    try {
      await doSave(updated, history.present)
    } catch {
      /* saved later */
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        history.undo()
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        history.redo()
      }
      if (ctrl && e.key === 's' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if (ctrl && e.key === 's' && e.shiftKey) {
        e.preventDefault()
        handleSaveAs()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [history, handleSave, handleSaveAs])

  if (!meta || !templateId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">No project data. Go back and try again.</Typography>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </Box>
    )
  }

  const templateName = templates.find((t) => t.id === templateId)?.name ?? templateId
  const wordSearchData = templateId === 'word-search' ? normalizeWordSearchData(history.present) : null
  const wordSearchValidWords =
    wordSearchData?.items.filter((item) => item.word.trim()).length ?? 0
  const wordSearchDuplicateCount = wordSearchData
    ? wordSearchData.items.filter((item, index, arr) => {
        const normalized = item.word.trim()
        return normalized && arr.findIndex((candidate) => candidate.word.trim() === normalized) !== index
      }).length
    : 0
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
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
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
            {templateId === 'word-search' && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Build a word puzzle with clue images, then export a playable folder.
              </Typography>
            )}
          </Box>
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
              <IconButton size="small" onClick={history.undo} disabled={!history.canUndo}>
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={history.redo} disabled={!history.canRedo}>
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
          <Button
            size="small"
            startIcon={<SaveIcon />}
            variant={isDirty ? 'contained' : 'outlined'}
            color={isDirty ? 'primary' : 'inherit'}
            onClick={handleSave}
          >
            Save
          </Button>
          <Tooltip title="Save As (Ctrl+Shift+S)">
            <IconButton size="small" onClick={handleSaveAs}>
              <SaveAsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={handlePreview}>
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            startIcon={<FileDownloadIcon />}
            variant="outlined"
            onClick={(e) => setExportAnchor(e.currentTarget)}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ── Editor ── */}
      {templateId === 'word-search' && wordSearchData && (
        <Box
          sx={{
            px: 3,
            py: 1.25,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background:
              'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(110,231,183,0.06) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Word Search Workspace
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tip: drop an image on Add Word to create a clue card faster.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              color={wordSearchValidWords === 0 ? 'warning' : 'primary'}
              label={`${wordSearchValidWords} word${wordSearchValidWords !== 1 ? 's' : ''}`}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`grid ${wordSearchData.gridSize}x${wordSearchData.gridSize}`}
            />
            <Chip
              size="small"
              variant="outlined"
              label={wordSearchData.backgroundImagePath ? 'background ready' : 'no background'}
            />
            {wordSearchDuplicateCount > 0 && (
              <Chip
                size="small"
                color="warning"
                label={`${wordSearchDuplicateCount} duplicate${wordSearchDuplicateCount !== 1 ? 's' : ''}`}
              />
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {templateId === 'group-sort' && (
          <GroupSortEditor
            appData={history.present as any}
            projectDir={meta.projectDir}
            onChange={handleAppDataChange}
          />
        )}
        {templateId === 'plane-quiz' && (
          <QuizEditor
            appData={history.present as any}
            projectDir={meta.projectDir}
            onChange={handleAppDataChange}
          />
        )}
        {templateId === 'word-search' && (
          <WordSearchEditor
            appData={history.present as any}
            projectDir={meta.projectDir}
            onChange={handleAppDataChange}
          />
        )}
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
              templateId === 'word-search'
                ? 'Creates a playable word-search folder with image clues'
                : 'Copies game + assets'
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
              templateId === 'word-search'
                ? 'Packages the word-search game into one archive'
                : 'Single archive'
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
        autoHideDuration={3500}
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
