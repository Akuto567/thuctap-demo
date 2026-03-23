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
      { id: "group1", name: "Trái cây", imagePath: "/svg/basket.svg" },
      { id: "group2", name: "Rau củ", imagePath: "/svg/box.svg" },
      { id: "group3", name: "Đồ dùng", imagePath: "/svg/backpack.svg" },
    ],
    items: [
      {
        id: "item1",
        name: "Táo",
        imagePath: "/svg/apple.svg",
        groupId: "group1",
      },
      {
        id: "item2",
        name: "Chuối",
        imagePath: "/svg/banana.svg",
        groupId: "group1",
      },
      {
        id: "item3",
        name: "Cà rốt",
        imagePath: "/svg/carrot.svg",
        groupId: "group2",
      },
      {
        id: "item4",
        name: "Khoai tây",
        imagePath: "/svg/potato.svg",
        groupId: "group2",
      },
      {
        id: "item5",
        name: "Sách",
        imagePath: "/svg/book.svg",
        groupId: "group3",
      },
      {
        id: "item6",
        name: "Bút",
        imagePath: "/svg/pen.svg",
        groupId: "group3",
      },
      {
        id: "item7",
        name: "Cam",
        imagePath: "/svg/orange.svg",
        groupId: "group1",
      },
      {
        id: "item8",
        name: "Dâu",
        imagePath: "/svg/strawberry.svg",
        groupId: "group1",
      },
    ],
  };
