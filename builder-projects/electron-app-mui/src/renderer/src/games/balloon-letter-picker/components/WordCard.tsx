import DeleteIcon from '@mui/icons-material/Delete'
import { Box, IconButton, Paper, TextField, Tooltip } from '@mui/material'
import React from 'react'
import { AtoZWordField, FileDropTarget, ImagePicker, IndexBadge } from '../../../components'
import { BalloonWord } from '../../../types'

export interface WordCardProps {
  word: BalloonWord
  index: number
  projectDir: string
  autoFocus?: boolean
  onUpdate: (id: string, patch: Partial<BalloonWord>) => void
  onDelete: (id: string) => void
}

/**
 * Card component for editing a single word in BalloonLetterPickerEditor.
 * Supports image drop, A-Z word field, and hint text.
 */
export function WordCard({
  word,
  index,
  projectDir,
  autoFocus,
  onUpdate,
  onDelete
}: WordCardProps): React.ReactElement {
  const wordText = word.word.trim().toUpperCase()
  const isInvalid = wordText && !/^[A-Z]+$/.test(wordText)

  // Derive relative path from imagePath for ImagePicker's value prop
  const imageRelative = word.imagePath ? word.imagePath.replace(/^\.\//, '') : null

  return (
    <FileDropTarget
      onFileDrop={async (fp) => {
        const rel = await window.electronAPI.importImage(fp, projectDir, word.id)
        const imagePath = rel ? `${rel.replace(/\\/g, '/')}` : ''
        onUpdate(word.id, { imagePath })
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: isInvalid ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          background: '#1a1d27',
          transition: 'border-color 0.15s',
          '&:hover': {
            borderColor: isInvalid ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.12)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <IndexBadge index={index} color="primary" />

          <ImagePicker
            projectDir={projectDir}
            desiredNamePrefix={word.id}
            value={imageRelative}
            onChange={(p) => {
              const imagePath = p ? `${p.replace(/\\/g, '/')}` : ''
              onUpdate(word.id, { imagePath })
            }}
            label="Word image"
            size={80}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <AtoZWordField
              label="Word (uppercase letters only)"
              value={word.word}
              onChange={(v) => onUpdate(word.id, { word: v })}
              placeholder="e.g. JUMP"
              autoFocus={autoFocus}
            />

            <TextField
              label="Hint"
              value={word.hint}
              onChange={(e) => onUpdate(word.id, { hint: e.target.value })}
              placeholder="e.g. He pushes his body off the ground and rises into the air."
              size="small"
              multiline
              minRows={2}
              fullWidth
              error={!word.hint.trim()}
              helperText={!word.hint.trim() ? 'Required — helps students guess the word' : ''}
            />
          </Box>

          <Tooltip title="Delete word">
            <IconButton
              size="small"
              onClick={() => onDelete(word.id)}
              sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </FileDropTarget>
  )
}
