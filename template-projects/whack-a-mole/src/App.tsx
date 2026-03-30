import { useMemo, useState } from "react";
import GamePage from "./components/GamePage";
import GameControls from "./components/GameControls";
import GuideModal from "./components/GuideModal";
import { data } from "./constants";
import HammerCursor from "./components/HammerCursor";
import GameCompleteModal from "./components/GameCompleteModal";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [realData] = useState(() => window.APP_DATA ? window.APP_DATA : data)
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 👉 tạo pool answers dùng chung
  const answerPool = useMemo(() => {
    return realData.map(item => ({
      groupId: item.groupId,
      text: item.answerText,
      image: item.answerImage
    }));
  }, []);

  const handleNext = () => {
    setCurrentIndex(prev => {
      if (prev + 1 >= realData.length) {
        setIsCompleted(true);
        setIsPlaying(false);
        return prev; // giữ nguyên
      }
      return prev + 1;
    });
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setIsPlaying(true);
    setCurrentIndex(0);
  };

  const currentQuestion = realData[currentIndex];

  return (
    <>
      {!isPlaying && <div className="modal-overlay" style={{ zIndex: 5 }} />}

      <HammerCursor />

      <GameControls
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(p => !p)}
        onRestart={handleRestart}
        onOpenGuide={() => {
          setIsPlaying(false)
          setShowGuide(true)
        }}
      />

      <GamePage
        currentIndex={currentIndex}
        key={currentQuestion.groupId} // 🔥 reset game mỗi câu
        question={currentQuestion}
        answerPool={answerPool}
        onCorrect={handleNext}
        isPlaying={isPlaying}
      />

      <GuideModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />

      <GameCompleteModal
        open={isCompleted}
        onRestart={handleRestart}
      />
    </>
  );
}

export default App
