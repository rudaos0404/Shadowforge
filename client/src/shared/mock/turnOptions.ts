import type { TurnOption, TurnOptionType } from "../../stores/game.store";

type Params = {
  hp: number;
  excludedSpecials: TurnOptionType[];
};

const BASE: Record<TurnOptionType, Omit<TurnOption, "route"> & { route: TurnOption["route"] }> = {
  BATTLE: { type: "BATTLE", title: "전투", desc: "몬스터와 전투가 시작된다.", tag: "BATTLE", route: "/battle" },
  SHOP: { type: "SHOP", title: "상점", desc: "아이템을 구매할 수 있다.", tag: "SHOP", route: "/shop" },
  TREASURE: { type: "TREASURE", title: "보물", desc: "무언가를 얻을 수 있다.", tag: "TREASURE", route: "/treasure" },
  REST: { type: "REST", title: "휴식", desc: "HP를 회복할 수 있다.", tag: "REST", route: "/rest" },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateStageOptions({ hp, excludedSpecials }: Params): TurnOption[] {
  // 후보 구성
  const pool: TurnOptionType[] = ["SHOP", "TREASURE", "REST"];

  // 휴식 조건
  if (hp >= 70) {
    // REST 제외
    const idx = pool.indexOf("REST");
    if (idx >= 0) pool.splice(idx, 1);
  }

  // 특수 제외(상점/보물)
  const filtered = pool.filter((t) => !excludedSpecials.includes(t));

  // 1장은 전투 고정 + 나머지 2장을 랜덤(중복 없이)
  const options: TurnOption[] = [BASE.BATTLE];

  const candidates = [...filtered];
  while (options.length < 3) {
    if (candidates.length === 0) {
      // 후보가 부족하면(예: SHOP/TREASURE 제외 + REST도 제외) 남는 칸은 전투로 채움
      options.push(BASE.BATTLE);
      continue;
    }
    const t = pickRandom(candidates);
    // 중복 제거
    const ci = candidates.indexOf(t);
    if (ci >= 0) candidates.splice(ci, 1);
    options.push(BASE[t]);
  }

  // 전투가 여러 장이 되었을 수도 있으니, 최소 3장 유지하면서 “가능하면” 서로 다른 카드가 되도록 정렬
  // (UI 클릭/표시 안정성 때문에 배열은 고정 길이)
  return options.slice(0, 3);
}
