import { useDroppable } from "@dnd-kit/core";
import type { Point } from "../types/diagram";

interface Props {
  point: Point;
  placedLabelId?: string;
}

const DropZone: React.FC<Props> = ({ point, placedLabelId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: point.id,
  });

  const isCorrect = placedLabelId === point.id;

  return (
    <div
      ref={setNodeRef}
      className="absolute"
      style={{
        left: `${point.xPercent}%`,
        top: `${point.yPercent}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* 🔥 UI CIRCLE */}
      <div
        className={`
          flex items-center justify-center
          w-9 h-9 rounded-full text-sm font-bold
          shadow-lg border border-white/30
          transition-all duration-200

          ${isOver ? "scale-110 bg-cyan-400" : ""}
          ${
            isCorrect
              ? "bg-green-400 text-black"
              : placedLabelId
              ? "bg-red-400 text-white"
              : "bg-white/80 text-black"
          }
        `}
      >
        {placedLabelId ? "✓" : ""}
      </div>
    </div>
  );
};

export default DropZone;