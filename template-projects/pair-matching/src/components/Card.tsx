import { AnimatePresence, motion } from "framer-motion";
import type { CardProps } from "../types/components";
import CardBack from "./CardBack";
import { isEmoji } from "../utils";

export default function Card({ card, onClick, disabled, size }: CardProps) {
  const { isFlipped, isMatched, image, keyword } = card;
  const showFront = isFlipped || isMatched;

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      className="relative cursor-pointer"
      style={{ width: size, height: size, perspective: 800 }}
      whileHover={!disabled && !isFlipped && !isMatched ? { scale: 1.06 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Card flip container */}
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: showFront ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Back face */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardBack />
        </div>

        {/* Front face */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: isMatched
              ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
              : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            opacity: isMatched ? 0.45 : 1,
          }}
        >
          {isMatched ? (
            // Matched state: keyword prominent
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Background image */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                {isEmoji(image) ? (
                  <span style={{ fontSize: size * 0.4, lineHeight: 1 }}>
                    {image}
                  </span>
                ) : (
                  <img
                    src={image}
                    alt={keyword}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Centered keyword */}
              <span
                className="font-black text-white tracking-widest z-10 text-center"
                style={{
                  fontSize: size * 0.18,
                  textShadow: "0 0 12px #a78bfa",
                }}
              >
                {keyword}
              </span>
            </motion.div>
          ) : (
            // Flipped, not matched yet
            <div className="flex flex-col items-center justify-center gap-1 px-2 w-full h-full">
              {isEmoji(image) ? (
                <span
                  style={{
                    fontSize: size * 0.6,
                    lineHeight: 1,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                >
                  {image}
                </span>
              ) : (
                <img
                  src={image}
                  alt={keyword}
                  className="w-full h-full object-contain"
                  // style={{ maxWidth: size * 0.86, maxHeight: size * 0.86 }}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Match sparkle burst */}
      <AnimatePresence>
        {isMatched && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
