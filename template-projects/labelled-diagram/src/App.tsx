import { useEffect, useState } from "react";
import DiagramGame from "./components/DiagramGame";
import type { DiagramData } from "./types/diagram";

function App() {
  const [data, setData] = useState<DiagramData | null>(null);

  useEffect(() => {
    try {
      // 🔥 Check tất cả các kiểu builder có thể dùng
      const raw =
        (window as any).APP_DATA ||
        (window as any).appData ||
        (window as any).__APP_DATA__;

      console.log("🔥 FULL WINDOW:", window);
      console.log("🔥 RAW FROM BUILDER:", raw);

      // ❌ Nếu builder chưa truyền
      if (!raw) {
        console.warn("⚠️ Builder chưa inject data → dùng mock");

        const mock: DiagramData = {
          imagePath: "/assets/images/human/Akari.png",
          points: [
            { id: "p1", text: "Đầu", xPercent: 50, yPercent: 10 },
            { id: "p2", text: "Ngực", xPercent: 50, yPercent: 40 },
            { id: "p3", text: "Chân", xPercent: 50, yPercent: 80 },
          ],
        };

        setData(mock);
        return;
      }

      // ❌ Sai format (builder gửi labels/zones)
      if (!raw.points && raw.labels && raw.zones) {
        console.warn("⚠️ Detect data cũ → auto convert");

        const converted: DiagramData = {
          imagePath: raw.imagePath,
          points: raw.zones.map((z: any) => {
            const label = raw.labels.find(
              (l: any) => l.id === z.correctLabelId
            );

            return {
              id: label?.id || z.id,
              text: label?.name || "Unknown",
              xPercent: z.x,
              yPercent: z.y,
            };
          }),
        };

        console.log("🔥 CONVERTED DATA:", converted);

        setData(converted);
        return;
      }

      // ✅ Data chuẩn builder mới
      setData(raw);
    } catch (err) {
      console.error("❌ Load error:", err);
    }
  }, []);

  if (!data) return <div>Loading game...</div>;

  return <DiagramGame data={data} />;
}

export default App;