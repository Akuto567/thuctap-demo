import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ClearIcon from '@mui/icons-material/Clear'
import { Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useAssetUrl } from '../hooks/useAssetUrl'

interface Props {
  projectDir: string
  entityId: string
  value: string | null
  onChange: (relativePath: string | null) => void
  label?: string
  size?: number
}

export default function ImagePicker({
  projectDir,
  entityId,
  value,
  onChange,
  label,
  size = 100
}: Props) {
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const url = useAssetUrl(projectDir, value)

  const importFile = async (filePath: string) => {
    setLoading(true)
    try {
      const relativePath = await window.electronAPI.importImage(filePath, projectDir, entityId)
      onChange(relativePath)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = async () => {
    const picked = await window.electronAPI.pickImage()
    if (picked) await importFile(picked)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  // ── Drag & drop support ──────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setDragOver(true)
    }
  }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
    if (file) await importFile((file as File & { path: string }).path)
  }

  const isActive = dragOver && !loading

  return (
    <Tooltip
      title={
        value ? 'Click to change image · Drop image here' : 'Click to add image · Drop image here'
      }
    >
      <Box
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          width: size,
          height: size,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: isActive
            ? 'primary.main'
            : value
              ? 'primary.dark'
              : 'rgba(255,255,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          background: isActive
            ? 'rgba(110,231,183,0.08)'
            : value
              ? 'transparent'
              : 'rgba(255,255,255,0.02)',
          transition: 'border-color 0.15s, background 0.15s',
          flexShrink: 0,
          '&:hover': { borderColor: 'primary.main', background: 'rgba(110,231,183,0.04)' }
        }}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : url ? (
          <>
            <Box
              component="img"
              src={url}
              alt={label ?? 'asset'}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '2px',
                '&:hover': { background: 'rgba(248,113,113,0.8)' }
              }}
            >
              <ClearIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </>
        ) : (
          <>
            <AddPhotoAlternateIcon
              sx={{
                fontSize: size * 0.32,
                color: isActive ? 'primary.main' : 'rgba(255,255,255,0.25)'
              }}
            />
            {label && (
              <Typography
                variant="caption"
                sx={{
                  color: isActive ? 'primary.main' : 'rgba(255,255,255,0.35)',
                  fontSize: '0.65rem',
                  mt: 0.5,
                  textAlign: 'center',
                  px: 0.5,
                  lineHeight: 1.2
                }}
              >
                {isActive ? 'Drop!' : label}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Tooltip>
  )
}
