export interface ItemSpec {
    id: string;
    name: string;
    atk: number;
    price: number; // 상점 가격
}

export const WEAPON_BOOK: Record<string, ItemSpec> = {
    NO_SWORD: { id: "NO_SWORD", name: "무기 없음", atk: 0, price: 0 },
    NORMAL_SWORD: { id: "NORMAL_SWORD", name: "노말 검", atk: 2, price: 15 },
    SWORD: { id: "SWORD", name: "검", atk: 3, price: 25 },
    RARE_SWORD: { id: "RARE_SWORD", name: "레어 검", atk: 5, price: 45 },
    EPIC_SWORD: { id: "EPIC_SWORD", name: "에픽 검", atk: 8, price: 80 },
    UNIQUE_SWORD: { id: "UNIQUE_SWORD", name: "유니크 검", atk: 12, price: 140 },
    LEGENDARY_SWORD: { id: "LEGENDARY_SWORD", name: "레전더리 검", atk: 16, price: 220 },
};

export const SHOP_LIST = [
    { type: 'POTION', id: 'POTION', name: '포션', price: 10, desc: 'HP +20' },
    { type: 'WEAPON', ...WEAPON_BOOK.NORMAL_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.RARE_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.EPIC_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.UNIQUE_SWORD },
    { type: 'WEAPON', ...WEAPON_BOOK.LEGENDARY_SWORD },
];
