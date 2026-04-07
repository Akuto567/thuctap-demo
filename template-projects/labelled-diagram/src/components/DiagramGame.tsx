import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState, useMemo } from "react";

import type { DiagramData, Label } from "../types/diagram";
import DiagramBoard from "./DiagramBoard";
import { ItemCard } from "./DraggableItem";
import DraggableItem from "./DraggableItem";
import GameFeedback from "./GameFeedback";

interface Props {
  data: DiagramData;
}

const DiagramGame: React.FC<Props> = ({ data }) => {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);

  const labels: Label[] = useMemo(
    () =>
      data.points.map((p) => ({
        id: p.id,
        name: p.text,
      })),
    [data]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLabel(event.active.data.current as Label);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLabel(null);

    if (!over) return;

    const pointId = over.id as string;
    const label = active.data.current as Label;

    setPlaced((prev) => ({
      ...prev,
      [pointId]: label.id,
    }));
  };

  const usedLabels = Object.values(placed);
  const remainingLabels = labels.filter((l) => !usedLabels.includes(l.id));

  const isGameComplete =
    labels.length > 0 &&
    remainingLabels.length === 0 &&
    Object.keys(placed).length === data.points.length;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 p-6">

        {/* 🔥 CONTAINER KHÔNG DÙNG VH */}
        <div className="w-full max-w-6xl
          bg-white/10 backdrop-blur-xl
          rounded-3xl shadow-2xl p-6 flex gap-6">

          {/* 🔥 BOARD (scale theo container) */}
          <div className="flex-1 flex items-center justify-center">
            <DiagramBoard data={data} placed={placed} />
          </div>

          {/* 🔥 LABEL PANEL */}
          <div className="w-72 bg-white/10 rounded-2xl p-5 flex flex-col">
            <h2 className="text-white mb-4 text-lg font-semibold">
              🏷️ Labels
            </h2>

            <div className="flex flex-col gap-3 overflow-y-auto">
              {remainingLabels.map((label) => (
                <DraggableItem key={label.id} item={label} />
              ))}
            </div>

            {isGameComplete && (
              <div className="mt-6 text-center text-green-400 font-semibold text-lg">
                🎉 Hoàn thành!
              </div>
            )}
          </div>
        </div>
      </div>

      <GameFeedback data={data} placed={placed} />

      <DragOverlay>
        {activeLabel ? <ItemCard item={activeLabel} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DiagramGame;