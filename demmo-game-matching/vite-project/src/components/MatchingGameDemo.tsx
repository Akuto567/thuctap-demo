// MatchingGame.tsx
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import type { GameCard, MessageType } from "../types/objects";
import type { MatchingGameProps } from "../types/components";

const MatchingGameDemo: React.FC<MatchingGameProps> = ({ cardsData }) => {
  // Hàm khởi tạo bộ bài (mỗi cặp xuất hiện 2 lần và trộn)
  const initializeCards = (): GameCard[] => {
    const duplicated = cardsData.flatMap((card, index) => [
      { ...card, id: `${index}-a`, matched: false, flipped: false },
      { ...card, id: `${index}-b`, matched: false, flipped: false },
    ]);
    // Trộn ngẫu nhiên (Fisher–Yates)
    for (let i = duplicated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
    }
    return duplicated;
  };

  const [cards, setCards] = useState<GameCard[]>(initializeCards);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: MessageType;
    text: string;
  } | null>(null);

  // Xử lý khi click vào thẻ
  const handleCardClick = (index: number) => {
    if (disabled) return;
    const currentCard = cards[index];
    if (currentCard.matched || currentCard.flipped) return;

    // Lật thẻ hiện tại
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // Nếu đã lật 2 thẻ
    if (newFlipped.length === 2) {
      setDisabled(true);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      // Kiểm tra cặp
      if (firstCard.imageUrl === secondCard.imageUrl) {
        // Đúng
        setMessage({ type: "success", text: "Vui mừng!" });
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].matched = true;
            updated[secondIdx].matched = true;
            // Giữ flipped = true để hiển thị keyword
            return updated;
          });
          setFlippedIndices([]);
          setDisabled(false);
        }, 500);
      } else {
        // Sai
        setMessage({ type: "error", text: "Khóc!" });
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].flipped = false;
            updated[secondIdx].flipped = false;
            return updated;
          });
          setFlippedIndices([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  // Kiểm tra hoàn thành
  const allMatched = cards.every((card) => card.matched);

  // Reset game
  const resetGame = () => {
    setCards(initializeCards());
    setFlippedIndices([]);
    setDisabled(false);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-purple-200 p-4 flex flex-col items-center justify-center">
      {/* Linh vật tạm (thông báo) */}
      <div className="mb-6 h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message.type}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`px-6 py-3 rounded-full text-white font-bold text-xl shadow-lg ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid các thẻ */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4 justify-items-center">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={false}
              animate={{ scale: card.matched ? 0.9 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-full aspect-square cursor-pointer"
              onClick={() => handleCardClick(index)}
            >
              <motion.div
                className="w-full h-full rounded-xl shadow-lg relative"
                animate={{
                  rotateY: card.flipped || card.matched ? 180 : 0,
                }}
                transition={{ duration: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Mặt trước (úp) */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                  animate={{ opacity: card.flipped || card.matched ? 0 : 1 }}
                >
                  <span className="text-white text-2xl font-bold">?</span>
                </motion.div>

                {/* Mặt sau (hiện hình hoặc keyword) */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-white flex items-center justify-center p-2 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {card.matched ? (
                    <span className="text-2xl font-bold text-indigo-600">
                      {card.keyword}
                    </span>
                  ) : (
                    <img
                      src={card.imageUrl}
                      alt={card.keyword}
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal hoàn thành */}
      <AnimatePresence>
        {allMatched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            onClick={resetGame} // Click ra ngoài cũng reset (tùy chọn)
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-2xl p-8 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Tránh đóng khi click vào modal
            >
              <h2 className="text-4xl font-bold text-green-600 mb-4">
                Well-done!
              </h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Chơi lại
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchingGameDemo;
