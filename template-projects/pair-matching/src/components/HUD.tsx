import { motion } from "framer-motion";
import type { HUDProps } from "../types/components";

export function HUD({
  moves,
  matched,
  total,
  onRestart,
  onShowTutorial,
  isLandscape,
  uiScale,
  isNarrow,
}: HUDProps) {
  const progress = total > 0 ? matched / total : 0;
  const baseGap = 16 * uiScale;

  // LANDSCAPE or NARROW PORTRAIT: Vertical Stack
  if (isLandscape || isNarrow) {
    return (
      <div
        className="flex flex-col items-stretch w-full"
        style={{
          gap: (isNarrow ? 8 : 20) * uiScale,
          paddingTop: isLandscape ? 20 * uiScale : 0,
        }}
      >
        {/* Title */}
        <motion.h2
          className="font-black text-transparent bg-clip-text text-center shrink-0"
          style={{
            backgroundImage: "linear-gradient(90deg, #a78bfa, #60a5fa)",
            fontSize: (isNarrow ? 24 : 32) * uiScale,
          }}
        >
          {isNarrow ? "🃏 Pair Match" : "🃏 Matching"}
        </motion.h2>

        {/* Stats */}
        <div className="flex flex-col" style={{ gap: baseGap * 0.75 }}>
          <StatBox
            label="Lượt đi"
            value={moves}
            uiScale={uiScale}
            compact={isNarrow}
          />
          <StatBox
            label="Đã ghép"
            value={`${matched}/${total}`}
            uiScale={uiScale}
            color="emerald"
            compact={isNarrow}
          />
        </div>

        {/* Progress */}
        <div className="w-full">
          <ProgressBar
            progress={progress}
            uiScale={uiScale}
            hideLabel={isNarrow}
            chunky
          />
        </div>

        {/* Instructions */}
        <Instructions uiScale={uiScale} compact={isNarrow} />

        {/* Restart & Tutorial */}
        <div className="flex flex-col items-center mt-2" style={{ gap: baseGap * 0.5 }}>
          <RestartButton
            onClick={onRestart}
            uiScale={uiScale}
            iconOnly={isNarrow}
            large={!isNarrow}
          />
          <TutorialButton
            onClick={onShowTutorial}
            uiScale={uiScale}
            iconOnly={isNarrow}
            large={!isNarrow}
          />
        </div>
      </div>
    );
  }

  // STANDARD PORTRAIT: 2 Row Grid (Flexible heights to use more screen)
  return (
    <div
      className="flex flex-col w-full"
      style={{ gap: 20 * uiScale, padding: 8 * uiScale }}
    >
      {/* Row 1: Title, Progress, Restart (icon), Tutorial (icon) */}
      <div className="flex items-center" style={{ gap: baseGap }}>
        <motion.h2
          className="font-black text-transparent bg-clip-text shrink-0"
          style={{
            backgroundImage: "linear-gradient(90deg, #a78bfa, #60a5fa)",
            fontSize: 28 * uiScale,
          }}
        >
          🃏
        </motion.h2>

        <div className="flex-1">
          <ProgressBar progress={progress} uiScale={uiScale} hideLabel chunky />
        </div>

        <div className="flex items-center" style={{ gap: baseGap * 0.5 }}>
          <RestartButton onClick={onRestart} uiScale={uiScale} iconOnly large />
          <TutorialButton onClick={onShowTutorial} uiScale={uiScale} iconOnly large />
        </div>
      </div>

      {/* Row 2: Stats and Instructions */}
      <div className="flex items-stretch" style={{ gap: baseGap }}>
        <div className="flex flex-row flex-1" style={{ gap: baseGap * 0.75 }}>
          <StatBox label="Lượt" value={moves} uiScale={uiScale} />
          <StatBox
            label="Ghép"
            value={`${matched}/${total}`}
            uiScale={uiScale}
            color="emerald"
          />
        </div>
        <div className="flex-[1.2]">
          <Instructions uiScale={uiScale} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components for cleaner code ──────────────────────────────────────────

function StatBox({
  label,
  value,
  uiScale,
  color = "purple",
  compact = false,
}: {
  label: string;
  value: string | number;
  uiScale: number;
  color?: "purple" | "emerald";
  compact?: boolean;
}) {
  const isPurple = color === "purple";
  return (
    <div
      className="rounded-2xl text-center shadow flex flex-col justify-center"
      style={{
        padding: compact ? 8 * uiScale : 16 * uiScale,
        background: isPurple
          ? "rgba(124,58,237,0.18)"
          : "rgba(16,185,129,0.18)",
        border: `${1 * uiScale}px solid ${
          isPurple ? "rgba(167,139,250,0.3)" : "rgba(52,211,153,0.3)"
        }`,
        flex: 1,
      }}
    >
      <div
        style={{ fontSize: (compact ? 12 : 14) * uiScale }}
        className={`${isPurple ? "text-purple-300" : "text-emerald-300"} font-semibold`}
      >
        {label}
      </div>
      <div
        style={{ fontSize: (compact ? 20 : 32) * uiScale }}
        className="font-black text-white leading-none mt-1"
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({
  progress,
  uiScale,
  hideLabel,
  chunky = false,
}: {
  progress: number;
  uiScale: number;
  hideLabel?: boolean;
  chunky?: boolean;
}) {
  return (
    <div className="w-full">
      {!hideLabel && (
        <div
          className="text-purple-300 mb-1 font-semibold text-center"
          style={{ fontSize: (chunky ? 14 : 12) * uiScale }}
        >
          Tiến độ
        </div>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.1)",
          height: (chunky ? 22 : 12) * uiScale,
          width: "100%",
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Instructions({
  uiScale,
  compact = false,
}: {
  uiScale: number;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-xl leading-relaxed text-center flex items-center justify-center h-full"
      style={{
        padding: (compact ? 8 : 10) * uiScale,
        fontSize: (compact ? 11 : 12) * uiScale,
        background: "rgba(255,255,255,0.05)",
        border: `${1 * uiScale}px solid rgba(167,139,250,0.15)`,
        color: "#e9d5ff",
      }}
    >
      👆 Lật 2 thẻ bài để tìm cặp giống nhau!
    </div>
  );
}

function RestartButton({
  onClick,
  uiScale,
  iconOnly,
  large = false,
}: {
  onClick: () => void;
  uiScale: number;
  iconOnly?: boolean;
  large?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="font-bold text-white shadow-lg flex items-center justify-center shrink-0"
      style={{
        background: "linear-gradient(135deg, #6d28d9, #4c1d95)",
        padding: iconOnly
          ? 10 * uiScale
          : `${(large ? 18 : 10) * uiScale}px ${(large ? 32 : 20) * uiScale}px`,
        borderRadius: (large ? 20 : 12) * uiScale,
        fontSize: (large ? 20 : 16) * uiScale,
        gap: 12 * uiScale,
        width: iconOnly ? (large ? 60 : 44) * uiScale : "auto",
        height: iconOnly ? (large ? 60 : 44) * uiScale : "auto",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span style={{ fontSize: (iconOnly ? (large ? 28 : 20) : 18) * uiScale }}>
        🔄
      </span>
      {!iconOnly && "Chơi lại"}
    </motion.button>
  );
}

function TutorialButton({
  onClick,
  uiScale,
  iconOnly,
  large = false,
}: {
  onClick: () => void;
  uiScale: number;
  iconOnly?: boolean;
  large?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="font-bold text-white shadow-lg flex items-center justify-center shrink-0"
      style={{
        background: "linear-gradient(135deg, #2563eb, #1e40af)",
        padding: iconOnly
          ? 10 * uiScale
          : `${(large ? 18 : 10) * uiScale}px ${(large ? 32 : 20) * uiScale}px`,
        borderRadius: (large ? 20 : 12) * uiScale,
        fontSize: (large ? 20 : 16) * uiScale,
        gap: 12 * uiScale,
        width: iconOnly ? (large ? 60 : 44) * uiScale : "auto",
        height: iconOnly ? (large ? 60 : 44) * uiScale : "auto",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span style={{ fontSize: (iconOnly ? (large ? 28 : 20) : 18) * uiScale }}>
        📖
      </span>
      {!iconOnly && "Hướng dẫn"}
    </motion.button>
  );
}
