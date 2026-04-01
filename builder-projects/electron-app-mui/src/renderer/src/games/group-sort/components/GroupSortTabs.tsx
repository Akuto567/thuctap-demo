import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import DeleteIcon from '@mui/icons-material/Delete'
import ExtensionIcon from '@mui/icons-material/Extension'
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { Alert, Box, Button, Chip, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import React from 'react'
import {
    EmptyState,
    FileDropTarget,
    ImagePicker,
    IndexBadge,
    NameField,
    StickyHeader
} from '../../../components'
import { GroupSortGroup, GroupSortItem } from '../../../types'
import { GroupCard } from './GroupCard'
import { ItemCard } from './ItemCard'

// ── Groups Tab ────────────────────────────────────────────────────────────────
export interface GroupsTabProps {
  groups: GroupSortGroup[]
  projectDir: string
  onAdd: () => void
  onAddFromDrop: (filePath: string) => void
  onUpdate: (id: string, patch: Partial<GroupSortGroup>) => void
  onDelete: (id: string) => void
}

export function GroupsTab({
  groups,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: GroupsTabProps): React.ReactElement {
  return (
    <Box>
      <StickyHeader
        title="Groups"
        description="Each group is a sorting category. Items will be sorted into these groups."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => onAdd()}>
              Add Group
            </Button>
          </FileDropTarget>
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          icon={<CategoryIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No groups yet"
          description='Click "Add Group" or drop an image on the button to create a category.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {groups.map((g, idx) => (
            <GroupCard
              key={g.id}
              group={g}
              index={idx}
              projectDir={projectDir}
              onUpdate={onUpdate}
              onDelete={onDelete}
              autoFocus={idx === groups.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

// ── Items Tab ─────────────────────────────────────────────────────────────────
export interface ItemsTabProps {
  items: GroupSortItem[]
  groups: GroupSortGroup[]
  projectDir: string
  onAdd: (groupId?: string) => void
  onAddFromDrop: (filePath: string) => void
  onUpdate: (id: string, patch: Partial<GroupSortItem>) => void
  onDelete: (id: string) => void
}

export function ItemsTab({
  items,
  groups,
  projectDir,
  onAdd,
  onAddFromDrop,
  onUpdate,
  onDelete
}: ItemsTabProps): React.ReactElement {
  return (
    <Box>
      <StickyHeader
        title="Items"
        description="Each item belongs to one group. Students will drag these into the correct group."
        actions={
          <FileDropTarget onFileDrop={onAddFromDrop}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              size="small"
              onClick={() => onAdd()}
              disabled={groups.length === 0}
            >
              Add Item
            </Button>
          </FileDropTarget>
        }
      />
      {groups.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Create at least one group before adding items.
        </Alert>
      )}
      {items.length === 0 && groups.length > 0 ? (
        <EmptyState
          icon={<ExtensionIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="No items yet"
          description='Click "Add Item" or drop an image on the button to create a card.'
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map((item, idx) => (
            <ItemCard
              key={item.id}
              item={item}
              index={idx}
              groups={groups}
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

// ── Overview Tab ──────────────────────────────────────────────────────────────
export interface OverviewTabProps {
  groups: GroupSortGroup[]
  items: GroupSortItem[]
  projectDir: string
  unassigned: GroupSortItem[]
  onAddGroup: () => void
  onAddGroupFromDrop: (filePath: string) => void
  onAddItem: (groupId?: string) => void
  onAddItemFromDrop: (filePath: string, groupId?: string) => void
  onUpdateGroup: (id: string, patch: Partial<GroupSortGroup>) => void
  onUpdateItem: (id: string, patch: Partial<GroupSortItem>) => void
  onDeleteGroup: (id: string) => void
  onDeleteItem: (id: string) => void
}

export function OverviewTab({
  groups,
  items,
  projectDir,
  unassigned,
  onAddGroup,
  onAddGroupFromDrop,
  onAddItem,
  onAddItemFromDrop,
  onUpdateGroup,
  onUpdateItem,
  onDeleteGroup,
  onDeleteItem
}: OverviewTabProps): React.ReactElement {
  const lastGroupId = groups[groups.length - 1]?.id

  return (
    <Box>
      <StickyHeader
        title="Overview"
        description="All groups and their items at a glance."
        actions={
          <>
            <FileDropTarget onFileDrop={onAddGroupFromDrop}>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={() => onAddGroup()}
              >
                Add Group
              </Button>
            </FileDropTarget>
            <FileDropTarget onFileDrop={(fp) => onAddItemFromDrop(fp, lastGroupId)}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={() => onAddItem(lastGroupId)}
                disabled={groups.length === 0}
              >
                Add Item
              </Button>
            </FileDropTarget>
          </>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<ViewQuiltIcon sx={{ fontSize: 48, opacity: 0.3 }} />}
          title="Nothing here yet"
          description="Add groups first, then populate them with items."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map((group, gIdx) => {
            const gItems = items.filter((i) => i.groupId === group.id)
            return (
              <Box key={group.id}>
                <FileDropTarget
                  onFileDrop={async (fp) => {
                    const rel = await window.electronAPI.importImage(fp, projectDir, group.id)
                    onUpdateGroup(group.id, { imagePath: rel })
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      border: '1px solid rgba(110,231,183,0.2)',
                      borderRadius: 2,
                      background: 'rgba(110,231,183,0.04)',
                      mb: 1
                    }}
                  >
                    <IndexBadge index={gIdx} color="primary" />
                    <ImagePicker
                      projectDir={projectDir}
                      desiredNamePrefix={group.id}
                      value={group.imagePath}
                      onChange={(p) => onUpdateGroup(group.id, { imagePath: p })}
                      label="Image"
                      size={56}
                    />
                    <NameField
                      label="Group name"
                      value={group.name}
                      onChange={(v) => onUpdateGroup(group.id, { name: v })}
                      placeholder="Group name…"
                    />
                    <Chip
                      label={`${gItems.length} item${gItems.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                    <FileDropTarget onFileDrop={(fp) => onAddItemFromDrop(fp, group.id)}>
                      <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        size="small"
                        onClick={() => onAddItem(group.id)}
                      >
                        Add Item
                      </Button>
                    </FileDropTarget>
                    <Tooltip title="Delete group">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteGroup(group.id)}
                        sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </FileDropTarget>

                {/* Items grid */}
                <Box
                  sx={{
                    ml: 4,
                    pl: 2,
                    borderLeft: '2px solid rgba(110,231,183,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  {gItems.length === 0 ? (
                    <Typography variant="caption" color="text.disabled">
                      No items in this group
                    </Typography>
                  ) : (
                    gItems.map((item, iIdx) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        index={iIdx}
                        groups={groups}
                        projectDir={projectDir}
                        onUpdate={onUpdateItem}
                        onDelete={onDeleteItem}
                      />
                    ))
                  )}
                </Box>
              </Box>
            )
          })}

          {/* Unassigned items */}
          {unassigned.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mb: 1,
                  color: 'warning.main'
                }}
              >
                <WarningAmberIcon sx={{ fontSize: 16 }} />
                Unassigned Items ({unassigned.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {unassigned.map((item, idx) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    groups={groups}
                    projectDir={projectDir}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
