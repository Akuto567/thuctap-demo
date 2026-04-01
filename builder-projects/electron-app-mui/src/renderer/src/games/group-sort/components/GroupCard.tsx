import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Paper, Tooltip } from '@mui/material'
import React from 'react'
import { FileDropTarget, ImagePicker, IndexBadge, NameField } from '../../../components'
import { GroupSortGroup } from '../../../types'

export interface GroupCardProps {
  group: GroupSortGroup
  index: number
  projectDir: string
  onUpdate: (id: string, patch: Partial<GroupSortGroup>) => void
  onDelete: (id: string) => void
  autoFocus?: boolean
}

/**
 * Card component for editing a single group in GroupSortEditor.
 * Supports image drop, name editing, and deletion.
 */
export function GroupCard({
  group,
  index,
  projectDir,
  onUpdate,
  onDelete,
  autoFocus
}: GroupCardProps): React.ReactElement {
  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, group.id)
        onUpdate(group.id, { imagePath: rel })
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
          desiredNamePrefix={group.id}
          value={group.imagePath}
          onChange={(p) => onUpdate(group.id, { imagePath: p })}
          label="Group image"
          size={72}
        />
        <NameField
          label="Group name"
          value={group.name}
          onChange={(v) => onUpdate(group.id, { name: v })}
          placeholder="e.g. Animals, Fruits, Colors…"
          autoFocus={autoFocus}
        />
        <Tooltip title="Delete group">
          <IconButton
            size="small"
            onClick={() => onDelete(group.id)}
            sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </FileDropTarget>
  )
}
