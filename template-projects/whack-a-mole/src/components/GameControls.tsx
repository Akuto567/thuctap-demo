import { Play, Pause, BookOpen } from "lucide-react";

type Props = {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  onOpenGuide: () => void;
};

export default function GameControls({
  isPlaying,
  onPlayPause,
  onOpenGuide
}: Props) {
  return (
    <div className="controls">
      <button className="game-btn btn-play" onClick={onPlayPause}>
        {isPlaying ? <Pause /> : <Play />}
      </button>

      {/* <button className="game-btn btn-restart" onClick={onRestart}>
        <RotateCcw />
      </button> */}

      <button className="game-btn btn-guide" onClick={onOpenGuide}>
        <BookOpen />
      </button>
    </div>
  );
}