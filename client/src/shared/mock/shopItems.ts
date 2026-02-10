// src/shared/mock/shopItems.ts

export type ShopItemRarity =
  | "NORMAL"
  | "COMMON"
  | "RARE"
  | "EPIC"
  | "UNIQUE"
  | "LEGENDARY"
  | "CONSUME";

export type ShopItemKind = "WEAPON" | "POTION";

export type ShopItem = {
  id: string;
  name: string;
  kind: ShopItemKind;
  rarity: ShopItemRarity;
  price: number;
  atk?: number; // 무기
  heal?: number; // 포션
  icon: string; // public 기준 절대경로
};

export const SHOP_ITEMS: ShopItem[] = [
  // ✅ 포션
  {
    id: "potion",
    name: "포션",
    kind: "POTION",
    rarity: "CONSUME",
    price: 10,
    heal: 20,
    icon: "/gadgets/포션.png",
  },

  // ✅ 검 순서: 노말검 - 검 - 레어 - 에픽 - 유니크 - 레전더리
  // (너가 말한 순서 고정 / 여기 가격·ATK는 ShopPage에서 그대로 쓰면 됨)
  {
    id: "normal_sword",
    name: "노말 검",
    kind: "WEAPON",
    rarity: "NORMAL",
    price: 15,
    atk: 2,
    icon: "/gadgets/노말검.png",
  },
  {
    id: "common_sword",
    name: "검",
    kind: "WEAPON",
    rarity: "COMMON",
    price: 25,
    atk: 3,
    icon: "/gadgets/검.png",
  },
  {
    id: "rare_sword",
    name: "레어 검",
    kind: "WEAPON",
    rarity: "RARE",
    price: 45,
    atk: 5,
    icon: "/gadgets/레어검.png",
  },
  {
    id: "epic_sword",
    name: "에픽 검",
    kind: "WEAPON",
    rarity: "EPIC",
    price: 80,
    atk: 8,
    icon: "/gadgets/에픽검.png",
  },
  {
    id: "unique_sword",
    name: "유니크 검",
    kind: "WEAPON",
    rarity: "UNIQUE",
    price: 140,
    atk: 12,
    icon: "/gadgets/유니크검.png",
  },
  {
    id: "legendary_sword",
    name: "레전더리 검",
    kind: "WEAPON",
    rarity: "LEGENDARY",
    price: 220,
    atk: 16,
    icon: "/gadgets/레전더리검.png",
  },
];
