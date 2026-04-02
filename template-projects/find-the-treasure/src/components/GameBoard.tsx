import { useMemo, useState } from 'react'
import type { MascotMood, Stage, StageResult } from '../types'
import { Mascot } from './Mascot'

const islandImages = [
  '/assets/images/island_1.svg',
  '/assets/images/island_2.svg',
  '/assets/images/island_3.svg',
  '/assets/images/island_4.svg',
  '/assets/images/island_5.svg',
]
const moneyChest = '/assets/images/moneychest.svg'
const ISLAND_NODE_WIDTH = 122
const ISLAND_ART_SIZE = 70
const ISLAND_HORIZONTAL_SHIFT = 50
const ISLAND_ROUTE_EDGE_OFFSET = ISLAND_ART_SIZE / 2 - 4
const TREASURE_ROUTE_EDGE_OFFSET = 38
const STAGES_PER_PAGE = 5
const MAP_WIDTH = 940
const MAP_HEIGHT = 430
const MAP_SIDE_PADDING = ISLAND_NODE_WIDTH / 2 + 12
const MAP_TOP_PADDING = ISLAND_ART_SIZE / 2 + 12
const MAP_BOTTOM_PADDING = ISLAND_ART_SIZE / 2 + 12
const MIN_STAGE_CENTER_GAP = ISLAND_NODE_WIDTH + 8
const ROUTE_LANES = [MAP_TOP_PADDING, MAP_HEIGHT / 2, MAP_HEIGHT - MAP_BOTTOM_PADDING]
const ROUTE_CURVE_RATIO = 0.34
const MAX_HORIZONTAL_JITTER = 14
const MAX_VERTICAL_JITTER = 10
const LANE_PATTERNS = [
  [1, 0, 2, 1, 0],
  [1, 2, 0, 1, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
]

type RoutePoint = {
  top: number
  left: number
}

function createSeed(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createRandom(seed: number) {
  let current = seed

  return () => {
    current += 0x6d2b79f5
    let value = Math.imul(current ^ (current >>> 15), current | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createEdgeAnchors(
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  startOffset = ISLAND_ROUTE_EDGE_OFFSET,
  endOffset = ISLAND_ROUTE_EDGE_OFFSET,
) {
  const deltaX = endPoint.left - startPoint.left
  const deltaY = endPoint.top - startPoint.top
  const distance = Math.hypot(deltaX, deltaY)

  if (distance === 0) {
    return {
      startAnchor: startPoint,
      endAnchor: endPoint,
    }
  }

  const usableDistance = Math.max(distance - 8, 0)
  const scale = Math.min(1, usableDistance / (startOffset + endOffset))
  const startShift = startOffset * scale
  const endShift = endOffset * scale
  const unitX = deltaX / distance
  const unitY = deltaY / distance

  return {
    startAnchor: {
      left: startPoint.left + unitX * startShift,
      top: startPoint.top + unitY * startShift,
    },
    endAnchor: {
      left: endPoint.left - unitX * endShift,
      top: endPoint.top - unitY * endShift,
    },
  }
}

function createOrderedIslandPoints(stageCount: number, random: () => number) {
  if (stageCount === 0) {
    return []
  }

  const minLeft = MAP_SIDE_PADDING
  const maxLeft = MAP_WIDTH - MAP_SIDE_PADDING - ISLAND_HORIZONTAL_SHIFT
  const minTop = MAP_TOP_PADDING
  const maxTop = MAP_HEIGHT - MAP_BOTTOM_PADDING

  if (stageCount === 1) {
    return [
      {
        left: (minLeft + maxLeft) / 2,
        top: ROUTE_LANES[1],
      },
    ]
  }

  const points: RoutePoint[] = []
  const baseGap = (maxLeft - minLeft) / (stageCount - 1)
  const pattern =
    LANE_PATTERNS[Math.floor(random() * LANE_PATTERNS.length)] ?? LANE_PATTERNS[0]
  const maxJitter = Math.min(
    MAX_HORIZONTAL_JITTER,
    Math.max(0, (baseGap - MIN_STAGE_CENTER_GAP) / 2),
  )

  for (let index = 0; index < stageCount; index += 1) {
    const baseLeft = minLeft + baseGap * index
    const reservedLeft = minLeft + MIN_STAGE_CENTER_GAP * index
    const reservedRight =
      maxLeft - MIN_STAGE_CENTER_GAP * (stageCount - index - 1)
    const horizontalJitter =
      index === 0 || index === stageCount - 1 ? 0 : (random() - 0.5) * maxJitter * 2
    const laneIndex = pattern[index % pattern.length] ?? 1
    const verticalJitter = (random() - 0.5) * MAX_VERTICAL_JITTER * 2

    points.push({
      left: clamp(baseLeft + horizontalJitter, reservedLeft, reservedRight),
      top: clamp(ROUTE_LANES[laneIndex] + verticalJitter, minTop, maxTop),
    })
  }

  return points
}

function createRouteSegmentPath(
  startPoint: RoutePoint,
  endPoint: RoutePoint,
  startOffset = ISLAND_ROUTE_EDGE_OFFSET,
  endOffset = ISLAND_ROUTE_EDGE_OFFSET,
) {
  const { startAnchor, endAnchor } = createEdgeAnchors(
    startPoint,
    endPoint,
    startOffset,
    endOffset,
  )
  const deltaX = endAnchor.left - startAnchor.left
  const deltaY = endAnchor.top - startAnchor.top
  const horizontalOffset = deltaX * ROUTE_CURVE_RATIO
  const verticalOffset = clamp(deltaY * 0.2, -30, 30)
  const controlPointOne = {
    left: startAnchor.left + horizontalOffset,
    top: startAnchor.top + verticalOffset,
  }
  const controlPointTwo = {
    left: endAnchor.left - horizontalOffset,
    top: endAnchor.top - verticalOffset,
  }

  return `M ${startAnchor.left} ${startAnchor.top} C ${controlPointOne.left} ${controlPointOne.top}, ${controlPointTwo.left} ${controlPointTwo.top}, ${endAnchor.left} ${endAnchor.top}`
}

function createRouteSegments(
  points: RoutePoint[],
  treasurePoint?: RoutePoint | null,
) {
  const routePoints = treasurePoint ? [...points, treasurePoint] : points

  if (routePoints.length < 2) {
    return []
  }

  return routePoints.slice(0, -1).map((point, index) =>
    createRouteSegmentPath(
      point,
      routePoints[index + 1],
      ISLAND_ROUTE_EDGE_OFFSET,
      treasurePoint && index === routePoints.length - 2
        ? TREASURE_ROUTE_EDGE_OFFSET
        : ISLAND_ROUTE_EDGE_OFFSET,
    ),
  )
}

function createRouteLayout(
  stages: Stage[],
  currentPage: number,
  layoutSeed: number,
) {
  const random = createRandom(
    createSeed(
      `${layoutSeed}-${currentPage}-${stages.map((stage) => stage.id).join('-')}`,
    ),
  )
  const anchoredRoutePoints = createOrderedIslandPoints(stages.length, random)
  const shiftedRoutePoints = anchoredRoutePoints.map((point) => ({
    ...point,
    left: point.left + ISLAND_HORIZONTAL_SHIFT,
  }))
  const islandPositions = shiftedRoutePoints.map((point) => ({
    left: point.left - ISLAND_NODE_WIDTH / 2,
    top: point.top - ISLAND_ART_SIZE / 2,
  }))

  return { islandPositions, routePoints: shiftedRoutePoints }
}

type GameBoardProps = {
  stages: Stage[]
  currentStageIndex: number
  layoutSeed: number
  stageResults: StageResult[]
  mascotMood: MascotMood
  gameFinished: boolean
  mascotTargetIndex: number | null
  isHeadingToTreasure: boolean
  openedStageIndex: number | null
  onOpenStage: (stageIndex: number) => void
  onOpenTreasure: () => void
}

export function GameBoard({
  stages,
  currentStageIndex,
  layoutSeed,
  stageResults,
  mascotMood,
  gameFinished,
  mascotTargetIndex,
  isHeadingToTreasure,
  openedStageIndex,
  onOpenStage,
  onOpenTreasure,
}: GameBoardProps) {
  const totalPages = Math.ceil(stages.length / STAGES_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(0)

  const stagePage = useMemo(() => {
    const startIndex = currentPage * STAGES_PER_PAGE
    return stages.slice(startIndex, startIndex + STAGES_PER_PAGE)
  }, [currentPage, stages])

  const routeLayout = useMemo(
    () => createRouteLayout(stagePage, currentPage, layoutSeed),
    [currentPage, layoutSeed, stagePage],
  )
  const startPosition = { top: 300, left: 8 }
  const treasurePosition = { top: 100, left: 994 }
  const showTreasureMarker = currentPage === totalPages - 1
  const islandPositions = routeLayout.islandPositions
  const landingPositions = routeLayout.routePoints
  const routeSegments = createRouteSegments(
    landingPositions,
    showTreasureMarker ? treasurePosition : null,
  )
  const visibleStageStart = currentPage * STAGES_PER_PAGE
  const visibleStageEnd = visibleStageStart + stagePage.length - 1
  const isFreshRun =
    currentStageIndex === 0 &&
    stageResults.length === 0 &&
    !gameFinished &&
    mascotTargetIndex === null
  const currentStageVisible =
    currentStageIndex >= visibleStageStart && currentStageIndex <= visibleStageEnd
  const mascotTargetVisible =
    mascotTargetIndex !== null &&
    mascotTargetIndex >= visibleStageStart &&
    mascotTargetIndex <= visibleStageEnd
  const pageCompleted = visibleStageEnd < stageResults.length
  const mascotPosition =
    isFreshRun
      ? startPosition
      : isHeadingToTreasure
      ? treasurePosition
      : mascotTargetIndex === null || !currentStageVisible || !mascotTargetVisible
      ? startPosition
      : landingPositions[
          gameFinished
            ? Math.min(stagePage.length - 1, stages.length - 1 - visibleStageStart)
            : mascotTargetIndex - visibleStageStart
        ]

  return (
    <section className="board-card">
      <div className="board-sky">
        <div className="board-header">
          <div className="board-header-copy">
            <p className="section-label">Adventure map</p>
          </div>
          {totalPages > 1 ? (
            <div className="board-pagination" aria-label="Question pages">
              <span className="page-indicator">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                className="page-button"
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages - 1, page + 1))
                }
                disabled={currentPage === totalPages - 1}
                hidden={!pageCompleted || currentPage === totalPages - 1}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <svg
          className="route-line"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {routeSegments.map((segmentPath, index) => (
            <path key={`${currentPage}-${index}`} d={segmentPath} />
          ))}
        </svg>
        {showTreasureMarker ? (
          <button
            type="button"
            className={`treasure-marker ${gameFinished ? 'ready' : 'locked'}`}
            aria-label="Treasure at the end of the adventure"
            onClick={onOpenTreasure}
            disabled={!gameFinished}
          >
            <img className="treasure-chest" src={moneyChest} alt="Treasure chest" />
            <span className="treasure-label">
              {gameFinished ? 'Open treasure' : 'Finish all stages'}
            </span>
          </button>
        ) : null}

        <div className="island-map">
          {stagePage.map((stage, pageIndex) => {
            const index = visibleStageStart + pageIndex
            const result = stageResults[index]
            const isActive = index === currentStageIndex && !gameFinished
            const isComplete = index < stageResults.length
            const isOpened = openedStageIndex === index
            const isLocked = index > currentStageIndex && !gameFinished

            return (
              <button
                key={stage.id}
                type="button"
                className={[
                  'island-node',
                  isActive ? 'active' : '',
                  isComplete ? 'complete' : '',
                  isOpened ? 'opened' : '',
                  isLocked ? 'locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={islandPositions[pageIndex]}
                onClick={() => onOpenStage(index)}
              >
                <span className="island-art-shell">
                  <img
                    className="island-art"
                    src={islandImages[pageIndex % islandImages.length]}
                    alt={`${stage.location} island`}
                  />
                </span>
                <span className="stage-badge">Stage {index + 1}</span>
                <div className="island-label">
                  <h3>{stage.location}</h3>
                  <div className="island-meta">
                    <span>{stage.points} pts</span>
                    <span>
                      {result
                        ? result.isCorrect
                          ? 'Cleared'
                          : 'Answered'
                        : isActive
                          ? 'Click to play'
                          : 'Locked'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <Mascot position={mascotPosition} mood={mascotMood} />
      </div>
    </section>
  )
}
