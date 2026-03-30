type Props = {
  open: boolean;
  onRestart: () => void;
};

export default function GameCompleteModal({ open, onRestart }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal complete-modal">
        <div className="confetti"></div>

        <h2 className="complete-title">🎉 You Win! 🎉</h2>

        <p className="complete-sub">
          Bạn đã hoàn thành tất cả câu hỏi!
        </p>

        <button className="btn-play restart-btn" onClick={onRestart}>
          Chơi lại
        </button>
      </div>
    </div>
  );
}