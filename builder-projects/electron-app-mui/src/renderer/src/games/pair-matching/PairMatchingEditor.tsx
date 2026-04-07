import CollectionsIcon from '@mui/icons-material/Collections'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Typography } from '@mui/material'
import { JSX, useState } from 'react'
import { SidebarTab } from '../../components/editors'
import { PairMatchingAppData } from '../../types'
import { PairsTab, SettingsTab } from './components'
import { usePairCrud } from './hooks/usePairCrud'

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
  const { items } = data
  const { addItem, addItemFromDrop, updateItem, deleteItem } = usePairCrud(
    data,
    projectDir,
    onChange
  )

  const unnamedI = items.filter((i) => !i.keyword.trim())

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
