import { useEffect, useState } from "react";

export default function HammerCursor() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [hit, setHit] = useState(false);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });
        };

        const down = () => {
            setHit(true);
            setTimeout(() => setHit(false), 120);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mousedown", down);

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mousedown", down);
        };
    }, []);

    return (
        <div
            className="hammer"
            style={{
                position: "fixed",
                left: pos.x,
                top: pos.y,
                width: 90,
                pointerEvents: "none",

                transform: `
                  translate(-30%, -65%)
                  rotateZ(${hit ? -25 : 35}deg)
                  scale(${hit ? 0.95 : 1})
                `,
                transformOrigin: "70% 90%",
                transition: "transform 0.05s ease"
            }}
        />
    );
}