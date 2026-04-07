import CollectionsIcon from '@mui/icons-material/Collections'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import { SidebarTab } from '../../components/editors'
import { WordSearchAppData } from '../../types'
import { SettingsTab, WordsTab } from './components'
import { useWordSearchCrud } from './hooks/useWordSearchCrud'

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
  const { items } = data
  const { addItem, addItemFromDrop, updateItem, deleteItem } = useWordSearchCrud(
    data,
    projectDir,
    onChange
  )

  // Basic validation
  const unnamedI = items.filter((i) => !i.word.trim())
  const invalidI = items.filter((i) => i.word.trim() && !/^[A-Z]+$/.test(i.word.trim()))

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
          badgeColor={unnamedI.length > 0 || invalidI.length > 0 ? 'error' : 'default'}
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
