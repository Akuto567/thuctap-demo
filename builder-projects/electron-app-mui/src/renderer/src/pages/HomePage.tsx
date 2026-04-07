import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Box, Divider, Typography } from '@mui/material'
import { useAppDocumentTitle } from '@renderer/hooks/useAppDocumentTitle'
import { useBoolean } from 'usehooks-ts'
import { JSX, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HasProjectDialog,
  NonEmptyFolderDialog,
  RecentProjectsSection,
  TemplateGrid
} from '../components/home/HomeComponents'
import { useTemplateManager } from '../hooks/useTemplates'
import { useSettingsStore } from '../stores/settingsStore'
import { GameTemplate, RecentProject } from '../types'

// Constant empty array to prevent infinite re-renders in Zustand selector
const EMPTY_RECENT_PROJECTS: RecentProject[] = []

type FolderDialogState =
  | { type: 'non-empty'; folder: string; template: GameTemplate }
  | { type: 'has-project'; folder: string; template: GameTemplate }
  | null

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage(): JSX.Element {
  const navigate = useNavigate()
  const manager = useTemplateManager()
  const [folderDlg, setFolderDlg] = useState<FolderDialogState>(null)
  const showRecent = useBoolean(false)
  useAppDocumentTitle('Home Page')

  // Use Zustand store for recent projects
  // Note: Using ?? with constant to avoid creating new arrays on each call (prevents infinite loops)
  const recentProjects = useSettingsStore(
    (s) => (s.globalSettings.recentProjects ?? EMPTY_RECENT_PROJECTS) as RecentProject[]
  )
  const addRecentProject = useSettingsStore((s) => s.addRecentProject)
  const removeRecentProject = useSettingsStore((s) => s.removeRecentProject)

  const openProject = useCallback(
    async (filePath: string, data: ReturnType<typeof JSON.parse>) => {
      const projectDir = filePath.replace(/[/\\][^/\\]+$/, '')
      const template = manager.getTemplate(data.templateId)
      await addRecentProject({
        filePath,
        projectDir,
        templateId: data.templateId,
        templateName: template?.name ?? data.templateId,
        projectName: data.name,
        lastOpened: new Date().toISOString()
      })
      navigate(`/project/${data.templateId}`, { state: { filePath, projectDir, data } })
    },
    [manager, navigate, addRecentProject]
  )

  const handleOpenExisting = async (): Promise<void> => {
    const result = await window.electronAPI.openProjectFile()
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const handleNewProject = async (template: GameTemplate): Promise<void> => {
    // No longer asks for folder - creates temp project immediately
    await createNewProject(template)
  }

  const createNewProject = async (template: GameTemplate): Promise<void> => {
    const tempFolder = await window.electronAPI.createTempFolder()
    const projectPath = `${tempFolder}/project.mgproj`
    const now = new Date().toISOString()
    const initialAppData = manager.createInitialData(template.id)
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

    // Navigate to project with isTemporary flag
    navigate(`/project/${template.id}`, {
      state: {
        filePath: projectPath,
        projectDir: tempFolder,
        data: newProject,
        isTemporary: true
      }
    })
  }

  const handleOpenFromFolder = async (folder: string): Promise<void> => {
    const filePath = `${folder}/project.mgproj`
    const result = await window.electronAPI.openProjectFile(filePath)
    if (!result) return
    await openProject(result.filePath, result.data)
  }

  const removeRecent = async (filePath: string): Promise<void> => {
    await removeRecentProject(filePath)
  }

  const openRecent = async (entry: RecentProject): Promise<void> => {
    const result = await window.electronAPI.openProjectFile(entry.filePath)
    if (!result) {
      alert(`Could not open "${entry.projectName}". The file may have been moved or deleted.`)
      return
    }
    await openProject(result.filePath, result.data)
  }

  const handleOpenInExplorer = (filePath: string): void => {
    window.electronAPI.openPathInExplorer(filePath)
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
      <RecentProjectsSection
        recent={recentProjects}
        showRecent={showRecent.value}
        onToggleShow={showRecent.toggle}
        onBrowse={handleOpenExisting}
        onOpenRecent={openRecent}
        onRemoveRecent={removeRecent}
        onOpenInExplorer={handleOpenInExplorer}
      />

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* ── Templates ── */}
      <TemplateGrid templates={manager.getAllTemplates()} onSelect={handleNewProject} />

      {/* ── Folder conflict dialogs ── */}
      <HasProjectDialog
        open={folderDlg?.type === 'has-project'}
        folder={folderDlg?.folder ?? ''}
        onClose={() => setFolderDlg(null)}
        onOpen={async () => {
          const d = folderDlg
          setFolderDlg(null)
          if (d) await handleOpenFromFolder(d.folder)
        }}
      />

      <NonEmptyFolderDialog
        open={folderDlg?.type === 'non-empty'}
        folder={folderDlg?.folder ?? ''}
        onClose={() => setFolderDlg(null)}
        onChooseAnother={async () => {
          const d = folderDlg
          setFolderDlg(null)
          if (d) await handleNewProject(d.template)
        }}
      />
    </Box>
  )
}
