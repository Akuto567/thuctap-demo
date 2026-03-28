import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import { Alert, Box, Button, Collapse, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { useEditorShortcuts } from '@renderer/hooks/useEditorShortcuts'
import { useCallback, useState } from 'react'
import {
    AtoZWordField,
    EmptyState,
    FileDropTarget,
    IndexBadge,
    SidebarTab,
    StickyHeader
} from '../../components/EditorShared'
import ImagePicker from '../../components/ImagePicker'
import { useSettings } from '../../context/SettingsContext'
import { WordSearchAppData, WordSearchItem } from '../../types'
import { getExcelName } from '../../utils/stringUtils'

interface Props {
  appData: WordSearchAppData
  projectDir: string
  onChange: (data: WordSearchAppData) => void
}

type Tab = 'words' | 'settings'

function normalize(d: WordSearchAppData): WordSearchAppData {
  return { ...d, _itemCounter: d._itemCounter ?? 0, items: d.items ?? [] }
}

export default function WordSearchEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.JSX.Element {
  const data = normalize(raw)
  const [tab, setTab] = useState<Tab>('words')
  const { resolved } = useSettings()
  const { items } = data

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addItem = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextItemId()
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${getExcelName(counter)}` : '',
        imagePath: initialImage ?? null
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const i: WordSearchItem = {
        id,
        word: resolved.prefillNames ? `WORD${getExcelName(counter)}` : '',
        imagePath
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<WordSearchItem>) => {
      onChange({ ...data, items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
    },
    [data, items, onChange]
  )

  const deleteItem = useCallback(
    (id: string) => {
      onChange({ ...data, items: items.filter((i) => i.id !== id) })
    },
    [data, items, onChange]
  )

  useEditorShortcuts(() => {
    addItem()
  })

  // Basic validation
  const unnamedI = items.filter((i) => !i.word.trim())
  const invalidI = items.filter((i) => i.word.trim() && !/^[A-Z]+$/.test(i.word.trim()))
  const hasIssues = unnamedI.length > 0 || invalidI.length > 0

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#13161f',
          p: 2,
          gap: 1
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Sections
        </Typography>
        <SidebarTab
          active={tab === 'words'}
          onClick={() => setTab('words')}
          icon={<CollectionsIcon fontSize="small" />}
          label="Words"
          badge={items.length}
          badgeColor={hasIssues ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'settings'}
          onClick={() => setTab('settings')}
          icon={<SettingsIcon fontSize="small" />}
          label="Settings"
          badge={0}
          badgeColor="default"
        />
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {[
              unnamedI.length > 0 && `${unnamedI.length} item(s) missing a word`,
              invalidI.length > 0 && `${invalidI.length} item(s) with invalid characters (A-Z only)`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        {tab === 'words' && (
          <WordsTab
            items={items}
            projectDir={projectDir}
            onAdd={addItem}
            onAddFromDrop={addItemFromDrop}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab data={data} projectDir={projectDir} onChange={onChange} />
        )}
      </Box>
    </Box>
  )
}

function WordsTab({
  items,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: {
  items: WordSearchItem[]
  projectDir: string
  onAdd: () => void
  onAddFromDrop: (fp: string) => void
  onUpdate: (id: string, p: Partial<WordSearchItem>) => void
  onDelete: (id: string) => void
}): React.JSX.Element {
  return (
    <Box>
      <StickyHeader
        title="Words"
        description="Add words and corresponding images for the word search."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAdd()}
            >
              Add Word
            </Button>
          </FileDropTarget>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<CollectionsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No words yet"
          description='Click "Add Word" or drop an image here to create one.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item, idx) => (
            <WordCard
              key={item.id}
              item={item}
              index={idx}
              projectDir={projectDir}
              onUpdate={onUpdate}
              onDelete={onDelete}
              autoFocus={idx === items.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

function WordCard({
  item,
  index,
  projectDir,
  onUpdate,
  onDelete,
  autoFocus
}: {
  item: WordSearchItem
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, p: Partial<WordSearchItem>) => void
  onDelete: (id: string) => void
}): React.JSX.Element {
  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, item.id)
        onUpdate(item.id, { imagePath: rel })
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: 'rgba(255,255,255,0.12)' }
        }}
      >
        <IndexBadge index={index} color="primary" />
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={item.id}
          value={item.imagePath}
          onChange={(p) => onUpdate(item.id, { imagePath: p })}
          label="Image"
          size={72}
        />
        <AtoZWordField
          label="Word"
          value={item.word}
          onChange={(v) => onUpdate(item.id, { word: v })}
          placeholder="e.g. APPLE, DOG…"
          autoFocus={autoFocus}
        />
        <Tooltip title="Delete word">
          <IconButton
            size="small"
            onClick={() => onDelete(item.id)}
            sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </FileDropTarget>
  )
}

function SettingsTab({
  data,
  projectDir,
  onChange
}: {
  data: WordSearchAppData
  projectDir: string
  onChange: (d: WordSearchAppData) => void
}): React.JSX.Element {
  return (
    <Box>
      <StickyHeader
        title="Settings"
        description="Global configurations for the word search game."
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Background Appearance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Game Background Image
              </Typography>
              <ImagePicker
                projectDir={projectDir}
                desiredNamePrefix="global-background"
                value={data.backgroundImagePath ?? null}
                onChange={(p) => onChange({ ...data, backgroundImagePath: p })}
                label="Select Background"
                size={160}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
