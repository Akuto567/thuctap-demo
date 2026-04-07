import type { DiagramData } from "../types/diagram";

interface FeedbackProps {
  data: DiagramData;
  placed: Record<string, string>;
}

const GameFeedback: React.FC<FeedbackProps> = ({ data, placed }) => {
  const totalPoints = data.points.length;

  // ✅ đúng khi label.id === point.id
  const correctPlacements = data.points.filter(
    (p) => placed[p.id] === p.id
  ).length;

  const placedCount = Object.keys(placed).length;
  const totalLabels = data.points.length;

  const accuracy = totalPoints > 0 ? correctPlacements / totalPoints : 0;
  const percentage = Math.round(accuracy * 100);

  const remaining = totalLabels - placedCount;

  return (
    <div className="fixed top-4 right-4 bg-slate-800/95 rounded-xl shadow-lg p-4 w-64 z-40 border border-white/10">
      {/* Header */}
      <h3 className="text-white font-bold mb-3 text-sm">Progress</h3>

      {/* Stats */}
      <div className="text-xs text-gray-300 space-y-1 mb-3">
        <div className="flex justify-between">
          <span>Placed</span>
          <span className="text-cyan-400 font-semibold">
            {placedCount}/{totalLabels}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Correct</span>
          <span className="text-emerald-400 font-semibold">
            {correctPlacements}/{totalPoints}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {placedCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1 text-gray-400">
            <span>Accuracy</span>
            <span>{percentage}%</span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                accuracy === 1
                  ? "bg-green-400"
                  : accuracy >= 0.7
                  ? "bg-cyan-400"
                  : accuracy >= 0.4
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-center text-gray-400">
        {totalLabels === 0 ? (
          "No labels"
        ) : remaining > 0 ? (
          <>
            <span className="text-white font-semibold">{remaining}</span> remaining
          </>
        ) : (
          <span className="text-green-400 font-semibold">Completed ✓</span>
        )}
      </div>
    </div>
  );
};

export default GameFeedback;