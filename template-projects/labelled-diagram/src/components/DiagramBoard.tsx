import { useState } from "react";
import DropZone from "./DropZone";
import type { DiagramData } from "../types/diagram";

interface Props {
  data: DiagramData;
  placed: Record<string, string>;
}

const DiagramBoard: React.FC<Props> = ({ data, placed }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full max-w-[600px]">
      {/* 🔥 CONTAINER FIX TỈ LỆ */}
      <div
        className="relative w-full aspect-[3/4]
        rounded-3xl overflow-hidden
        bg-slate-700 shadow-2xl border border-white/10"
      >
        {/* 🔥 BACKGROUND IMAGE (QUAN TRỌNG) */}
        {!imageError && data?.imagePath ? (
          <div
            className="absolute inset-0 bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(${data.imagePath})`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            ❌ Image not found
          </div>
        )}

        {/* 🔥 LAYER POINTS */}
        <div className="absolute inset-0">
          {data.points.map((point) => {
            const labelId = placed?.[point.id];

            return (
              <DropZone
                key={point.id}
                point={point}
                placedLabelId={labelId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiagramBoard;