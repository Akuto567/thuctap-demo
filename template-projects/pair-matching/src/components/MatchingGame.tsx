import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import type { GameConfig, CardState } from "../types/objects";
import { buildDeck, getOptimalGrid } from "../utils";
import Card from "./Card";
import { HUD } from "./HUD";
import MascotBanner from "./MascotBanner";
import WellDoneScreen from "./WellDoneScreen";
import { MY_APP_DATA } from "../data";

// ─── Main Game ────────────────────────────────────────────────────────────────
export default function MatchingGame() {
  // Load config
  const config: GameConfig = useMemo(() => {
    const w = window as unknown as { MY_APP_DATA?: GameConfig };
    return w.MY_APP_DATA ?? MY_APP_DATA;
  }, []);

  const [cards, setCards] = useState<CardState[]>(() => buildDeck(config));
  const [flipped, setFlipped] = useState<string[]>([]); // up to 2 uids
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [mascotState, setMascotState] = useState<
    "idle" | "happy" | "sad" | null
  >(null);
  const [gameWon, setGameWon] = useState(false);
  const mascotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Grid dimensions (fixed from deck build)
  const grid = useMemo(() => getOptimalGrid(cards.length), [cards.length]);

  // Responsive: track container size and orientation
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight,
  );

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) {
        setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);

    const onResize = () =>
      setIsLandscape(window.innerWidth / window.innerHeight >= 1.2);
    window.addEventListener("resize", onResize);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Compute card size to fill available space
  // Proportional UI Scale
  const isNarrow = useMemo(() => {
    return window.innerWidth / window.innerHeight < 0.6;
  }, []);

  const uiScale = useMemo(() => {
    if (isLandscape) {
      // Landscape: base on height
      return Math.min(Math.max(window.innerHeight / 850, 0.8), 1.25);
    } else {
      // Portrait: base on width AND height to prevent HUD overflow
      const widthBase = isNarrow ? 380 : 440;
      const heightBase = 800;
      const scaleByWidth = window.innerWidth / widthBase;
      const scaleByHeight = window.innerHeight / heightBase;

      // Use the smaller of the two to ensure it fits, but with a floor
      const scale = Math.min(scaleByWidth, scaleByHeight);
      return Math.min(Math.max(scale, isNarrow ? 0.85 : 0.95), 1.4);
    }
  }, [isLandscape, isNarrow]);

  const finalCols = isLandscape ? grid.cols : grid.rows;
  const finalRows = isLandscape ? grid.rows : grid.cols;

  // Compute card size to fill available space
  // Reduced base GAP for tighter look on small screens
  const GAP = Math.min(10 * uiScale, 18);
  const cardSize = useMemo(() => {
    if (!containerSize.w || !containerSize.h) return 80;
    const maxByCols = Math.floor(
      (containerSize.w - GAP * (finalCols - 1)) / finalCols,
    );
    const maxByRows = Math.floor(
      (containerSize.h - GAP * (finalRows - 1)) / finalRows,
    );
    const size = Math.min(maxByCols, maxByRows);
    return Math.max(size, 40); // minimum 40px
  }, [containerSize, finalCols, finalRows, GAP]);

  const gridW = cardSize * finalCols + GAP * (finalCols - 1);
  const gridH = cardSize * finalRows + GAP * (finalRows - 1);

  // Matched pairs count
  const totalPairs = cards.length / 2;
  const matchedPairs = cards.filter((c) => c.isMatched).length / 2;

  // Handle card click
  const handleCardClick = useCallback(
    (uid: string) => {
      if (locked) return;
      const card = cards.find((c) => c.uid === uid);
      if (!card || card.isFlipped || card.isMatched) return;
      if (flipped.includes(uid)) return;

      const newFlipped = [...flipped, uid];

      setCards((prev) =>
        prev.map((c) => (c.uid === uid ? { ...c, isFlipped: true } : c)),
      );

      if (newFlipped.length === 1) {
        setFlipped(newFlipped);
      } else {
        // Two cards flipped
        setFlipped([]);
        setMoves((m) => m + 1);
        setLocked(true);

        const [uid1, uid2] = newFlipped;
        const c1 = cards.find((c) => c.uid === uid1)!;
        const c2 = card; // current card (just clicked)

        const isMatch = c1.itemId === c2.itemId;

        if (mascotTimer.current) clearTimeout(mascotTimer.current);

        setTimeout(() => {
          if (isMatch) {
            setMascotState("happy");
            setCards((prev) => {
              const updated = prev.map((c) =>
                c.uid === uid1 || c.uid === uid2
                  ? { ...c, isMatched: true, isFlipped: true }
                  : c,
              );
              if (updated.every((c) => c.isMatched)) {
                setTimeout(() => setGameWon(true), 600);
              }
              return updated;
            });
          } else {
            setMascotState("sad");
            setCards((prev) =>
              prev.map((c) =>
                c.uid === uid1 || c.uid === uid2
                  ? { ...c, isFlipped: false }
                  : c,
              ),
            );
          }
          setLocked(false);
          mascotTimer.current = setTimeout(() => setMascotState("idle"), 1800);
        }, 900);
      }
    },
    [cards, flipped, locked],
  );

  const restart = useCallback(() => {
    setCards(buildDeck(config));
    setFlipped([]);
    setLocked(false);
    setMoves(0);
    setMascotState(null);
    setGameWon(false);
  }, [config]);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex"
      style={{
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Nunito', 'Comic Sans MS', cursive, sans-serif",
        flexDirection: isLandscape ? "row" : "column",
        alignItems: "center",
        justifyContent: isLandscape ? "center" : "flex-start",
        paddingTop: isLandscape ? 0 : 20 * uiScale,
        gap: isLandscape ? 40 * uiScale : 20 * uiScale,
      }}
    >
      {/* HUD Panel - centered horizontally in its slot */}
      <div
        className="shrink-0 flex items-center relative transition-all duration-300"
        style={
          isLandscape
            ? {
                flex: "1 1 200px",
                maxWidth: 400 * uiScale,
                height: "85%",
                flexDirection: "column",
                justifyContent: "flex-start",
              }
            : {
                width: "95%",
                height: "auto",
                flexDirection: isNarrow ? "column" : "row",
              }
        }
      >
        <HUD
          moves={moves}
          matched={matchedPairs}
          total={totalPairs}
          mascotState={mascotState}
          onRestart={restart}
          isLandscape={isLandscape}
          uiScale={uiScale}
          isNarrow={isNarrow}
        />

        {/* Mascot Banner: Attached to HUD container for alignment */}
        <MascotBanner
          state={mascotState}
          uiScale={uiScale}
          isLandscape={isLandscape}
        />
      </div>

      <div
        ref={containerRef}
        className="shrink flex items-center justify-center overflow-hidden"
        style={{
          width: isLandscape ? "min(65vw, " + (gridW + 40) + "px)" : "95vw",
          height: isLandscape ? "90vh" : "60vh",
          padding: 8 * uiScale,
        }}
      >
        <motion.div
          style={{
            width: gridW,
            height: gridH,
            display: "grid",
            gridTemplateColumns: `repeat(${finalCols}, ${cardSize}px)`,
            gridTemplateRows: `repeat(${finalRows}, ${cardSize}px)`,
            gap: GAP,
          }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {cards.map((card) => (
            <Card
              key={card.uid}
              card={card}
              onClick={() => handleCardClick(card.uid)}
              disabled={locked || card.isMatched}
              size={cardSize}
            />
          ))}
        </motion.div>
      </div>

      {/* Win screen */}
      <AnimatePresence>
        {gameWon && <WellDoneScreen onRestart={restart} />}
      </AnimatePresence>
    </div>
  );
}
