// 2.1 내 정보 조회 :contentReference[oaicite:2]{index=2}
export type MeResponse = {
  id: number;
  username: string;
  gameData: GameData | null;
};

// 3.1 게임 불러오기 :contentReference[oaicite:3]{index=3}
export type GameSave = {
  slotId: number;
  updatedAt: string;
  playerData: {
    hp: number;
    maxHp: number;
    gold: number;
    currentFloor: number;
  };
  inventoryData: Array<
    | { itemId: string; count: number }
    | { itemId: string; equipped: boolean }
  >;
} | null;

export type SaveGameRequest = {
  playerData: NonNullable<GameSave>["playerData"];
  inventoryData: NonNullable<GameSave>["inventoryData"];
};

export type SaveGameResponse = {
  message: string;
  savedAt: string;
};


// 4.1 랭킹 조회 :contentReference[oaicite:5]{index=5}
export type RankingItem = {
  rank: number;
  nickname: string;
  score: number;
  clearTime: number;
  playedAt: string;
};

export type RankingListResponse = RankingItem[];

// 4.2 랭킹 등록 :contentReference[oaicite:6]{index=6}
export type SubmitRankingRequest = {
  score: number;
  clearTime: number;
  isClear: boolean;
  finalFloor: number;
};

export type SubmitRankingResponse = {
  message: string;
  myRank: number;
};

// src/api/types.ts (기존 내용 유지 + 아래 없으면 추가)

export type TurnOptionType = "BATTLE" | "SHOP" | "TREASURE" | "REST";

export type TurnRoute = "/battle" | "/shop" | "/treasure" | "/rest";

export type TurnOption = {
  type: TurnOptionType;
  title: string;
  desc: string;
  tag: string;
  route: TurnRoute;
};

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

// --- Server Integration Types ---

export type GameState =
  | 'SELECTING'
  | 'BATTLE'
  | 'BOSS_BATTLE'
  | 'SHOP'
  | 'REST'
  | 'TREASURE'
  | 'GAME_CLEAR'
  | 'GAME_OVER';

export interface Monster {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  agi: number;
  rewardGold: number;
  imagePath: string;
  nextAction?: string;
}

export interface GameData {
  currentTurn: number;
  state: GameState;
  options: string[];
  hp: number;
  maxHp: number;
  str: number;
  agi: number;
  stunned: boolean;
  luckyCooldown: number;
  gold: number;
  potions: number;
  inventory: string[];
  equippedWeapon: string | null;
}

export interface StartGameResponse {
  message: string;
  turn: number;
  options: string[];
  state: GameState;
}

export interface SelectOptionResponse {
  message: string;
  state: GameState;
  // BATTLE
  monster?: Monster;
  monsterIntent?: string;
  canSeeIntent?: boolean;
  luckyCooldown?: number;
  // SHOP
  items?: string[];
  // REST
  hp?: number;
  maxHp?: number;
  description?: string;
  // TREASURE
  gold?: number;
}

export interface BattleResponse {
  result: 'WIN' | 'LOSE' | 'CONTINUE';
  logs: string[];
  monsterHp: number;
  userHp: number;
  monsterAction?: string;
  nextMonsterIntent?: string | null;
  canSeeIntent?: boolean;
  luckyCooldown?: number;
}

export interface ClaimRewardResponse {
  message: string;
  str: number;
  agi: number;
  potions: number;
}
