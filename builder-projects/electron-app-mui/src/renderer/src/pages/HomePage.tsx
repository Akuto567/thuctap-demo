import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FolderOffIcon from '@mui/icons-material/FolderOff'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import HistoryIcon from '@mui/icons-material/History'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameTemplate, RecentProject } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const mos = Math.floor(days / 30)
  if (mos < 12) return `${mos} month${mos > 1 ? 's' : ''} ago`
  return `${Math.floor(mos / 12)} year${Math.floor(mos / 12) > 1 ? 's' : ''} ago`
}

async function readRecentProjects(): Promise<RecentProject[]> {
  const s = (await window.electronAPI.settingsReadGlobal()) as Record<string, unknown>
  return (s.recentProjects as RecentProject[] | undefined) ?? []
}

async function writeRecentProjects(list: RecentProject[]): Promise<void> {
  const s = (await window.electronAPI.settingsReadGlobal()) as Record<string, unknown>
  await window.electronAPI.settingsWriteGlobal({ ...s, recentProjects: list })
}

async function addRecentProject(entry: RecentProject) {
  const existing = await readRecentProjects()
  const filtered = existing.filter((r) => r.filePath !== entry.filePath)
  await writeRecentProjects([entry, ...filtered].slice(0, 10))
}

type FolderDialogState =
  | { type: 'non-empty'; folder: string; template: GameTemplate }
  | { type: 'has-project'; folder: string; template: GameTemplate }
  | null

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<GameTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [folderDlg, setFolderDlg] = useState<FolderDialogState>(null)
  const [recent, setRecent] = useState<RecentProject[]>([])
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => {
    window.electronAPI
      .getTemplates()
      .then(setTemplates)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
    readRecentProjects().then(setRecent)
  }, [])

  const openProject = useCallback(
    async (filePath: string, data: ReturnType<typeof JSON.parse>) => {
      const projectDir = filePath.replace(/[/\\][^/\\]+$/, '')
      await addRecentProject({
        filePath,
        projectDir,
        templateId: data.templateId,
        templateName: templates.find((t) => t.id === data.templateId)?.name ?? data.templateId,
        projectName: data.name,
        lastOpened: new Date().toISOString()
      })
      navigate(`/project/${data.templateId}`, { state: { filePath, projectDir, data } })
    },
    [templates, navigate]
  )

  const handleOpenExisting = async () => {
    const result = await window.electronAPI.openProjectFile()
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const handleNewProject = async (template: GameTemplate) => {
    const folder = await window.electronAPI.chooseProjectFolder()
    if (!folder) return
    const status = await window.electronAPI.checkFolderStatus(folder)
    if (status === 'has-project') {
      setFolderDlg({ type: 'has-project', folder, template })
      return
    }
    if (status === 'non-empty') {
      setFolderDlg({ type: 'non-empty', folder, template })
      return
    }
    await createNewProject(folder, template)
  }

  const createNewProject = async (folder: string, template: GameTemplate) => {
    const projectPath = `${folder}/project.mgproj`
    const now = new Date().toISOString()
    const initialAppData =
      template.gameType === 'group-sort'
        ? { groups: [], items: [], _groupCounter: 0, _itemCounter: 0 }
        : template.gameType === 'plane-quiz'
          ? { questions: [], _questionCounter: 0 }
          : template.gameType === 'group-sort'
            ? {}
            : {}
    const newProject = {
      version: '1.0.0',
      templateId: template.id,
      name: `New ${template.name} Project`,
      createdAt: now,
      updatedAt: now,
      settings: null,
      appData: initialAppData
    }
    await window.electronAPI.saveProject(newProject, projectPath)
    await openProject(projectPath, newProject)
  }

  const handleOpenFromFolder = async (folder: string) => {
    const filePath = `${folder}/project.mgproj`
    const result = await window.electronAPI.openProjectFile(filePath)
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const removeRecent = async (filePath: string) => {
    const updated = recent.filter((r) => r.filePath !== filePath)
    setRecent(updated)
    await writeRecentProjects(updated)
  }

  const openRecent = async (entry: RecentProject) => {
    const result = await window.electronAPI.openProjectFile(entry.filePath)
    if (!result) {
      alert(`Could not open "${entry.projectName}". The file may have been moved or deleted.`)
      return
    }
    await openProject(result.filePath, result.data)
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        // maxWidth: 1000,
        mx: 'auto',
        width: '100%'
      }}
    >
      {/* Hero */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SportsEsportsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography
            variant="h3"
            sx={{
              background: 'linear-gradient(135deg, #6ee7b7 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}
          >
            Minigame Builder
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: '52px' }}>
          Create engaging English teaching games for kids — no coding required.
        </Typography>
      </Box>

      {/* ── Recent projects (collapsible) ── */}
      <Box>
        <Box
          onClick={() => setShowRecent((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            userSelect: 'none',
            mb: showRecent ? 1.5 : 0
          }}
        >
          <HistoryIcon
            sx={{ fontSize: 18, color: recent.length > 0 ? 'primary.main' : 'text.disabled' }}
          />
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 2,
              color: recent.length > 0 ? 'text.secondary' : 'text.disabled',
              flex: 1
            }}
          >
            Continue working {recent.length > 0 && `(${recent.length})`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderOpenIcon />}
              onClick={(e) => {
                e.stopPropagation()
                handleOpenExisting()
              }}
              sx={{ borderStyle: 'dashed', fontSize: '0.75rem' }}
            >
              Browse…
            </Button>
            {showRecent ? (
              <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            ) : (
              <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            )}
          </Box>
        </Box>

        <Collapse in={showRecent}>
          {recent.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
              No recently opened projects yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recent.map((r) => (
                <Box
                  key={r.filePath}
                  onClick={() => openRecent(r)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: '#1a1d27',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.14)', background: '#1e2130' }
                  }}
                >
                  <SportsEsportsIcon
                    sx={{ fontSize: 28, color: 'primary.main', opacity: 0.6, flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {r.projectName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <Chip
                        label={r.templateName}
                        size="small"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Opened {timeAgo(r.lastOpened)}
                      </Typography>
                    </Box>
                    <Tooltip title={r.filePath}>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          fontSize: '0.65rem',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          mt: 0.25
                        }}
                      >
                        📁 {r.projectDir}
                      </Typography>
                    </Tooltip>
                  </Box>
                  <Tooltip title="Remove from list">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecent(r.filePath)
                      }}
                      sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Collapse>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* ── Templates ── */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Start a new project
        </Typography>
        {loading && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading game types…</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Could not load game types: {error}
          </Alert>
        )}
        {!loading && !error && templates.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No game types found. Make sure the <code>templates/</code> directory exists.
          </Alert>
        )}
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2
          }}
        >
          {templates.map((t) => (
            <GameTemplateCard key={t.id} template={t} onSelect={handleNewProject} />
          ))}
        </Box>
      </Box>

      {/* ── Folder conflict dialogs ── */}
      <Dialog
        open={folderDlg?.type === 'has-project'}
        onClose={() => setFolderDlg(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Project already exists here</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This folder already has a project file. Would you like to open it?
          </DialogContentText>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}
          >
            {folderDlg?.folder}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDlg(null)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<FolderOpenIcon />}
            onClick={async () => {
              const d = folderDlg
              setFolderDlg(null)
              if (d) await handleOpenFromFolder(d.folder)
            }}
          >
            Open existing
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={folderDlg?.type === 'non-empty'}
        onClose={() => setFolderDlg(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderOffIcon color="warning" /> Folder is not empty
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please choose an empty folder so your project files don't get mixed up with other
            things.
          </DialogContentText>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}
          >
            {folderDlg?.folder}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDlg(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const d = folderDlg
              setFolderDlg(null)
              if (d) await handleNewProject(d.template)
            }}
          >
            Choose another folder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function GameTemplateCard({
  template,
  onSelect
}: {
  template: GameTemplate
  onSelect: (t: GameTemplate) => void
}) {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // let the Card stretch to the grid item height
        background:
          'linear-gradient(135deg, rgba(110,231,183,0.05) 0%, rgba(167,139,250,0.05) 100%)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(110,231,183,0.12)'
        }
      }}
    >
      <CardActionArea
        onClick={() => onSelect(template)}
        sx={{
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          height: '100%' // make the clickable area fill the Card
        }}
      >
        <Box
          sx={{
            height: 140,
            borderRadius: 1.5,
            mb: 1,
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, rgba(110,231,183,0.12) 0%, rgba(167,139,250,0.12) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {template.thumbnailUrl ? (
            <Box
              component="img"
              src={template.thumbnailUrl}
              alt={template.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <SportsEsportsIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.6 }} />
          )}
        </Box>

        <CardContent
          sx={{
            pt: 0.5,
            pb: '12px !important',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1, // this area grows to take available vertical space
            minHeight: 0
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
              {template.name}
            </Typography>
            <Chip
              label={`v${template.version}`}
              size="small"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
            {template.description}
          </Typography>
          <Box
            sx={{
              mt: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              marginTop: 'auto' // pushes this row to the bottom of CardContent
            }}
          >
            <AddIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
              Create new project
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
