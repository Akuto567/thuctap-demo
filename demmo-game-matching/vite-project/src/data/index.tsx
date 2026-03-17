import type { Group, Item } from "../types/objects";


// --- Dữ liệu mẫu ---
export const MY_APP_DATA: { groups: Group[]; items: Item[]; } = import.meta.env.PROD &&
  (
    window as Window &
    typeof globalThis & { MY_APP_DATA: { groups: Group[]; items: Item[]; }; }
  )["MY_APP_DATA"]
  ? (
    window as Window &
    typeof globalThis & {
      MY_APP_DATA: { groups: Group[]; items: Item[]; };
    }
  )["MY_APP_DATA"]
  : {
    groups: [
      { id: "group1", name: "Trái cây", imgsrc: "/svg/basket.svg" },
      { id: "group2", name: "Rau củ", imgsrc: "/svg/box.svg" },
      { id: "group3", name: "Đồ dùng", imgsrc: "/svg/backpack.svg" },
    ],
    items: [
      {
        id: "item1",
        name: "Táo",
        imgsrc: "/svg/apple.svg",
        groupId: "group1",
      },
      {
        id: "item2",
        name: "Chuối",
        imgsrc: "/svg/banana.svg",
        groupId: "group1",
      },
      {
        id: "item3",
        name: "Cà rốt",
        imgsrc: "/svg/carrot.svg",
        groupId: "group2",
      },
      {
        id: "item4",
        name: "Khoai tây",
        imgsrc: "/svg/potato.svg",
        groupId: "group2",
      },
      {
        id: "item5",
        name: "Sách",
        imgsrc: "/svg/book.svg",
        groupId: "group3",
      },
      {
        id: "item6",
        name: "Bút",
        imgsrc: "/svg/pen.svg",
        groupId: "group3",
      },
      {
        id: "item7",
        name: "Cam",
        imgsrc: "/svg/orange.svg",
        groupId: "group1",
      },
      {
        id: "item8",
        name: "Dâu",
        imgsrc: "/svg/strawberry.svg",
        groupId: "group1",
      },
    ],
  };
