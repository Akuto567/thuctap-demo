import CategoryIcon from '@mui/icons-material/Category'
import ExtensionIcon from '@mui/icons-material/Extension'
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Chip, Collapse, Divider, Typography } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { JSX, useCallback, useState } from 'react'
import { SidebarTab } from '../../components/editors'
import { GroupSortAppData, GroupSortGroup, GroupSortItem } from '../../types'
import {
  GroupsTab,
  ItemsTab,
  OverviewTab
} from './components'

interface Props {
  appData: GroupSortAppData
  projectDir: string
  onChange: (data: GroupSortAppData) => void
}

type Tab = 'groups' | 'items' | 'overview'

function normalize(d: GroupSortAppData): GroupSortAppData {
  return { ...d, _groupCounter: d._groupCounter ?? 0, _itemCounter: d._itemCounter ?? 0 }
}

export default function GroupSortEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): JSX.Element {
  const data = normalize(raw)
  const [tab, setTab] = useState<Tab>('groups')
  const { resolved } = useSettings()
  const { groups, items } = data

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const nextGroupId = useCallback(() => {
    const c = data._groupCounter + 1
    return { id: `group-${c}`, counter: c }
  }, [data._groupCounter])

  const nextItemId = useCallback(() => {
    const c = data._itemCounter + 1
    return { id: `item-${c}`, counter: c }
  }, [data._itemCounter])

  const addGroup = useCallback(
    (initialImage?: string) => {
      const { id, counter } = nextGroupId()
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath: initialImage ?? null
      }
      onChange({ ...data, _groupCounter: counter, groups: [...groups, g] })
    },
    [data, groups, resolved.prefillNames, onChange, nextGroupId]
  )

  const addGroupFromDrop = useCallback(
    async (filePath: string) => {
      const { id, counter } = nextGroupId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const g: GroupSortGroup = {
        id,
        name: resolved.prefillNames ? `Group ${counter}` : '',
        imagePath
      }
      onChange({ ...data, _groupCounter: counter, groups: [...groups, g] })
    },
    [data, groups, projectDir, resolved.prefillNames, onChange, nextGroupId]
  )

  const updateGroup = useCallback(
    (id: string, patch: Partial<GroupSortGroup>) => {
      onChange({ ...data, groups: groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })
    },
    [data, groups, onChange]
  )

  const deleteGroup = useCallback(
    (id: string) => {
      onChange({
        ...data,
        groups: groups.filter((g) => g.id !== id),
        items: items.map((i) => (i.groupId === id ? { ...i, groupId: '' } : i))
      })
    },
    [data, groups, items, onChange]
  )

  const addItem = useCallback(
    (groupId?: string, initialImage?: string) => {
      const { id, counter } = nextItemId()
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath: initialImage ?? null,
        groupId: targetGroupId
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, groups, resolved.prefillNames, onChange, nextItemId]
  )

  const addItemFromDrop = useCallback(
    async (filePath: string, groupId?: string) => {
      const { id, counter } = nextItemId()
      const imagePath = await window.electronAPI.importImage(filePath, projectDir, id)
      const targetGroupId = groupId ?? groups[groups.length - 1]?.id ?? ''
      const i: GroupSortItem = {
        id,
        name: resolved.prefillNames ? `Item ${counter}` : '',
        imagePath,
        groupId: targetGroupId
      }
      onChange({ ...data, _itemCounter: counter, items: [...items, i] })
    },
    [data, items, groups, projectDir, resolved.prefillNames, onChange, nextItemId]
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<GroupSortItem>) => {
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Tier 1 (Ctrl+N) = item (smallest unit) → last group
  // Tier 2 (Ctrl+Shift+N) = group (nothing above group)
  useEntityCreateShortcut({
    onTier1: addItem,
    onTier2: addGroup
  })

  // ── Validation ────────────────────────────────────────────────────────────
  const unassigned = items.filter((i) => !i.groupId || !groups.find((g) => g.id === i.groupId))
  const unnamedG = groups.filter((g) => !g.name.trim())
  const unnamedI = items.filter((i) => !i.name.trim())
  const hasIssues = unassigned.length > 0 || unnamedG.length > 0 || unnamedI.length > 0
  const itemsPerGroup = groups.map((g) => ({
    group: g,
    count: items.filter((i) => i.groupId === g.id).length
  }))

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
          active={tab === 'groups'}
          onClick={() => setTab('groups')}
          icon={<CategoryIcon fontSize="small" />}
          label="Groups"
          badge={groups.length}
          badgeColor={unnamedG.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'items'}
          onClick={() => setTab('items')}
          icon={<ExtensionIcon fontSize="small" />}
          label="Items"
          badge={items.length}
          badgeColor={unassigned.length > 0 || unnamedI.length > 0 ? 'error' : 'default'}
        />
        <SidebarTab
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
          icon={<ViewQuiltIcon fontSize="small" />}
          label="Overview"
          badge={groups.length + items.length}
          badgeColor={hasIssues ? 'error' : 'default'}
        />

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Distribution
        </Typography>
        {groups.length === 0 ? (
          <Typography variant="caption" color="text.disabled">
            No groups yet
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {itemsPerGroup.map(({ group, count }) => (
              <Box
                key={group.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {group.name || '(unnamed)'}
                </Typography>
                <Chip
                  label={count}
                  size="small"
                  sx={{ height: 16, fontSize: '0.65rem', minWidth: 24 }}
                  color={count === 0 ? 'default' : 'primary'}
                />
              </Box>
            ))}
          </Box>
        )}
        {unassigned.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="warning.main">
              {unassigned.length} unassigned
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Main ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {[
              unnamedG.length > 0 && `${unnamedG.length} group(s) missing a name`,
              unnamedI.length > 0 && `${unnamedI.length} item(s) missing a name`,
              unassigned.length > 0 && `${unassigned.length} item(s) not assigned to a group`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        {tab === 'groups' && (
          <GroupsTab
            groups={groups}
            projectDir={projectDir}
            onAdd={addGroup}
            onAddFromDrop={addGroupFromDrop}
            onUpdate={updateGroup}
            onDelete={deleteGroup}
          />
        )}
        {tab === 'items' && (
          <ItemsTab
            items={items}
            groups={groups}
            projectDir={projectDir}
            onAdd={addItem}
            onAddFromDrop={addItemFromDrop}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        )}
        {tab === 'overview' && (
          <OverviewTab
            groups={groups}
            items={items}
            projectDir={projectDir}
            onAddGroup={addGroup}
            onAddGroupFromDrop={addGroupFromDrop}
            onAddItem={addItem}
            onAddItemFromDrop={addItemFromDrop}
            onUpdateGroup={updateGroup}
            onUpdateItem={updateItem}
            onDeleteGroup={deleteGroup}
            onDeleteItem={deleteItem}
            unassigned={unassigned}
          />
        )}
      </Box>
    </Box>
  )
}
