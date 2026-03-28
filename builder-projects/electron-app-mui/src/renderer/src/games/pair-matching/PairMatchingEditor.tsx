import AddIcon from '@mui/icons-material/Add'
import CollectionsIcon from '@mui/icons-material/Collections'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import {
    Alert,
    Box,
    Button,
    Collapse,
    Divider,
    IconButton,
    Paper,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { useEditorShortcuts } from '@renderer/hooks/useEditorShortcuts'
import { JSX, useCallback, useState } from 'react'
import {
    EmptyState,
    FileDropTarget,
    IndexBadge,
    NameField,
    SidebarTab,
    StickyHeader
} from '../../components/EditorShared'
import ImagePicker from '../../components/ImagePicker'
import { useSettings } from '../../context/SettingsContext'
import { PairMatchingAppData, PairMatchingItem } from '../../types'

interface Props {
  appData: PairMatchingAppData
  projectDir: string
  onChange: (data: PairMatchingAppData) => void
}

type Tab = 'pairs' | 'settings'

function normalize(d: PairMatchingAppData): PairMatchingAppData {
  return { ...d, _itemCounter: d._itemCounter ?? 0, items: d.items ?? [] }
}

export default function PairMatchingEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): JSX.Element {
  const data = normalize(raw)
  const [tab, setTab] = useState<Tab>('pairs')
  const { resolved } = useSettings()
  const { items } = data

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addItem = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextItemId()
      const i: PairMatchingItem = {
        id,
        keyword: resolved.prefillNames ? `Pair ${counter}` : '',
        imagePath: initialImage ?? null,
        minPairs: 1
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const i: PairMatchingItem = {
        id,
        keyword: resolved.prefillNames ? `Pair ${counter}` : '',
        imagePath
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<PairMatchingItem>) => {
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

  const unnamedI = items.filter((i) => !i.keyword.trim())
  const hasIssues = unnamedI.length > 0

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
          active={tab === 'pairs'}
          onClick={() => setTab('pairs')}
          icon={<CollectionsIcon fontSize="small" />}
          label="Pairs"
          badge={items.length}
          badgeColor={unnamedI.length > 0 ? 'error' : 'default'}
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
            {unnamedI.length > 0 && `${unnamedI.length} pair(s) missing a keyword`}
          </Alert>
        </Collapse>

        {tab === 'pairs' && (
          <PairsTab
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

function PairsTab({
  items,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: {
  items: PairMatchingItem[]
  projectDir: string
  onAdd: () => void
  onAddFromDrop: (fp: string) => void
  onUpdate: (id: string, p: Partial<PairMatchingItem>) => void
  onDelete: (id: string) => void
}): JSX.Element {
  return (
    <Box>
      <StickyHeader
        title="Pairs"
        description="Add pairs of images and keywords for students to match."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAdd()}
            >
              Add Pair
            </Button>
          </FileDropTarget>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<CollectionsIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No pairs yet"
          description='Click "Add Pair" or drop an image here to create one.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item, idx) => (
            <PairCard
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

function PairCard({
  item,
  index,
  projectDir,
  onUpdate,
  onDelete,
  autoFocus
}: {
  item: PairMatchingItem
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, p: Partial<PairMatchingItem>) => void
  onDelete: (id: string) => void
}): JSX.Element {
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
        <NameField
          label="Keyword"
          value={item.keyword}
          onChange={(v) => onUpdate(item.id, { keyword: v })}
          placeholder="e.g. Apple, Dog…"
          autoFocus={autoFocus}
        />
        <TextField
          label="Min Pairs"
          type="number"
          size="small"
          value={item.minPairs ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onUpdate(item.id, { minPairs: val })
          }}
          sx={{ width: 100 }}
          placeholder="Default"
        />
        <Tooltip title="Delete pair">
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
  data: PairMatchingAppData
  projectDir: string
  onChange: (d: PairMatchingAppData) => void
}): JSX.Element {
  return (
    <Box>
      <StickyHeader
        title="Settings"
        description="Global configurations for the pair-matching game."
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Game Rules
          </Typography>
          <TextField
            label="Minimum Total Pairs"
            type="number"
            size="small"
            value={data.minTotalPairs ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value)
              onChange({ ...data, minTotalPairs: val })
            }}
            fullWidth
            placeholder="No minimum (empty)"
            helperText="Globally ensure this many pairs appear in the game. Leave empty for default."
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: 3, background: '#1a1d27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Card Appearance
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Card Back Color"
                size="small"
                value={data.cardBackColor ?? ''}
                onChange={(e) => onChange({ ...data, cardBackColor: e.target.value })}
                fullWidth
                placeholder="e.g. #FF0000 or red"
                helperText="Color used for the back of cards if no image is provided."
                sx={{ mb: 2 }}
              />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Card Back Image
              </Typography>
              <ImagePicker
                projectDir={projectDir}
                desiredNamePrefix="global-card-back"
                value={data.cardBackImage ?? null}
                onChange={(p) => onChange({ ...data, cardBackImage: p })}
                label="Select Background"
                size={100}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
