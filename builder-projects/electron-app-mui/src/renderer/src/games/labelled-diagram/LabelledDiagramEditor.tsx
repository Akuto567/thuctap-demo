import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Alert,
  Box,
  Collapse,
  Fab,
  IconButton,
  Typography
} from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { useSettings } from '@renderer/hooks/useSettings'
import { useCallback, useState } from 'react'
import { LabelledDiagramAppData, LabelledDiagramPoint } from '../../types'
import { ImageViewer } from './components/ImageViewer'
import { PointListPanel } from './components/PointListPanel'

interface Props {
  appData: LabelledDiagramAppData
  projectDir: string
  onChange: (data: LabelledDiagramAppData) => void
}

function normalize(d: LabelledDiagramAppData): LabelledDiagramAppData {
  return {
    ...d,
    imagePath: d.imagePath ?? null,
    points: d.points ?? [],
    _pointCounter: d._pointCounter ?? 0
  }
}

// Color palette for point badges - rotates through colors
const POINT_COLORS = [
  { bg: 'rgba(110,231,183,0.9)', text: '#000' },  // Green
  { bg: 'rgba(167,139,250,0.9)', text: '#fff' },  // Purple
  { bg: 'rgba(251,191,36,0.9)', text: '#000' },   // Amber
  { bg: 'rgba(248,113,113,0.9)', text: '#fff' },  // Red
  { bg: 'rgba(96,165,250,0.9)', text: '#fff' },   // Blue
  { bg: 'rgba(251,146,60,0.9)', text: '#fff' },   // Orange
  { bg: 'rgba(163,230,53,0.9)', text: '#000' },   // Lime
  { bg: 'rgba(236,72,153,0.9)', text: '#fff' },   // Pink
]

function getPointColor(index: number) {
  return POINT_COLORS[index % POINT_COLORS.length]
}

export default function LabelledDiagramEditor({
  appData: raw,
  projectDir,
  onChange
}: Props): React.ReactElement {
  const data = normalize(raw)
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const { resolved } = useSettings()

  // ── Image handling ──────────────────────────────────────────────────────
  const handleSelectImage = useCallback(async () => {
    const filePath = await window.electronAPI.pickImage()
    if (filePath) {
      const relativePath = await window.electronAPI.importImage(
        filePath,
        projectDir,
        'diagram'
      )
      onChange({ ...data, imagePath: relativePath })
    }
  }, [data, projectDir, onChange])

  const handleRemoveImage = useCallback(() => {
    onChange({ ...data, imagePath: null, points: [] })
    setSelectedPointId(null)
  }, [data, onChange])

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const nextPointId = useCallback(() => {
    const c = data._pointCounter + 1
    return { id: `point-${c}`, counter: c }
  }, [data._pointCounter])

  const addPoint = useCallback(
    (xPercent: number = 50, yPercent: number = 50) => {
      const { id, counter } = nextPointId()
      const point: LabelledDiagramPoint = {
        id,
        text: resolved.prefillNames ? `Point ${counter}` : '',
        xPercent,
        yPercent
      }
      onChange({
        ...data,
        _pointCounter: counter,
        points: [...data.points, point]
      })
      // Auto-select the new point
      setSelectedPointId(id)
    },
    [data, onChange, nextPointId, resolved.prefillNames]
  )

  const updatePoint = useCallback(
    (id: string, patch: Partial<LabelledDiagramPoint>) => {
      onChange({
        ...data,
        points: data.points.map((p) => (p.id === id ? { ...p, ...patch } : p))
      })
    },
    [data, onChange]
  )

  const deletePoint = useCallback(
    (id: string) => {
      const newPoints = data.points.filter((p) => p.id !== id)
      onChange({ ...data, points: newPoints })
      if (selectedPointId === id) {
        setSelectedPointId(null)
      }
    },
    [data, selectedPointId, onChange]
  )

  const handleImageClick = useCallback(
    (xPercent: number, yPercent: number) => {
      addPoint(xPercent, yPercent)
    },
    [addPoint]
  )

  const handlePointDrag = useCallback(
    (id: string, xPercent: number, yPercent: number) => {
      updatePoint(id, { xPercent, yPercent })
    },
    [updatePoint]
  )

  const scrollToSelectedPoint = useCallback(
    (point: LabelledDiagramPoint) => {
      setSelectedPointId(point.id)
    },
    []
  )

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEntityCreateShortcut({
    onTier1: addPoint
  })

  // ── Validation ────────────────────────────────────────────────────────────
  const unnamedPoints = data.points.filter((p) => !p.text.trim())
  const hasIssues = !data.imagePath || unnamedPoints.length > 0

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', bgcolor: '#0f1117' }}>
      {/* ── Left Panel (Point List) - Fixed width when open ── */}
      {panelOpen && (
        <Box
          sx={{
            width: 300,
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            bgcolor: '#13161f',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {/* Panel Header with Collapse Button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ letterSpacing: 2, fontSize: '0.65rem' }}
            >
              Control Panel
            </Typography>
            <IconButton
              onClick={() => setPanelOpen(false)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Panel Content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <PointListPanel
              points={data.points}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
              onUpdatePoint={updatePoint}
              onDeletePoint={deletePoint}
              onNavigateToPoint={scrollToSelectedPoint}
              getPointColor={getPointColor}
            />
          </Box>

          {/* Bottom Bar with Image Controls */}
          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              p: 1.5,
              display: 'flex',
              gap: 1,
              justifyContent: 'center'
            }}
          >
            {data.imagePath ? (
              <>
                <IconButton
                  onClick={handleSelectImage}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'text.primary' }
                  }}
                  title="Change Image"
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  onClick={handleRemoveImage}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(248,113,113,0.1)', color: 'error.main' }
                  }}
                  title="Remove Image"
                >
                  <DeleteIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </>
            ) : (
              <IconButton
                onClick={handleSelectImage}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'text.primary' }
                }}
                title="Add Image"
              >
                <AddPhotoAlternateIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}

      {/* ── FAB to expand panel when collapsed ── */}
      {!panelOpen && (
        <Fab
          onClick={() => setPanelOpen(true)}
          size="small"
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            zIndex: 1000,
            bgcolor: '#1a1d27',
            color: 'text.secondary',
            '&:hover': { bgcolor: '#232733', color: 'text.primary' },
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
        </Fab>
      )}

      {/* ── Main Image Area ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Validation Alert */}
        <Collapse in={hasIssues}>
          <Alert severity="warning" sx={{ m: 2, fontSize: '0.8rem' }}>
            {[
              !data.imagePath && 'No image selected. Click the + button in the Control Panel to add an image.',
              unnamedPoints.length > 0 &&
                `${unnamedPoints.length} point(s) missing text`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Alert>
        </Collapse>

        {/* Snackbar for warnings */}
        <Collapse in={snackbarMessage !== null}>
          <Alert
            severity="warning"
            sx={{ m: 2, fontSize: '0.8rem' }}
            onClose={() => setSnackbarMessage(null)}
          >
            {snackbarMessage}
          </Alert>
        </Collapse>

        {/* Image Viewer or Large Image Picker */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {data.imagePath ? (
            <ImageViewer
              imagePath={data.imagePath}
              projectDir={projectDir}
              points={data.points}
              selectedPointId={selectedPointId}
              onImageClick={handleImageClick}
              onPointDrag={handlePointDrag}
              getPointColor={getPointColor}
              onAddPointAtCenter={addPoint}
              onShowWarning={setSnackbarMessage}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                bgcolor: '#0a0c12'
              }}
            >
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  borderRadius: 4,
                  border: '2px dashed rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.02)'
                }}
              >
                <AddPhotoAlternateIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Add an Image to Get Started
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 400 }}>
                  Upload a diagram or image, then add labelled points that students will drag onto the correct positions
                </Typography>
              </Box>
              <Box
                onClick={handleSelectImage}
                sx={{
                  mt: 2,
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <AddPhotoAlternateIcon sx={{ fontSize: 22 }} />
                Select Image
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
