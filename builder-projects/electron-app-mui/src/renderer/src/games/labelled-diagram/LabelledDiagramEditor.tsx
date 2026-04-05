import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
  keyframes,
  styled
} from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { JSX, MouseEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import ImagePicker from '../../components/ImagePicker'
import { useAssetUrl } from '../../hooks/useAssetUrl'
import { LabelledDiagramAppData, LabelledDiagramPoint } from '../../types'

interface Props {
  appData: LabelledDiagramAppData
  projectDir: string
  onChange: (data: LabelledDiagramAppData) => void
}

const BADGE_COLORS = [
  '#f44336', // Red
  '#4caf50', // Green
  '#2196f3', // Blue
  '#ffeb3b', // Yellow
  '#9c27b0', // Purple
  '#ff9800', // Orange
  '#00bcd4', // Cyan
  '#e91e63', // Pink
  '#795548', // Brown
  '#607d8b' // Blue Grey
]

const pulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`

const hoverBadgePulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
`

const SelectedBadgeOutline = styled(Box)(() => ({
  position: 'absolute',
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: '2px solid white',
  animation: `${pulse} 2s infinite`,
  pointerEvents: 'none',
  zIndex: 9
}))

export default function LabelledDiagramEditor({
  appData,
  projectDir,
  onChange
}: Props): JSX.Element {
  const { points, imagePath } = appData
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [transform, setTransform] = useState<{
    scale: number
    positionX: number
    positionY: number
  } | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null)
  const [pendingSelectedPointId, setPendingSelectedPointId] = useState<string | null>(null)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)
  const [localPoints, setLocalPoints] = useState<LabelledDiagramPoint[]>(points)
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)

  const [prevPoints, setPrevPoints] = useState(points)
  const [prevImagePath, setPrevImagePath] = useState(imagePath)

  // If points prop changed and we aren't dragging, sync localPoints
  if (points !== prevPoints) {
    setPrevPoints(points)
    if (!draggingPointId) {
      setLocalPoints(points)
    }
  }

  // If imagePath changed, reset imgSize
  if (imagePath !== prevImagePath) {
    setPrevImagePath(imagePath)
    setImgSize(null)
  }

  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getBadgeColor = (index: number): string => {
    return BADGE_COLORS[index % BADGE_COLORS.length]
  }

  const addPoint = useCallback(
    (xPercent: number, yPercent: number) => {
      const id = `point-${Date.now()}`
      const newPoint: LabelledDiagramPoint = {
        id,
        text: `Point ${appData._pointCounter + 1}`,
        xPercent,
        yPercent
      }
      onChange({
        ...appData,
        points: [...localPoints, newPoint],
        _pointCounter: appData._pointCounter + 1
      })
      setSelectedPointId(id)
    },
    [appData, localPoints, onChange]
  )

  const updatePoint = useCallback(
    (id: string, patch: Partial<LabelledDiagramPoint>, commit = true) => {
      const nextPoints = localPoints.map((p) => (p.id === id ? { ...p, ...patch } : p))
      setLocalPoints(nextPoints)

      if (commit) {
        onChange({
          ...appData,
          points: nextPoints
        })
      }
    },
    [appData, localPoints, onChange]
  )

  const deletePoint = useCallback(
    (id: string) => {
      onChange({
        ...appData,
        points: localPoints.filter((p) => p.id !== id)
      })
      if (selectedPointId === id) setSelectedPointId(null)
    },
    [appData, localPoints, selectedPointId, onChange]
  )

  const moveToPoint = useCallback((point: LabelledDiagramPoint) => {
    if (!transformRef.current || !imgRef.current) return

    const { scale } = transformRef.current.instance.transformState
    const imgWidth = imgRef.current.offsetWidth
    const imgHeight = imgRef.current.offsetHeight

    const targetX = (point.xPercent / 100) * imgWidth
    const targetY = (point.yPercent / 100) * imgHeight

    const wrapperWidth = wrapperRef.current?.offsetWidth ?? 0
    const wrapperHeight = wrapperRef.current?.offsetHeight ?? 0

    const posX = wrapperWidth / 2 - targetX * scale
    const posY = wrapperHeight / 2 - targetY * scale

    transformRef.current.setTransform(posX, posY, scale)
    setSelectedPointId(point.id)
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  const addCenterPointView = useCallback(() => {
    if (!wrapperRef.current || !imgSize) {
      addPoint(50, 50)
      return
    }
    if (!transform) return
    const { scale, positionX, positionY } = transform
    const wrapperWidth = wrapperRef.current.offsetWidth
    const wrapperHeight = wrapperRef.current.offsetHeight
    const { width: imgWidth, height: imgHeight } = imgSize

    const imgLocalX = (wrapperWidth / 2 - positionX) / scale
    const imgLocalY = (wrapperHeight / 2 - positionY) / scale

    const xPercent = (imgLocalX / imgWidth) * 100
    const yPercent = (imgLocalY / imgHeight) * 100

    addPoint(Math.max(0, Math.min(100, xPercent)), Math.max(0, Math.min(100, yPercent)))
  }, [addPoint, transform, imgSize])

  useEntityCreateShortcut({
    onTier1: addCenterPointView
  })

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (!selectedPointId) return

      // Don't delete if we're typing in a TextField
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        deletePoint(selectedPointId)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPointId, deletePoint])

  // ── Drag & Drop Logic ──────────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!imgRef.current || !wrapperRef.current || !imgSize) return

      const { width: imgWidth, height: imgHeight } = imgSize
      const rect = wrapperRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const { scale, positionX, positionY } = transform || { scale: 1, positionX: 0, positionY: 0 }

      // Calculate hover status
      const threshold = 15
      let foundHoveredId: string | null = null
      localPoints.forEach((p) => {
        const badgeX = (p.xPercent / 100) * imgWidth * scale + positionX
        const badgeY = (p.yPercent / 100) * imgHeight * scale + positionY
        const dist = Math.sqrt((mouseX - badgeX) ** 2 + (mouseY - badgeY) ** 2)
        if (dist < threshold + 10) foundHoveredId = p.id
      })
      setHoveredPointId(foundHoveredId)

      // Only continue if dragging a point
      if (!draggingPointId) return

      const imgLocalX = (mouseX - positionX) / scale
      const imgLocalY = (mouseY - positionY) / scale

      let xPercent = (imgLocalX / imgWidth) * 100
      let yPercent = (imgLocalY / imgHeight) * 100

      // Clamp
      xPercent = Math.max(0, Math.min(100, xPercent))
      yPercent = Math.max(0, Math.min(100, yPercent))

      updatePoint(draggingPointId, { xPercent, yPercent }, false) // Don't commit yet
    },
    [draggingPointId, transform, localPoints, updatePoint, imgSize]
  )

  const handleMouseUp = useCallback(
    (e: globalThis.MouseEvent) => {
      if (mouseDownPos) {
        const dx = Math.abs(e.clientX - mouseDownPos.x)
        const dy = Math.abs(e.clientY - mouseDownPos.y)
        if (dx < 5 && dy < 5) {
          // It's a click, not a drag/pan
          setSelectedPointId(pendingSelectedPointId)
        }
      }

      if (draggingPointId) {
        // Commit final position to history
        onChange({
          ...appData,
          points: localPoints
        })
      }
      setDraggingPointId(null)
      setMouseDownPos(null)
      setPendingSelectedPointId(null)
    },
    [draggingPointId, appData, localPoints, onChange, mouseDownPos, pendingSelectedPointId]
  )

  useEffect(() => {
    // We always want to track mouse for hover effects
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // ── Mouse Interaction ──────────────────────────────────────────────────────

  const handleInteraction = (e: MouseEvent, type: 'click' | 'doubleClick' | 'mouseDown'): void => {
    if (!imgRef.current || !wrapperRef.current || !imgSize) return

    const rect = wrapperRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const { scale, positionX, positionY } = transform || { scale: 1, positionX: 0, positionY: 0 }

    if (!imgSize) return

    const { width: imgWidth, height: imgHeight } = imgSize

    if (type === 'mouseDown') {
      setMouseDownPos({ x: e.clientX, y: e.clientY })

      // Check if clicked ON a point
      const threshold = 15 // pixels
      let foundPointId: string | null = null

      localPoints.forEach((p) => {
        const badgeX = (p.xPercent / 100) * imgWidth * scale + positionX
        const badgeY = (p.yPercent / 100) * imgHeight * scale + positionY
        const dist = Math.sqrt((clickX - badgeX) ** 2 + (clickY - badgeY) ** 2)
        if (dist < threshold + 10) {
          // Slightly larger hit area for ease of use
          foundPointId = p.id
        }
      })

      if (foundPointId) {
        if (foundPointId === selectedPointId) {
          // Already selected, start dragging
          setDraggingPointId(foundPointId)
          e.preventDefault() // Stop native browser drag
          e.stopPropagation() // Prevent library from panning
        } else {
          // Pend selection (only confirm on MouseUp if not moved)
          setPendingSelectedPointId(foundPointId)
        }
      } else {
        // Prepare to deselect on MouseUp
        setPendingSelectedPointId(null)
      }
      return
    }

    if (type === 'doubleClick') {
      const imgLocalX = (clickX - positionX) / scale
      const imgLocalY = (clickY - positionY) / scale
      const xPercent = (imgLocalX / imgWidth) * 100
      const yPercent = (imgLocalY / imgHeight) * 100

      if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
        addPoint(xPercent, yPercent)
      }
      return
    }
  }

  // ── Rendering Badges ───────────────────────────────────────────────────────

  const renderBadges = (): JSX.Element[] | null => {
    if (!imgSize || !transform) return null

    const { scale, positionX, positionY } = transform
    const { width: imgWidth, height: imgHeight } = imgSize

    return localPoints.map((p, index) => {
      const isSelected = selectedPointId === p.id
      const isHovered = hoveredPointId === p.id
      const left = (p.xPercent / 100) * imgWidth * scale + positionX
      const top = (p.yPercent / 100) * imgHeight * scale + positionY

      return (
        <Box key={p.id}>
          {isSelected && <SelectedBadgeOutline sx={{ left, top }} />}
          <Box
            sx={{
              position: 'absolute',
              left,
              top,
              animation: isHovered ? `${hoverBadgePulse} 1s ease-in-out infinite` : 'none',
              transform: 'translate(-50%, -50%)',
              width: 32, // Bigger
              height: 32, // Bigger
              borderRadius: '50%',
              backgroundColor: getBadgeColor(index),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem', // Bigger font
              fontWeight: 'bold', // Bold
              boxShadow: isSelected ? '0 0 15px white' : '0 2px 4px rgba(0,0,0,0.3)',
              border: '2px solid white',
              pointerEvents: 'none', // Keep it none so events pass through to wrapper
              zIndex: isSelected ? 11 : 10,
              cursor: isSelected ? 'grab' : 'pointer'
            }}
          >
            {index + 1}
          </Box>
        </Box>
      )
    })
  }

  const { data: imageUrl } = useAssetUrl(projectDir, imagePath)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* ── Left Sidebar ── */}
      <Box
        sx={{
          width: sidebarCollapsed ? 60 : 300,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#13161f',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 20
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!sidebarCollapsed && (
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Points
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            sx={{ ml: 'auto' }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>

        {!sidebarCollapsed && (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {localPoints.map((p, index) => (
              <Paper
                key={p.id}
                elevation={0}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).tagName !== 'INPUT' &&
                    !(e.target as HTMLElement).closest('button')
                  ) {
                    moveToPoint(p)
                  }
                }}
                sx={{
                  p: 1.5,
                  backgroundColor:
                    selectedPointId === p.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border:
                    selectedPointId === p.id
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: getBadgeColor(index),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Box>
                  <TextField
                    size="small"
                    variant="standard"
                    value={p.text}
                    onChange={(e) => updatePoint(p.id, { text: e.target.value })}
                    fullWidth
                    placeholder="Enter point label..."
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: '0.875rem' }
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deletePoint(p.id)}
                    sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="caption" color="text.disabled">
                    X: {p.xPercent.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Y: {p.yPercent.toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            ))}

            {localPoints.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                <Typography variant="body2">No points added yet.</Typography>
                <Typography variant="caption">Double click to add a point.</Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={addCenterPointView}
              sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', mt: 1 }}
            >
              Add Point at View Center
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Main Viewport ── */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1d26',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {!imagePath ? (
          <Box
            sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Box sx={{ width: 400, p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                Add Background Image
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Upload an image to start labelling your diagram. Use high-quality diagrams for
                better results.
              </Typography>
              <ImagePicker
                label="Select Diagram Image"
                value={imagePath}
                projectDir={projectDir}
                desiredNamePrefix="diagram"
                onChange={(path) => onChange({ ...appData, imagePath: path })}
              />
            </Box>
          </Box>
        ) : (
          <>
            <Box
              ref={wrapperRef}
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                cursor: draggingPointId ? 'grabbing' : 'default'
              }}
              onMouseDown={(e) => handleInteraction(e, 'mouseDown')}
              onDoubleClick={(e) => handleInteraction(e, 'doubleClick')}
              onDragStart={(e) => e.preventDefault()} // Block native image dragging
            >
              <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.85}
                maxScale={10}
                centerOnInit
                disabled={!!draggingPointId} // IMPORTANT: Disable pan when dragging a point
                doubleClick={{ disabled: true }}
                onInit={(ref) => setTransform({ ...ref.state })}
                onTransformed={(ref) => setTransform({ ...ref.state })}
                onPanning={(ref) => setTransform({ ...ref.state })}
                onZoom={(ref) => setTransform({ ...ref.state })}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    {/* Controls overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 24,
                        right: 24,
                        zIndex: 30,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                        p: 0.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()} // Stop points from being created here
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="Zoom In" placement="left">
                        <IconButton size="small" onClick={() => zoomIn()}>
                          <ZoomInIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zoom Out" placement="left">
                        <IconButton size="small" onClick={() => zoomOut()}>
                          <ZoomOutIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset View" placement="left">
                        <IconButton size="small" onClick={() => resetTransform()}>
                          <RestartAltIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <TransformComponent
                      wrapperStyle={{
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Diagram"
                        draggable={false} // Disable native drag
                        style={{
                          pointerEvents: 'auto',
                          userSelect: 'none',
                          maxWidth: 'none'
                        }}
                        onLoad={(e) => {
                          const img = e.currentTarget
                          setImgSize({ width: img.offsetWidth, height: img.offsetHeight })
                        }}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>

              {/* Badges layer - rendered outside TransformComponent but inside wrapper */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'hidden'
                }}
              >
                {renderBadges()}
              </Box>
            </Box>

            {/* Top Toolbar */}
            <Box
              sx={{
                position: 'absolute',
                top: 24,
                left: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                px: 2,
                py: 1,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 30
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {points.length} Points Added
              </Typography>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <Typography variant="caption" color="text.secondary">
                Double click to add points. Click to select. Drag selected point to move.
              </Typography>
              <IconButton
                size="small"
                onClick={() => onChange({ ...appData, imagePath: null })}
                color="inherit"
                sx={{ ml: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}
