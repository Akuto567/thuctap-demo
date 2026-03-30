import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GamePreview from "../components/Game/GamePreview";
import { generateWordSearch } from "../engine/generateWordSearch";

const customBackground = "";

export default function WordSearchPage() {
  const [items] = useState(window.APP_DATA?.items || [
    { word: "CAT", image: "🐱" },
    { word: "FLOWER", image: "🌸" },
    { word: "JUMP", image: "🦘" },
    { word: "BIRD", image: "🐦" },
    { word: "STAR", image: "⭐" }
  ]);
  const [background] = useState(window.APP_DATA?.background || customBackground);
  const [grid, setGrid] = useState([]);
  const [foundCells, setFoundCells] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [showCongrats, setShowCongrats] = useState(false);

  const isDraggingRef = useRef(false);
  const anchorCellRef = useRef(null);
  const selectedRef = useRef([]);
  const directionRef = useRef(null);

  const SNAP_DIRECTIONS = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 }
  ];

  const generateGame = () => {
    const words = items
      .map((item) => item.word.trim().toUpperCase())
      .filter((word) => word);

    if (words.length === 0) {
      return;
    }

    const result = generateWordSearch(words, 12);
    setGrid(result.grid);
    setPlacements(result.placements);
    setFoundCells([]);
    setFoundWords([]);
    setSelectedCells([]);
    setShowPreview(true);
  };

  useEffect(() => {
    generateGame();
  }, []);

  useEffect(() => {
    if (foundWords.length === placements.length && placements.length > 0) {
      setShowCongrats(true);
    }
  }, [foundWords, placements]);

  const buildSelection = (start, direction, steps) => {
    if (!direction || steps <= 0) {
      return [start];
    }

    return Array.from({ length: steps + 1 }, (_, index) => ({
      row: start.row + direction.dy * index,
      col: start.col + direction.dx * index
    }));
  };

  const getMaxStepsInDirection = (start, direction) => {
    const rowCount = grid.length;
    const colCount = grid[0]?.length || 0;

    if (!rowCount || !colCount) {
      return 0;
    }

    const rowLimit =
      direction.dy > 0
        ? rowCount - 1 - start.row
        : direction.dy < 0
          ? start.row
          : Number.POSITIVE_INFINITY;

    const colLimit =
      direction.dx > 0
        ? colCount - 1 - start.col
        : direction.dx < 0
          ? start.col
          : Number.POSITIVE_INFINITY;

    return Math.min(rowLimit, colLimit);
  };

  const getSnappedSelection = (start, target) => {
    const deltaCol = target.col - start.col;
    const deltaRow = target.row - start.row;

    if (deltaCol === 0 && deltaRow === 0) {
      return {
        direction: null,
        cells: [start]
      };
    }

    const bestMatch = SNAP_DIRECTIONS.reduce((best, direction) => {
      const denominator = direction.dx * direction.dx + direction.dy * direction.dy;
      const projectedSteps = Math.round(
        ((deltaCol * direction.dx) + (deltaRow * direction.dy)) / denominator
      );

      if (projectedSteps <= 0) {
        return best;
      }

      const steps = Math.min(projectedSteps, getMaxStepsInDirection(start, direction));
      if (steps <= 0) {
        return best;
      }

      const projectedCell = {
        row: start.row + direction.dy * steps,
        col: start.col + direction.dx * steps
      };

      const error =
        Math.abs(target.row - projectedCell.row) +
        Math.abs(target.col - projectedCell.col);

      if (!best || error < best.error || (error === best.error && steps > best.steps)) {
        return { direction, steps, error };
      }

      return best;
    }, null);

    if (!bestMatch) {
      return {
        direction: null,
        cells: [start]
      };
    }

    return {
      direction: bestMatch.direction,
      cells: buildSelection(start, bestMatch.direction, bestMatch.steps)
    };
  };

  const extendSelection = (row, col) => {
    if (!isDraggingRef.current) {
      return;
    }

    const startCell = anchorCellRef.current;
    if (!startCell) {
      return;
    }

    const { direction, cells } = getSnappedSelection(startCell, { row, col });
    directionRef.current = direction;
    selectedRef.current = cells;
    setSelectedCells([...selectedRef.current]);
  };

  const handlePointerDown = (row, col) => {
    isDraggingRef.current = true;
    const cell = { row, col };
    anchorCellRef.current = cell;
    selectedRef.current = [cell];
    setSelectedCells([cell]);
    directionRef.current = null;
  };

  const handlePointerEnter = (row, col) => {
    extendSelection(row, col);
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) {
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target?.closest?.("[data-word-cell='true']");
    if (!cell) {
      return;
    }

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }

    extendSelection(row, col);
  };

  const checkWord = (cells) => {
    const coords = cells.map((cell) => ({
      row: cell.row ?? +cell.dataset.row,
      col: cell.col ?? +cell.dataset.col
    }));

    for (const placement of placements) {
      if (coords.length !== placement.positions.length) {
        continue;
      }

      const forwardMatch = placement.positions.every(
        (pos, index) => pos.row === coords[index].row && pos.col === coords[index].col
      );
      if (forwardMatch) {
        return placement.word;
      }

      const backwardMatch = placement.positions.every((pos, index) => {
        const reverseIndex = coords.length - 1 - index;
        return (
          pos.row === coords[reverseIndex].row &&
          pos.col === coords[reverseIndex].col
        );
      });
      if (backwardMatch) {
        return placement.word;
      }
    }

    return null;
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    const foundWord = checkWord(selectedRef.current);

    if (foundWord) {
      const placement = placements.find((item) => item.word === foundWord);
      if (placement) {
        setFoundCells((prev) => [...prev, ...placement.positions]);
        setFoundWords((prev) => {
          if (prev.includes(foundWord)) {
            return [...prev];
          }
          return [...prev, foundWord];
        });
      }
    }

    selectedRef.current = [];
    anchorCellRef.current = null;
    setSelectedCells([]);
    directionRef.current = null;
  };

  const handleRestart = () => {
    setShowCongrats(false);
    generateGame();
  };

  return (
    <>
      <div className="game-page">
        {showPreview && (
          <GamePreview
            grid={grid}
            items={items}
            background={background}
            selectedCells={selectedCells}
            foundCells={foundCells}
            foundWords={foundWords}
            onPointerDown={handlePointerDown}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}
      </div>

      <div
        className="game-page"
        style={{
          pointerEvents: showCongrats ? "none" : "auto",
          filter: showCongrats ? "blur(2px)" : "none"
        }}
      />

      {showCongrats &&
        createPortal(
          <div className="popup-overlay">
            <div className="popup-content popup-card">
              <div className="popup-badge">Complete</div>
              <h2 className="popup-title">Congratulations!</h2>

              <p className="popup-text">
                You found all the words in this puzzle.
              </p>

              <div className="popup-stats">
                <div className="popup-stat">
                  <span className="popup-stat-value">{placements.length}</span>
                  <span className="popup-stat-label">Words found</span>
                </div>
                <div className="popup-stat">
                  <span className="popup-stat-value">100%</span>
                  <span className="popup-stat-label">Progress</span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="popup-btn"
              >
                Play Again
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
