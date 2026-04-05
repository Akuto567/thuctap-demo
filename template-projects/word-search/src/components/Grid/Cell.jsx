import React from "react";
import "../../styles/grid.css";

export default function Cell({
  letter,
  row,
  col,
  isSelected,
  isFound,
  isHint,
  onPointerDown,
  onPointerEnter,
  onPointerUp
}) {
  const classes = ["cell"];
  if (isSelected) classes.push("selected");
  if (isFound) classes.push("found");
  
  return (
    <div
      className={classes.join(" ")}
      data-word-cell="true"
      data-row={row}
      data-col={col}
      onPointerDown={(event) => onPointerDown?.(row, col, event.pointerType)}
      onPointerEnter={() => onPointerEnter?.(row, col)}
      onPointerUp={() => onPointerUp?.()}
    >
      {letter}
      {isHint === true && <div className="hint-marker" />}
    </div>
  );
}
