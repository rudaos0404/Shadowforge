import { create } from "zustand";
import { generateStageOptions } from "../shared/mock/turnOptions";

export type TurnOptionType = "BATTLE" | "SHOP" | "TREASURE" | "REST";

export type WeaponId =
  | "NO_SWORD"
  | "NORMAL_SWORD"
  | "SWORD"
  | "RARE_SWORD"
  | "EPIC_SWORD"
  | "UNIQUE_SWORD"
  | "LEGENDARY_SWORD";

export type ShopItemId =
  | "POTION"
  | "NORMAL_SWORD"
  | "SWORD"
  | "RARE_SWORD"
  | "EPIC_SWORD"
  | "UNIQUE_SWORD"
  | "LEGENDARY_SWORD";

export type InventoryItem = {
  id: WeaponId;
  name: string;
  atk: number;
  img: string; // public path
};

export type TurnOption = {
  type: TurnOptionType;
  title: string;
  desc: string;
  tag: string;
  route: "/battle" | "/shop" | "/treasure" | "/rest";
};

type Snapshot = {
  stage: number;
  stageOptions: TurnOption[];
  excludedSpecials: TurnOptionType[];
};

type GameState = {
  stage: number; // 1..15
  gold: number;
  hp: number; // 0..100
  potions: number;

  // ✅ 스탯(기획서 반영)
  str: number;
  agi: number;

  ownedWeapons: WeaponId[];
  equippedWeaponId: WeaponId | null;

  // ✅ 몬스터 중복 방지(일반/보스)
  defeatedNormalMonsters: string[];
  defeatedBossMonsters: string[];

  // TurnPage 3 cards
  stageOptions: TurnOption[];

  // SHOP/TREASURE 성공 시 다음 스테이지에서 제외(전투 1번 하면 초기화)
  excludedSpecials: TurnOptionType[];

  snapshotBeforeEvent: Snapshot | null;

  // ===== derived =====
  getEquippedWeapon: () => InventoryItem | null;
  getPlayerAtk: () => number; // 기존: 무기 atk
  getBaseDamage: () => number; // ✅ (무기 atk) + (str * 0.5)

  // ===== lifecycle =====
  newGame: () => void;
  loadLocal: () => void;
  saveLocal: () => void;

  // ===== stage option flow =====
  setStageOptions: (opts: TurnOption[]) => void;
  snapshotEvent: () => void;
  restoreSnapshotIfAny: () => void;
  clearSnapshot: () => void;

  // ===== rules =====
  rerollStageOptions: () => void;
  completeBattleStage: () => void; // 승리 시 stage+1 & reroll & excludedSpecials 초기화
  completeSpecialStage: (special: "SHOP" | "TREASURE") => void; // 커밋 성공 시 stage+1 & reroll & 해당 special 다음 스테이지에서 제외

  // ===== inventory / shop =====
  addGold: (delta: number) => void;
  spendGold: (cost: number) => boolean;
  addPotion: (count: number) => void;
  addWeapon: (weaponId: WeaponId) => void;
  equipWeapon: (weaponId: WeaponId | null) => void;

  // ✅ HP 조작(전투 필요)
  setHp: (next: number) => void;
  healHp: (delta: number) => void;
  takeDamage: (delta: number) => void;

  // ✅ 스탯 증가(전투 승리 보상 선택 등에 사용)
  addStr: (delta: number) => void;
  addAgi: (delta: number) => void;

  // ✅ 몬스터 중복 방지 기록
  markMonsterDefeated: (id: string, isBoss: boolean) => void;

  // ===== rest =====
  canRestAppear: () => boolean;
  restHeal: () => void;
};

const MAX_HP = 100;

export const WEAPONS: Record<WeaponId, InventoryItem> = {
  NO_SWORD: { id: "NO_SWORD", name: "무기 없음", atk: 0, img: "/gadgets/검.png" }, // ✅ 여기만 변경
  NORMAL_SWORD: { id: "NORMAL_SWORD", name: "노말 검", atk: 2, img: "/gadgets/노말검.png" },
  SWORD: { id: "SWORD", name: "검", atk: 3, img: "/gadgets/검.png" },
  RARE_SWORD: { id: "RARE_SWORD", name: "레어 검", atk: 5, img: "/gadgets/레어검.png" },
  EPIC_SWORD: { id: "EPIC_SWORD", name: "에픽 검", atk: 8, img: "/gadgets/에픽검.png" },
  UNIQUE_SWORD: { id: "UNIQUE_SWORD", name: "유니크 검", atk: 12, img: "/gadgets/유니크검.png" },
  LEGENDARY_SWORD: { id: "LEGENDARY_SWORD", name: "레전더리 검", atk: 16, img: "/gadgets/레전더리검.png" },
};


export const SHOP_ITEMS: Array<{
  id: ShopItemId;
  title: string;
  img: string;
  cost: number;
  effectText: string;
  weaponId?: WeaponId;
  potionCount?: number;
}> = [
  { id: "POTION", title: "포션", img: "/gadgets/포션.png", cost: 10, effectText: "HP +20", potionCount: 1 },

  { id: "NORMAL_SWORD", title: "노말 검", img: "/gadgets/노말검.png", cost: 15, effectText: "ATK +2", weaponId: "NORMAL_SWORD" },
  { id: "SWORD", title: "검", img: "/gadgets/검.png", cost: 25, effectText: "ATK +3", weaponId: "SWORD" },
  { id: "RARE_SWORD", title: "레어 검", img: "/gadgets/레어검.png", cost: 45, effectText: "ATK +5", weaponId: "RARE_SWORD" },
  { id: "EPIC_SWORD", title: "에픽 검", img: "/gadgets/에픽검.png", cost: 80, effectText: "ATK +8", weaponId: "EPIC_SWORD" },
  { id: "UNIQUE_SWORD", title: "유니크 검", img: "/gadgets/유니크검.png", cost: 140, effectText: "ATK +12", weaponId: "UNIQUE_SWORD" },
  { id: "LEGENDARY_SWORD", title: "레전더리 검", img: "/gadgets/레전더리검.png", cost: 220, effectText: "ATK +16", weaponId: "LEGENDARY_SWORD" },
];

const STORAGE_KEY = "shadowforge_game_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  stage: 1,
  gold: 0,
  hp: MAX_HP,
  potions: 0,

  // ✅ 기본값(나중에 성장으로 올림)
  str: 0,
  agi: 0,

  ownedWeapons: [],
  equippedWeaponId: null,

  defeatedNormalMonsters: [],
  defeatedBossMonsters: [],

  stageOptions: [],
  excludedSpecials: [],
  snapshotBeforeEvent: null,

  getEquippedWeapon: () => {
    const id = get().equippedWeaponId;
    if (!id) return null;
    return WEAPONS[id] ?? null;
  },

  getPlayerAtk: () => {
    const w = get().getEquippedWeapon();
    const weaponAtk = w ? w.atk : 0;
    return Math.max(1, weaponAtk)
  },

  // ✅ 기획서: 최종 데미지 = (무기 공격력) + (힘 × 0.5)
  getBaseDamage: () => {
    const wAtk = get().getPlayerAtk();
    const str = get().str;
    return Math.round(wAtk + str * 0.5);
  },

  newGame: () => {
    set({
      stage: 1,
      gold: 0,
      hp: MAX_HP,
      potions: 0,
      str: 0,
      agi: 0,
      ownedWeapons: [],
      equippedWeaponId: null,
      defeatedNormalMonsters: [],
      defeatedBossMonsters: [],
      excludedSpecials: [],
      snapshotBeforeEvent: null,
    });
    get().rerollStageOptions();
    get().saveLocal();
  },

  loadLocal: () => {
    const saved = safeParse<Partial<GameState>>(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      get().rerollStageOptions();
      return;
    }

    set({
      stage: typeof saved.stage === "number" ? saved.stage : 1,
      gold: typeof saved.gold === "number" ? saved.gold : 0,
      hp: typeof saved.hp === "number" ? saved.hp : MAX_HP,
      potions: typeof saved.potions === "number" ? saved.potions : 0,

      str: typeof saved.str === "number" ? saved.str : 0,
      agi: typeof saved.agi === "number" ? saved.agi : 0,

      ownedWeapons: Array.isArray(saved.ownedWeapons) ? (saved.ownedWeapons as WeaponId[]) : [],
      equippedWeaponId: (saved.equippedWeaponId as WeaponId | null) ?? null,
      excludedSpecials: Array.isArray(saved.excludedSpecials) ? (saved.excludedSpecials as TurnOptionType[]) : [],

      defeatedNormalMonsters: Array.isArray(saved.defeatedNormalMonsters) ? (saved.defeatedNormalMonsters as string[]) : [],
      defeatedBossMonsters: Array.isArray(saved.defeatedBossMonsters) ? (saved.defeatedBossMonsters as string[]) : [],
    });

    // 카드 꼬임 방지: 저장된 stageOptions는 신뢰하지 않고 항상 재생성
    get().rerollStageOptions();
  },

  saveLocal: () => {
    const s = get();
    const payload: Partial<GameState> = {
      stage: s.stage,
      gold: s.gold,
      hp: s.hp,
      potions: s.potions,

      str: s.str,
      agi: s.agi,

      ownedWeapons: s.ownedWeapons,
      equippedWeaponId: s.equippedWeaponId,
      excludedSpecials: s.excludedSpecials,

      defeatedNormalMonsters: s.defeatedNormalMonsters,
      defeatedBossMonsters: s.defeatedBossMonsters,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },

  setStageOptions: (opts) => set({ stageOptions: opts }),

  snapshotEvent: () => {
    const s = get();
    set({
      snapshotBeforeEvent: {
        stage: s.stage,
        stageOptions: s.stageOptions,
        excludedSpecials: s.excludedSpecials,
      },
    });
  },

  restoreSnapshotIfAny: () => {
    const snap = get().snapshotBeforeEvent;
    if (!snap) return;
    set({
      stage: snap.stage,
      stageOptions: snap.stageOptions,
      excludedSpecials: snap.excludedSpecials,
      snapshotBeforeEvent: null,
    });
  },

  clearSnapshot: () => set({ snapshotBeforeEvent: null }),

  rerollStageOptions: () => {
    const s = get();
    const opts = generateStageOptions({
      hp: s.hp,
      excludedSpecials: s.excludedSpecials,
    });
    set({ stageOptions: opts });
  },

  completeBattleStage: () => {
    const next = Math.min(15, get().stage + 1);
    set({
      stage: next,
      excludedSpecials: [],
      snapshotBeforeEvent: null,
    });
    get().rerollStageOptions();
    get().saveLocal();
  },

  completeSpecialStage: (special) => {
    const next = Math.min(15, get().stage + 1);
    const newExcluded = Array.from(new Set<TurnOptionType>([...get().excludedSpecials, special]));
    set({
      stage: next,
      excludedSpecials: newExcluded,
      snapshotBeforeEvent: null,
    });
    get().rerollStageOptions();
    get().saveLocal();
  },

  addGold: (delta) => {
    set({ gold: Math.max(0, get().gold + delta) });
    get().saveLocal();
  },

  spendGold: (cost) => {
    if (get().gold < cost) return false;
    set({ gold: get().gold - cost });
    get().saveLocal();
    return true;
  },

  addPotion: (count) => {
    set({ potions: Math.max(0, get().potions + count) });
    get().saveLocal();
  },

  addWeapon: (weaponId) => {
    if (get().ownedWeapons.includes(weaponId)) return;
    set({ ownedWeapons: [...get().ownedWeapons, weaponId] });
    get().saveLocal();
  },

  equipWeapon: (weaponId) => {
    set({ equippedWeaponId: weaponId });
    get().saveLocal();
  },

  // ✅ HP
  setHp: (next) => {
    set({ hp: Math.max(0, Math.min(MAX_HP, next)) });
    get().saveLocal();
  },
  healHp: (delta) => {
    const next = Math.min(MAX_HP, get().hp + Math.max(0, delta));
    set({ hp: next });
    get().saveLocal();
  },
  takeDamage: (delta) => {
    const next = Math.max(0, get().hp - Math.max(0, delta));
    set({ hp: next });
    get().saveLocal();
  },

  // ✅ 스탯
  addStr: (delta) => {
    set({ str: Math.max(0, get().str + delta) });
    get().saveLocal();
  },
  addAgi: (delta) => {
    set({ agi: Math.max(0, get().agi + delta) });
    get().saveLocal();
  },

  // ✅ 몬스터 중복 방지 기록
  markMonsterDefeated: (id, isBoss) => {
    const s = get();
    if (isBoss) {
      if (s.defeatedBossMonsters.includes(id)) return;
      set({ defeatedBossMonsters: [...s.defeatedBossMonsters, id] });
    } else {
      if (s.defeatedNormalMonsters.includes(id)) return;
      set({ defeatedNormalMonsters: [...s.defeatedNormalMonsters, id] });
    }
    get().saveLocal();
  },

  canRestAppear: () => get().hp < 70,
  restHeal: () => {
    const healed = Math.min(MAX_HP, get().hp + 30);
    set({ hp: healed });
    get().saveLocal();
  },
}));
