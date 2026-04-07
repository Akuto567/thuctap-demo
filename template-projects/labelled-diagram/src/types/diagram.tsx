export interface Point {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
}

export interface DiagramData {
  imagePath: string;
  points: Point[];
}

// Label dùng runtime (UI)
export interface Label {
  id: string;
  name: string;
}