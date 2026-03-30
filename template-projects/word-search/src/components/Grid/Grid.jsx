import Cell from "./Cell";
import "../../styles/grid.css";

export default function Grid({
  grid,
  selectedCells = [],
  foundCells = [],
  onPointerDown,
  onPointerEnter,
  onPointerMove,
  onPointerUp
}) {
  const isSelected = (row, col) =>
    selectedCells.some((cell) => cell.row === row && cell.col === col);

  const isFound = (row, col) =>
    foundCells?.some((cell) => cell.row === row && cell.col === col);

  const rowCount = grid.length || 12;
  const colCount = grid.reduce(
    (max, row) => Math.max(max, row?.length || 0),
    rowCount || 12
  );

  return (
    <div
      className="grid-shell"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="grid"
        style={{
          "--grid-columns": colCount,
          "--grid-rows": rowCount
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <Cell
              key={rowIndex + "-" + colIndex}
              letter={letter}
              row={rowIndex}
              col={colIndex}
              isSelected={isSelected(rowIndex, colIndex)}
              isFound={isFound(rowIndex, colIndex)}
              onPointerDown={onPointerDown}
              onPointerEnter={onPointerEnter}
              onPointerUp={onPointerUp}
            />
          ))
        )}
      </div>
    </div>
  );
}
