import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Textfit } from "react-textfit";
import type { CardProps } from "../types/components";
import { isEmoji } from "../utils";
import CardBack from "./CardBack";

export default function Card({ card, onClick, disabled, size }: CardProps) {
  const { isFlipped, isMatched, image, keyword } = card;
  const showFront = isFlipped || isMatched;

  // Track if we hit the floor and need to force breaks
  const [needsBreak, setNeedsBreak] = useState(false);
  const minFontSize = 12;

  const handleTextReady = useCallback(
    (finalFontSize: number) => {
      // If the library shrunk it all the way to the min and it still
      // might be too wide, enable hard breaking
      if (finalFontSize < minFontSize && !needsBreak) {
        setNeedsBreak(true);
      }
    },
    [needsBreak],
  );

  const handleProbeReady = useCallback(
    (finalFontSize: number) => {
      const isTooSmall = finalFontSize < minFontSize;
      setNeedsBreak(isTooSmall);
    },
    [minFontSize],
  );

  // Create a memoized key for the actual display component
  // This ensures we only re-run Textfit when the determined break-mode or card size changes
  const displayKey = useMemo(
    () => `display-${keyword}-${setNeedsBreak}-${size}`,
    [keyword, setNeedsBreak, size],
  );

  return (
    <>
      {/* HIDDEN PROBER: This lives off-screen to test the "ideal" fit */}
      <div
        aria-hidden="true"
        className="invisible absolute pointer-events-none"
        style={{ width: size * 0.83, height: size * 0.83 }} // Match the 10/12ths width
      >
        <Textfit
          mode="multi"
          key={`prober-${keyword}-${size}`}
          min={5} // Allow it to go lower than min so we can detect the "fail"
          max={size * 0.25}
          onReady={handleProbeReady}
        >
          {keyword}
        </Textfit>
      </div>
      <motion.div
        onClick={disabled ? undefined : onClick}
        className="relative cursor-pointer"
        style={{ width: size, height: size, perspective: 800 }}
        whileHover={
          !disabled && !isFlipped && !isMatched ? { scale: 1.06 } : {}
        }
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
                {/* Centered keyword with Auto-Scaling */}
                <div className="z-10 w-10/12 h-10/12">
                  <Textfit
                    // The KEY is crucial: if needsBreak changes,
                    // Textfit restarts its calculation with the new CSS rules
                    key={displayKey}
                    min={minFontSize - 0.05 * minFontSize} // Minimum font size
                    max={size * 0.25} // Maximum font size (e.g., 25% of card size)
                    mode="multi" // Use 'multi' for multiline support
                    forceSingleModeWidth={false}
                    onReady={handleTextReady}
                    className={clsx(
                      "font-black text-white tracking-widest text-center leading-tight w-full h-full flex items-center justify-center",
                      // Ensure the internal container behaves
                      needsBreak ? "break-all hyphens-auto" : "wrap-break-word",
                    )}
                    style={{
                      textShadow: "0 0 12px #a78bfa",
                    }}
                    // Without this, the browser doesn't know which dictionary to use to break the words correctly
                    lang="en"
                  >
                    {keyword}
                  </Textfit>
                </div>
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
    </>
  );
}
