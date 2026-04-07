import { Box } from '@mui/material'
import { useEntityCreateShortcut } from '@renderer/hooks/useEntityCreateShortcut'
import { JSX, useCallback, useEffect, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useAssetUrl } from '../../hooks/useAssetUrl'
import { LabelledDiagramAppData } from '../../types'
import {
  DiagramBadge,
  DiagramControls,
  DiagramEmptyState,
  DiagramSidebar,
  DiagramToolbar
} from './components'
import { useDiagramInteraction } from './hooks/useDiagramInteraction'
import { useLabelledDiagramPoints } from './hooks/useLabelledDiagramPoints'
import { gridBackground } from './styles'

interface Props {
  appData: LabelledDiagramAppData
  projectDir: string
  onChange: (data: LabelledDiagramAppData) => void
}

/**
 * Main editor for Labelled Diagram games.
 * Features an interactive canvas where points can be placed, moved, and labelled.
 * Supports zoom, pan, and responsive animations.
 */
export default function LabelledDiagramEditor({
  appData,
  projectDir,
  onChange
}: Props): JSX.Element {
  const { imagePath } = appData
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)
  const [prevImagePath, setPrevImagePath] = useState(imagePath)

  // ── Shared Interaction State ──
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null)

  // ── Logic Hooks ──

  const pointsManager = useLabelledDiagramPoints({
    appData,
    draggingPointId,
    setDraggingPointId,
    onChange
  })

  const { localPoints, addPoint, updatePoint, deletePoint } = pointsManager

  const interaction = useDiagramInteraction({
    appData,
    localPoints,
    imgSize,
    selectedPointId,
    setSelectedPointId,
    draggingPointId,
    setDraggingPointId,
    addPoint,
    updatePoint,
    onChange
  })

  const {
    transform,
    setTransform,
    hoveredPointId,
    transformRef,
    imgRef,
    wrapperRef,
    moveToPoint,
    handleInteraction
  } = interaction

  // Sync image size tracking with current background image
  if (imagePath !== prevImagePath) {
    setPrevImagePath(imagePath)
    setImgSize(null)
  }

  // ── Viewport Actions ──

  const addPointAtCenter = useCallback(() => {
    if (!wrapperRef.current || !imgSize) {
      addPoint(50, 50, setSelectedPointId)
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

    addPoint(
      Math.max(0, Math.min(100, xPercent)),
      Math.max(0, Math.min(100, yPercent)),
      setSelectedPointId
    )
  }, [addPoint, transform, imgSize, setSelectedPointId, wrapperRef])

  // System-wide creation shortcut (usually 'N')
  useEntityCreateShortcut({
    onTier1: addPointAtCenter
  })

  // ── Keyboard Management ──

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (!selectedPointId) return

      const activeEl = document.activeElement as HTMLElement
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        deletePoint(selectedPointId, selectedPointId, setSelectedPointId)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPointId, deletePoint, setSelectedPointId])

  const { data: imageUrl } = useAssetUrl(projectDir, imagePath)

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <DiagramSidebar
        points={localPoints}
        selectedPointId={selectedPointId}
        onSelectPoint={moveToPoint}
        onUpdatePointText={(id, text) => updatePoint(id, { text })}
        onDeletePoint={(id) => deletePoint(id, selectedPointId, setSelectedPointId)}
        onAddPointAtCenter={addPointAtCenter}
      />

      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          ...gridBackground
        }}
      >
        {!imagePath ? (
          <DiagramEmptyState appData={appData} projectDir={projectDir} onChange={onChange} />
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
              onDragStart={(e) => e.preventDefault()}
            >
              <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.75}
                maxScale={10}
                centerOnInit
                limitToBounds={true}
                panning={{ velocityDisabled: true }}
                centerZoomedOut={true}
                disabled={!!draggingPointId}
                doubleClick={{ disabled: true }}
                onInit={(ref) => setTransform({ ...ref.state })}
                onTransformed={(ref) => setTransform({ ...ref.state })}
                onPanning={(ref) => setTransform({ ...ref.state })}
                onZoom={(ref) => setTransform({ ...ref.state })}
              >
                {(controls) => (
                  <>
                    <DiagramControls {...controls} />
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Diagram"
                        draggable={false}
                        style={{ pointerEvents: 'auto', userSelect: 'none', maxWidth: 'none' }}
                        onLoad={(e) => {
                          const img = e.currentTarget
                          setImgSize({ width: img.offsetWidth, height: img.offsetHeight })
                        }}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>

              {/* The badges layer must be outside TransformComponent to handle their own absolute positioning */}
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
                {imgSize &&
                  transform &&
                  localPoints.map((p, idx) => (
                    <DiagramBadge
                      key={p.id}
                      point={p}
                      index={idx}
                      isSelected={selectedPointId === p.id}
                      isHovered={hoveredPointId === p.id}
                      imgWidth={imgSize.width}
                      imgHeight={imgSize.height}
                      scale={transform.scale}
                      positionX={transform.positionX}
                      positionY={transform.positionY}
                    />
                  ))}
              </Box>
            </Box>

            <DiagramToolbar
              appData={appData}
              pointsCount={localPoints.length}
              onChange={onChange}
            />
          </>
        )}
      </Box>
    </Box>
  )
}
