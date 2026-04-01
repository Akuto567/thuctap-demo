import DeleteIcon from '@mui/icons-material/Delete'
import {
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tooltip,
    Typography
} from '@mui/material'
import React from 'react'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '../../../components'
import { GroupSortGroup, GroupSortItem } from '../../../types'

export interface ItemCardProps {
  item: GroupSortItem
  index: number
  groups: GroupSortGroup[]
  projectDir: string
  onUpdate: (id: string, patch: Partial<GroupSortItem>) => void
  onDelete: (id: string) => void
  autoFocus?: boolean
}

/**
 * Card component for editing a single item in GroupSortEditor.
 * Supports image drop, name editing, group assignment, and deletion.
 */
export function ItemCard({
  item,
  index,
  groups,
  projectDir,
  onUpdate,
  onDelete,
  autoFocus
}: ItemCardProps): React.ReactElement {
  const assigned = groups.find((g) => g.id === item.groupId)

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
          border: '1px solid',
          borderColor: !assigned ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: !assigned ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.12)' }
        }}
      >
        <IndexBadge index={index} color="secondary" />
        <ImagePicker
          projectDir={projectDir}
          desiredNamePrefix={item.id}
          value={item.imagePath}
          onChange={(p) => onUpdate(item.id, { imagePath: p })}
          label="Item image"
          size={72}
        />
        <NameField
          label="Item name"
          value={item.name}
          onChange={(v) => onUpdate(item.id, { name: v })}
          placeholder="e.g. Dog, Apple, Red…"
          autoFocus={autoFocus}
        />
        <FormControl size="small" sx={{ minWidth: 160 }} error={!assigned}>
          <InputLabel>Belongs to group</InputLabel>
          <Select
            value={item.groupId}
            label="Belongs to group"
            onChange={(e) => onUpdate(item.id, { groupId: e.target.value })}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name || '(unnamed)'}
              </MenuItem>
            ))}
          </Select>
          {!assigned && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{ mt: 0.5, fontSize: '0.65rem' }}
            >
              Unassigned
            </Typography>
          )}
        </FormControl>
        <Tooltip title="Delete item">
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
