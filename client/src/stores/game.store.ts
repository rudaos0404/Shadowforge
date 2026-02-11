import { create } from "zustand";
import { api } from "../shared/api/endpoints";
import type { GameData, WeaponId, ShopItemId, InventoryItem, Monster } from "../shared/api/types";

// ✅ UI 표시용 정적 데이터 (이미지 경로 등)
export const WEAPONS: Record<string, InventoryItem> = {
  NO_SWORD: { id: "NO_SWORD" as WeaponId, name: "무기 없음", atk: 0, img: "/gadgets/검.png" },
  NORMAL_SWORD: { id: "NORMAL_SWORD" as WeaponId, name: "노말 검", atk: 2, img: "/gadgets/노말검.png" },
  SWORD: { id: "SWORD" as WeaponId, name: "검", atk: 3, img: "/gadgets/검.png" },
  RARE_SWORD: { id: "RARE_SWORD" as WeaponId, name: "레어 검", atk: 5, img: "/gadgets/레어검.png" },
  EPIC_SWORD: { id: "EPIC_SWORD" as WeaponId, name: "에픽 검", atk: 8, img: "/gadgets/에픽검.png" },
  UNIQUE_SWORD: { id: "UNIQUE_SWORD" as WeaponId, name: "유니크 검", atk: 12, img: "/gadgets/유니크검.png" },
  LEGENDARY_SWORD: { id: "LEGENDARY_SWORD" as WeaponId, name: "레전더리 검", atk: 16, img: "/gadgets/레전더리검.png" },
};

export const SHOP_ITEMS: Array<{
  id: ShopItemId;
  title: string;
  img: string;
  cost: number;
  effectText: string;
  weaponId?: string;
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

interface GameStore {
  gameData: GameData | null;
  userId: number | null; // Added userId
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  setGameData: (data: GameData) => void;
  setUserId: (id: number) => void; // Added setUserId

  // API Calls
  startGame: (userId: number) => Promise<void>;
  selectOption: (userId: number, selection: string) => Promise<any>;
  nextTurn: (userId: number) => Promise<any>;
  battle: (userId: number, monsterId: number, action: string, useLucky: boolean) => Promise<any>;
  claimReward: (userId: number, reward: 'STR' | 'AGI' | 'POTION') => Promise<any>;
  usePotion: (userId: number) => Promise<void>;
  equipItem: (userId: number, itemId: string) => Promise<void>;
  buyItem: (userId: number, itemId: string) => Promise<any>;
  escapeBattle: (userId: number) => Promise<void>;

  // Helpers
  getEquippedWeapon: () => InventoryItem | null;

  // Temporary/Client-side Helpers (to fix build & legacy logic)
  addGold: (amount: number) => void;
  completeSpecialStage: (type: string) => Promise<void>;

  // Legacy / Compatibility Stubs
  restHeal: () => Promise<void>;
  completeBattleStage: () => Promise<void>;
  restoreSnapshotIfAny: () => void;
  clearSnapshot: () => void;

  // Aliases for compatibility
  equipWeapon: (userId: number, itemId: string) => Promise<void>;
  currentMonster: Monster | null;
  nextMonsterIntent: string | null;
  canSeeIntent: boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameData: null,
  userId: null,
  isLoading: false,
  error: null,
  currentMonster: null,
  nextMonsterIntent: null,
  canSeeIntent: false,

  initialize: () => {
    // initialize logic
  },

  setGameData: (data) => set({ gameData: data }),
  setUserId: (id) => set({ userId: id }),

  startGame: async (userId: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.startGame(userId);
      const me = await api.me();
      set({ gameData: me.gameData, userId: me.id });
    } catch (err: any) {
      set({ error: err.message || 'Failed to start game' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  selectOption: async (userId, selection) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.selectOption(userId, selection);
      // res: { message, state, monster?, items?, ... }

      // gameData 일부 업데이트
      const current = get().gameData;
      if (current) {
        set({
          gameData: {
            ...current,
            state: res.state,
            hp: res.hp !== undefined ? res.hp : current.hp,
            maxHp: res.maxHp !== undefined ? res.maxHp : current.maxHp,
            gold: res.gold !== undefined ? res.gold : current.gold,
            potions: res.potions !== undefined ? res.potions : current.potions,
            inventory: res.inventory !== undefined ? res.inventory : current.inventory,
            luckyCooldown: res.luckyCooldown !== undefined ? res.luckyCooldown : current.luckyCooldown,
          },
          currentMonster: res.monster || null,
          nextMonsterIntent: res.monsterIntent || null,
          canSeeIntent: res.canSeeIntent || false,
        });
      }
      return res;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  nextTurn: async (userId) => {
    set({ isLoading: true });
    try {
      const res = await api.nextTurn(userId);
      // res: { message, turn, options, state, ... }
      const current = get().gameData;
      if (current) {
        set({
          gameData: {
            ...current,
            currentTurn: res.turn === 'ENDING' ? current.currentTurn : res.turn,
            state: res.state || current.state,
            options: res.options || [],
            hp: res.hp !== undefined ? res.hp : current.hp,
            maxHp: res.maxHp !== undefined ? res.maxHp : current.maxHp,
            gold: res.gold !== undefined ? res.gold : current.gold,
            potions: res.potions !== undefined ? res.potions : current.potions,
          },
          currentMonster: res.monster || null,
          nextMonsterIntent: res.monsterIntent || null,
          canSeeIntent: res.canSeeIntent || false
        });
      }
      return res;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  battle: async (userId, monsterId, action, useLucky) => {
    set({ isLoading: true });
    try {
      const res = await api.battle(userId, monsterId, action, useLucky);
      // res: { result, logs, userHp, monsterHp ... }

      const current = get().gameData;
      if (current) {
        set({
          gameData: {
            ...current,
            hp: res.userHp,
            luckyCooldown: res.luckyCooldown !== undefined ? res.luckyCooldown : current.luckyCooldown,
            gold: res.gold !== undefined ? res.gold : current.gold,
          },
          // ✨ 몬스터 체력 업데이트
          currentMonster: get().currentMonster ? { ...get().currentMonster!, hp: res.monsterHp } : null,
          nextMonsterIntent: res.nextMonsterIntent || null,
          canSeeIntent: res.canSeeIntent || false,
        });
      }
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  claimReward: async (userId, reward) => {
    const res = await api.claimReward(userId, reward);
    // res: { message, str, agi, potions }
    const current = get().gameData;
    if (current) {
      set({
        gameData: {
          ...current,
          str: res.str,
          agi: res.agi,
          potions: res.potions !== undefined ? res.potions : current.potions
        }
      });
    }
    return res;
  },

  usePotion: async (userId) => {
    const res = await api.usePotion(userId);
    // res: { message, hp, potions }
    const current = get().gameData;
    if (current) {
      set({
        gameData: {
          ...current,
          hp: res.hp,
          potions: res.potions
        }
      });
    }
  },

  equipItem: async (userId, itemId) => {
    const res = await api.equipItem(userId, itemId);
    // res: { message, equippedWeapon }
    const current = get().gameData;
    if (current) {
      set({
        gameData: {
          ...current,
          equippedWeapon: res.equippedWeapon
        }
      });
    }
  },

  buyItem: async (userId, itemId) => {
    const res = await api.buyItem(userId, itemId);
    // res: { message, gold, potions, inventory }
    const current = get().gameData;
    if (current) {
      set({
        gameData: {
          ...current,
          gold: res.gold,
          potions: res.potions !== undefined ? res.potions : current.potions,
          inventory: res.inventory
        }
      });
    }
    return res;
  },

  escapeBattle: async (userId) => {
    set({ isLoading: true });
    try {
      const res = await api.escapeBattle(userId);
      const current = get().gameData;
      if (current) {
        set({
          gameData: {
            ...current,
            state: res.state || 'SELECTING'
          }
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getEquippedWeapon: () => {
    const id = get().gameData?.equippedWeapon;
    if (!id || !WEAPONS[id]) return null;
    return WEAPONS[id];
  },

  addGold: (amount: number) => {
    const current = get().gameData;
    if (current) {
      set({
        gameData: {
          ...current,
          gold: current.gold + amount
        }
      });
    }
  },

  completeSpecialStage: async (_type: string) => {
    // For now, just call nextTurn if we have a userId
    const { userId, nextTurn } = get();
    if (userId) {
      await nextTurn(userId);
    }
  },

  equipWeapon: async (userId: number, itemId: string) => {
    await get().equipItem(userId, itemId);
  },

  restHeal: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ isLoading: true });
    try {
      const res = await api.confirmRest(userId);
      const current = get().gameData;
      if (current) {
        set({
          gameData: {
            ...current,
            currentTurn: res.turn === 'ENDING' ? current.currentTurn : res.turn,
            state: res.state || current.state,
            options: res.options || [],
            hp: res.hp !== undefined ? res.hp : current.hp,
            maxHp: res.maxHp !== undefined ? res.maxHp : current.maxHp,
            gold: res.gold !== undefined ? res.gold : current.gold,
            potions: res.potions !== undefined ? res.potions : current.potions,
          },
          currentMonster: res.monster || null,
          nextMonsterIntent: res.monsterIntent || null,
          canSeeIntent: res.canSeeIntent || false
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },
  completeBattleStage: async () => {
    const { userId, nextTurn } = get();
    if (userId) {
      await nextTurn(userId);
    }
  },
  restoreSnapshotIfAny: () => { },
  clearSnapshot: () => { },
}));

