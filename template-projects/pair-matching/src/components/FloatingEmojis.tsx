import { useEffect, useRef } from "react";

const EMOJIS: string[] = ["🎊", "⭐", "🌟", "✨", "🎉", "🏆", "🎈", "💫"];

// ─── Floating Emojis (pure CSS + imperative DOM) ─────────────────────────────
export function FloatingEmojis() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Spawn particles imperatively (React never sees the children → no lag, no reconciliation)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const spawn = () => {
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const particle = document.createElement("div");
      particle.className = "emoji-particle";
      particle.textContent = emoji;

      // Truly random values every spawn
      const x = Math.random() * 100;
      const duration = 3 + Math.random() * 2; // 3–5 s (same range as before)
      const rotate = Math.random() * 360 - 180;

      particle.style.setProperty("--x", `${x}%`);
      particle.style.setProperty("--duration", `${duration}s`);
      particle.style.setProperty("--rotate", `${rotate}deg`);

      container.appendChild(particle);

      // Auto-cleanup when animation finishes (prevents DOM bloat)
      particle.addEventListener("animationend", () => particle.remove(), {
        once: true,
      });
    };

    // Initial burst (staggered exactly like your original code)
    for (let i = 0; i < 12; i++) {
      setTimeout(spawn, i * 150);
    }

    // Continuous random spawning (keeps the screen alive forever, looks more natural)
    const interval = setInterval(spawn, 280);

    return () => {
      clearInterval(interval);
      container.innerHTML = ""; // clean up on unmount
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
    />
  );
}
