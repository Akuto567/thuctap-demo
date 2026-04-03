import AddLocationIcon from '@mui/icons-material/AddLocation'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { Box, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef } from 'react'
import { LabelledDiagramPoint } from '../../../types'

interface PointListPanelProps {
  points: LabelledDiagramPoint[]
  selectedPointId: string | null
  onSelectPoint: (id: string) => void
  onUpdatePoint: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDeletePoint: (id: string) => void
  onNavigateToPoint: (point: LabelledDiagramPoint) => void
  getPointColor: (index: number) => { bg: string; text: string }
}

interface PointEntryProps {
  point: LabelledDiagramPoint
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<LabelledDiagramPoint>) => void
  onDelete: (id: string) => void
  onNavigateToPoint: (point: LabelledDiagramPoint) => void
  pointColor: { bg: string; text: string }
}

function PointEntry({
  point,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onNavigateToPoint,
  pointColor
}: PointEntryProps): React.ReactElement {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only select if clicking on the entry background, not on inputs or buttons
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.entry-click-area')) {
        onSelect(point.id)
        onNavigateToPoint(point)
      }
    },
    [point.id, onSelect, onNavigateToPoint]
  )

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation()
      onUpdate(point.id, { text: e.target.value })
    },
    [point.id, onUpdate]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(point.id)
    },
    [point.id, onDelete]
  )

  return (
    <Box
      className="entry-click-area"
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        cursor: 'pointer',
        background: isSelected ? 'rgba(110,231,183,0.1)' : 'transparent',
        border: '1px solid',
        borderColor: isSelected ? 'primary.dark' : 'transparent',
        transition: 'all 0.15s',
        '&:hover': {
          background: isSelected ? 'rgba(110,231,183,0.1)' : 'rgba(255,255,255,0.04)'
        }
      }}
    >
      {/* Point Badge */}
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: pointColor.bg,
          color: pointColor.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {index + 1}
      </Box>

      {/* Text Input */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Enter label..."
        value={point.text}
        onChange={handleTextChange}
        onClick={(e) => e.stopPropagation()}
        fullWidth
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255,255,255,0.03)',
            fontSize: '0.85rem',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' }
          }
        }}
      />

      {/* Delete Button */}
      <Tooltip title="Delete point">
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'error.main', bgcolor: 'rgba(248,113,113,0.1)' }
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

export function PointListPanel({
  points,
  selectedPointId,
  onSelectPoint,
  onUpdatePoint,
  onDeletePoint,
  onNavigateToPoint,
  getPointColor
}: PointListPanelProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to selected point
  useEffect(() => {
    if (scrollRef.current && selectedPointId) {
      const selectedIndex = points.findIndex((p) => p.id === selectedPointId)
      if (selectedIndex >= 0) {
        const entryElement = scrollRef.current.children[selectedIndex]
        if (entryElement) {
          entryElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }
  }, [selectedPointId, points])

  // Handle add point at center
  const handleAddPointAtCenter = useCallback(() => {
    window.dispatchEvent(new CustomEvent('labelled-diagram-add-point-center'))
  }, [])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header with Add Button */}
      <Box
        sx={{
          p: 2,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Points ({points.length})
        </Typography>
        <Tooltip title="Add point at center of view">
          <IconButton
            onClick={handleAddPointAtCenter}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', bgcolor: 'rgba(110,231,183,0.1)' }
            }}
          >
            <AddLocationIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Point List */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75
        }}
      >
        {points.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              color: 'text.disabled'
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              No points yet
            </Typography>
            <Typography variant="caption">
              Click on the image or use the + button above to add a point
            </Typography>
          </Box>
        ) : (
          points.map((point, index) => (
            <PointEntry
              key={point.id}
              point={point}
              index={index}
              isSelected={point.id === selectedPointId}
              onSelect={onSelectPoint}
              onUpdate={onUpdatePoint}
              onDelete={onDeletePoint}
              onNavigateToPoint={onNavigateToPoint}
              pointColor={getPointColor(index)}
            />
          ))
        )}
      </Box>
    </Box>
  )
}
