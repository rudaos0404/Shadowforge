// src/pages/BattlePage.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore, WEAPONS, type WeaponId } from "../stores/game.store";

type EnemyIntent =
  | { type: "ATTACK"; value: number }
  | { type: "DEFEND"; value: number };

type EnemyDef = {
  id: string;
  name: string;
  img: string;
  maxHp: number;
  atk: number;
  agi: number;
  goldReward: number;
  isBoss: boolean;
};

const BATTLE_DIR = "/battle";

const BOSS_IDS = [
  "어둠의 군주",
  "죽음의 군주",
  "백골의 군주",
  "부패의 군주",
  "대지의 군주",
] as const;

const NORMAL_IDS = [
  "강철병사",
  "거미",
  "고블린",
  "도끼병사",
  "미믹",
  "스카라베",
  "스켈레톤",
  "스톤골렘", 
  "야수 전사",
  "임프",
  "코볼트",
  "헬하운드",
] as const;

function isBossStage(stage: number) {
  return stage === 5 || stage === 10 || stage === 15;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function randPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEnemy(stage: number, name: string, boss: boolean): EnemyDef {
  const baseHp = boss ? 240 + stage * 45 : 26 + stage * 12;
  const baseAtk = boss ? 18 + Math.floor(stage * 1.8) : 6 + Math.floor(stage * 1.2);
  const baseAgi = boss ? 8 + Math.floor(stage / 2) : 3 + Math.floor(stage / 3);
  const reward = boss ? 60 + stage * 8 : 12 + stage * 3;

  return {
    id: `${boss ? "BOSS" : "N"}_${name}`,
    name,
    img: `${BATTLE_DIR}/${encodeURI(name)}.png`,
    maxHp: baseHp,
    atk: baseAtk,
    agi: baseAgi,
    goldReward: reward,
    isBoss: boss,
  };
}

function formatIntent(intent: EnemyIntent, visible: boolean) {
  if (!visible) return "❓  ???";
  if (intent.type === "ATTACK") return `⚔️  ${intent.value} 공격 준비`;
  return `🛡️  방어(${intent.value}%)`;
}

/** store shape */
type BattleStore = {
  stage: number;
  hp: number;
  potions: number;
  str?: number;
  agi?: number;
  gold: number;
  equippedWeaponId: WeaponId | null;
  getPlayerAtk: () => number;

  addPotion: (count: number) => void;
  addGold: (delta: number) => void;
  completeBattleStage: () => void;

  takeDamage?: (dmg: number) => void;
  healHp?: (heal: number) => void;
  addStr?: (n: number) => void;
  addAgi?: (n: number) => void;
  markMonsterDefeated?: (enemyId: string, isBoss: boolean) => void;

  defeatedNormalMonsters?: string[];
  defeatedBossMonsters?: string[];
};

export default function BattlePage() {
  const navigate = useNavigate();

  const stage = useGameStore((s) => (s as unknown as BattleStore).stage);
  const hp = useGameStore((s) => (s as unknown as BattleStore).hp);
  const potions = useGameStore((s) => (s as unknown as BattleStore).potions);
  const str = useGameStore((s) => (s as unknown as BattleStore).str ?? 0);
  const agi = useGameStore((s) => (s as unknown as BattleStore).agi ?? 0);
  const equippedWeaponId = useGameStore((s) => (s as unknown as BattleStore).equippedWeaponId);

  const getPlayerAtk = useGameStore((s) => (s as unknown as BattleStore).getPlayerAtk);

  const takeDamage = useGameStore((s) => (s as unknown as BattleStore).takeDamage);
  const healHp = useGameStore((s) => (s as unknown as BattleStore).healHp);

  const addPotion = useGameStore((s) => (s as unknown as BattleStore).addPotion);
  const addGold = useGameStore((s) => (s as unknown as BattleStore).addGold);
  const addStr = useGameStore((s) => (s as unknown as BattleStore).addStr);
  const addAgi = useGameStore((s) => (s as unknown as BattleStore).addAgi);

  const markMonsterDefeated = useGameStore((s) => (s as unknown as BattleStore).markMonsterDefeated);
  const completeBattleStage = useGameStore((s) => (s as unknown as BattleStore).completeBattleStage);

  const defeatedNormal = useGameStore((s) => (s as unknown as BattleStore).defeatedNormalMonsters ?? []);
  const defeatedBoss = useGameStore((s) => (s as unknown as BattleStore).defeatedBossMonsters ?? []);

  const bossStage = isBossStage(stage);

  const enemy = useMemo(() => {
    const used = new Set<string>((bossStage ? defeatedBoss : defeatedNormal) ?? []);
    const pool = (bossStage ? [...BOSS_IDS] : [...NORMAL_IDS]).filter((name) => {
      const id = `${bossStage ? "BOSS" : "N"}_${name}`;
      return !used.has(id);
    });

    const picked = pool.length > 0 ? randPick(pool) : randPick(bossStage ? [...BOSS_IDS] : [...NORMAL_IDS]);
    return makeEnemy(stage, picked, bossStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, bossStage]);

  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  useEffect(() => setEnemyHp(enemy.maxHp), [enemy.id, enemy.maxHp]);

  const [intent, setIntent] = useState<EnemyIntent>({ type: "ATTACK", value: enemy.atk });
  const intentVisible = agi >= enemy.agi;

  const [turn, setTurn] = useState(1);
  const [playerDefending, setPlayerDefending] = useState(false);

  const [heavyCd, setHeavyCd] = useState(0);
  const [luckyCd, setLuckyCd] = useState(0);
  const [luckyChecked, setLuckyChecked] = useState(false);

  const [heavyRecoilArmed, setHeavyRecoilArmed] = useState(false);
  const [stunned, setStunned] = useState(false);

  const [enemyGuardPct, setEnemyGuardPct] = useState(0);

  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  const pushLog = (line: string) => {
    setLogs((prev) => [...prev.slice(-120), line]);
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const rollEnemyIntent = () => {
    const defendChance = enemy.isBoss ? 0.18 : 0.28;
    const r = Math.random();
    if (r < defendChance) {
      const pct = enemy.isBoss ? 45 : 35;
      return { type: "DEFEND", value: pct } as const;
    }
    const variance = enemy.isBoss ? 6 : 4;
    const value = Math.max(1, enemy.atk + Math.floor((Math.random() * 2 - 1) * variance));
    return { type: "ATTACK", value } as const;
  };

  useEffect(() => {
    const first = rollEnemyIntent();
    setIntent(first);

    setEnemyGuardPct(0);
    setPlayerDefending(false);
    setHeavyRecoilArmed(false);
    setStunned(false);
    setLuckyChecked(false);
    setHeavyCd(0);
    setLuckyCd(0);
    setTurn(1);
    setLogs([]);

    pushLog(`[STAGE ${stage}] ${enemy.name} 등장!`);
    pushLog(`적 의도: ${formatIntent(first, intentVisible)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy.id]);

  const triggerShakePlayer = () => {
    setShakePlayer(true);
    window.setTimeout(() => setShakePlayer(false), 220);
  };
  const triggerShakeEnemy = () => {
    setShakeEnemy(true);
    window.setTimeout(() => setShakeEnemy(false), 220);
  };

  const rollLuckyMultiplier = () => {
    const a = 1 + Math.floor(Math.random() * 5);
    const b = 1 + Math.floor(Math.random() * 5);
    if (a === b) return { mult: 2.0, a, b, jackpot: true as const };
    const mult = 0.2 + (a + b) / 10;
    return { mult: Number(mult.toFixed(2)), a, b, jackpot: false as const };
  };

  // ✅ 무기 없어도 최소 1 공격력
  const basePlayerAtk = useMemo(() => {
    const atk = getPlayerAtk?.() ?? 1;
    return Math.max(1, atk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedWeaponId, str]);

  const applyPlayerDamage = (raw: number, ignoreGuard: boolean) => {
    let dmg = Math.max(0, Math.round(raw));
    if (!ignoreGuard && enemyGuardPct > 0) dmg = Math.round(dmg * (1 - enemyGuardPct / 100));

    setEnemyHp((prev) => Math.max(0, prev - dmg));
    triggerShakeEnemy();

    pushLog(`플레이어 공격: ${dmg} 피해!${enemyGuardPct > 0 && !ignoreGuard ? ` (적 방어 ${enemyGuardPct}% 감쇠)` : ""}`);

    if (enemyGuardPct > 0) setEnemyGuardPct(0);
    return dmg;
  };

  const enemyTurn = () => {
    if (enemyHp <= 0) return;

    if (intent.type === "DEFEND") {
      setEnemyGuardPct(intent.value);
      pushLog(`${enemy.name} 방어 태세! (${intent.value}% 감쇠)`);
      return;
    }

    let dmg = intent.value;
    if (playerDefending) dmg = Math.round(dmg * 0.3);

    if (dmg > 0) {
      takeDamage?.(dmg);
      triggerShakePlayer();
      pushLog(`${enemy.name} 공격: ${dmg} 피해!${playerDefending ? " (방어 70% 감소)" : ""}`);

      if (heavyRecoilArmed) {
        setStunned(true);
        setHeavyRecoilArmed(false);
        pushLog(`반동! 다음 턴 행동 불가.`);
      }
    }

    setPlayerDefending(false);
  };

  const tickCooldowns = () => {
    setHeavyCd((c) => Math.max(0, c - 1));
    setLuckyCd((c) => Math.max(0, c - 1));
  };

  const nextTurn = () => {
    tickCooldowns();
    const nextIntent = rollEnemyIntent();
    setIntent(nextIntent);
    setTurn((t) => t + 1);
    setLuckyChecked(false);
    pushLog(`--- TURN ${turn + 1} ---`);
    pushLog(`적 의도: ${formatIntent(nextIntent, intentVisible)}`);
  };

  const isVictory = enemyHp <= 0;
  const isDefeat = hp <= 0;

  const canAct = !isVictory && !isDefeat && !stunned;

  // ✅ stunned 자동 스킵(턴 진행 막힘 해결)
  const stunnedConsumedRef = useRef(false);
  useEffect(() => {
    if (!stunned) {
      stunnedConsumedRef.current = false;
      return;
    }
    if (isVictory || isDefeat) return;
    if (stunnedConsumedRef.current) return;
    stunnedConsumedRef.current = true;

    pushLog("행동 불가! 이번 턴은 자동으로 넘겨진다.");
    enemyTurn();
    setStunned(false);
    if (!isDefeat) nextTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stunned]);

  const onAttack = () => {
    if (!canAct) return;

    let dmg = basePlayerAtk * 1.0;

    if (luckyChecked && luckyCd === 0) {
      const r = rollLuckyMultiplier();
      dmg *= r.mult;
      setLuckyCd(3);
      pushLog(`럭키어택! (${r.a},${r.b}) x${r.jackpot ? "2.0" : r.mult}`);
    }

    const dealt = applyPlayerDamage(dmg, false);
    enemyTurn();

    if (enemyHp - dealt <= 0) return;
    if (!isDefeat) nextTurn();
  };

  const onDefend = () => {
    if (!canAct) return;
    setPlayerDefending(true);
    pushLog("플레이어 방어!");
    enemyTurn();
    if (!isDefeat) nextTurn();
  };

  const onHeavy = () => {
    if (!canAct) return;
    if (heavyCd > 0) return;

    let dmg = basePlayerAtk * 1.3;

    if (luckyChecked && luckyCd === 0) {
      const r = rollLuckyMultiplier();
      dmg *= r.mult;
      setLuckyCd(3);
      pushLog(`럭키어택! (${r.a},${r.b}) x${r.jackpot ? "2.0" : r.mult}`);
    }

    pushLog("강공격!");
    const dealt = applyPlayerDamage(dmg, true);
    setHeavyCd(2);
    setHeavyRecoilArmed(true);

    enemyTurn();

    if (enemyHp - dealt <= 0) return;
    if (!isDefeat) nextTurn();
  };

  const onUsePotion = () => {
    if (isVictory || isDefeat) return;
    if (potions <= 0) return;
    addPotion(-1);
    healHp?.(20);
    pushLog("포션 사용: HP +20");
  };

  // 승리 처리
  const [rewardOpen, setRewardOpen] = useState(false);
  useEffect(() => {
    if (!isVictory) return;

    markMonsterDefeated?.(enemy.id, enemy.isBoss);
    addGold(enemy.goldReward);
    pushLog(`${enemy.name} 처치! 골드 +${enemy.goldReward}`);
    setRewardOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVictory]);

  const onPickReward = (kind: "POTION" | "STR" | "AGI") => {
    if (kind === "POTION") {
      addPotion(1);
      pushLog("보상: 포션 +1");
    } else if (kind === "STR") {
      addStr?.(1);
      pushLog("보상: 힘 +1");
    } else {
      addAgi?.(1);
      pushLog("보상: 민첩 +1");
    }

    setRewardOpen(false);
    completeBattleStage();
    navigate("/turn");
  };

  const weaponIcon = useMemo(() => {
    const wid = (equippedWeaponId ?? "NO_SWORD") as WeaponId;
    return WEAPONS[wid]?.img ?? "/gadgets/검.png";
  }, [equippedWeaponId]);

  const frameBg = bossStage ? `${BATTLE_DIR}/Bossbg.png` : `${BATTLE_DIR}/monsterbg.png`;
  const playerSprite = bossStage ? `${BATTLE_DIR}/boss vs player.png` : `${BATTLE_DIR}/vs player.png`;

  const enemyHpPct = clamp((enemyHp / enemy.maxHp) * 100, 0, 100);
  const playerHpPct = clamp((hp / 100) * 100, 0, 100);

  const stageDots = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const idx = i + 1;
      return { idx, cleared: idx < stage, current: idx === stage };
    });
  }, [stage]);

  const heavyDisabled = !canAct || heavyCd > 0;
  const luckyDisabled = !canAct || luckyCd > 0;

  const onEscape = () => navigate("/turn");

  return (
    <div style={styles.page}>
      <div style={styles.outsideBg} />
      <div style={styles.outsideDim} />

      <div style={styles.wrap}>
        <div style={styles.frame}>
          <div style={{ ...styles.bg, backgroundImage: `url("${frameBg}")` }} />
          <div style={styles.vignette} />

          <button type="button" style={styles.escapeBtn} onClick={onEscape}>
            도망
          </button>

          {/* top enemy ui */}
          <div style={styles.enemyTop}>
            <div style={styles.stageDots}>
              {stageDots.map((d) => (
                <div
                  key={d.idx}
                  style={{
                    ...styles.dot,
                    background: d.cleared ? "rgba(40,180,90,0.95)" : "rgba(190,50,50,0.95)",
                    boxShadow: d.current ? "0 0 0 2px rgba(255,255,255,0.55)" : "none",
                    transform: d.current ? "scale(1.12)" : "scale(1)",
                  }}
                  title={`STAGE ${d.idx}`}
                />
              ))}
            </div>

            {/* ✅ HP바: 가로 줄임 + 텍스트 가로 배치(안 잘리게) */}
            <div style={styles.enemyHpBarOuter}>
              <div style={{ ...styles.enemyHpBarInner, width: `${enemyHpPct}%` }} />
              <div style={styles.enemyHpBarTextRow}>
                <div style={styles.enemyHpName} title={enemy.name}>
                  {enemy.name}
                </div>
                <div style={styles.enemyHpValue}>
                  {enemyHp} / {enemy.maxHp}
                </div>
              </div>
            </div>

            {/* ✅ turn 사용(에러 해결) */}
            <div style={styles.intentRow}>
              <div style={styles.turnPill}>TURN {turn}</div>
              <div style={styles.intentPill}>{formatIntent(intent, intentVisible)}</div>
            </div>
          </div>

          {/* sprites */}
          {!bossStage ? (
            <>
              <img
                src={playerSprite}
                alt="player"
                draggable={false}
                style={{
                  ...styles.playerNormal,
                  ...(shakePlayer ? styles.shake : null),
                }}
              />

              {/* ✅ 일반 몬스터: "완전 동일" 박스 크기 + 오른쪽으로 이동 */}
              <div style={styles.enemyBoxNormal}>
                <img
                  src={enemy.img}
                  alt={enemy.name}
                  draggable={false}
                  style={{
                    ...styles.enemyImgFit,
                    ...(shakeEnemy ? styles.shake : null),
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* ✅ 보스: 플레이어가 안 가려지도록 배치 변경 */}
              <img
                src={playerSprite}
                alt="player"
                draggable={false}
                style={{
                  ...styles.playerBoss,
                  ...(shakePlayer ? styles.shake : null),
                }}
              />

              <div style={styles.enemyBoxBoss}>
                <img
                  src={enemy.img}
                  alt={enemy.name}
                  draggable={false}
                  style={{
                    ...styles.enemyImgFit,
                    ...(shakeEnemy ? styles.shake : null),
                  }}
                />
              </div>
            </>
          )}

          {/* player panel */}
          <div style={styles.playerBox}>
            <div style={styles.playerTitle}>Player</div>

            <div style={styles.playerHpText}>{hp} / 100</div>
            <div style={styles.playerHpBarOuter}>
              <div style={{ ...styles.playerHpBarInner, width: `${playerHpPct}%` }} />
            </div>

            <div style={styles.playerIconsRow}>
              <div style={styles.iconSlot} title="장착 무기">
                <img src={weaponIcon} alt="weapon" style={styles.slotImg} draggable={false} />
              </div>

              <button
                type="button"
                style={{ ...styles.iconSlot, ...(potions <= 0 ? styles.iconSlotDisabled : null) }}
                title={potions > 0 ? `포션 사용 (남은 ${potions})` : "포션 없음"}
                onClick={onUsePotion}
              >
                <img src="/gadgets/포션.png" alt="potion" style={styles.slotImg} draggable={false} />
                <div style={styles.potionBadge}>{potions}</div>
              </button>

              <div style={styles.statMini}>
                <div>STR {str}</div>
                <div>AGI {agi}</div>
                <div style={{ marginTop: 2, opacity: 0.92 }}>ATK {basePlayerAtk}</div>
              </div>
            </div>
          </div>

          {/* action panel */}
          <div style={styles.actionBox}>
            <button
              type="button"
              style={{ ...styles.btnAttack, ...(!canAct ? styles.btnDisabled : null) }}
              onClick={onAttack}
              disabled={!canAct}
            >
              <span style={styles.btnIcon}>⚔️</span> 공격
            </button>

            <button
              type="button"
              style={{ ...styles.btnDefend, ...(!canAct ? styles.btnDisabled : null) }}
              onClick={onDefend}
              disabled={!canAct}
            >
              <span style={styles.btnIcon}>🛡️</span> 방어
            </button>

            <button
              type="button"
              style={{ ...styles.btnHeavy, ...(heavyDisabled ? styles.btnDisabled : null) }}
              onClick={onHeavy}
              disabled={heavyDisabled}
              title={heavyCd > 0 ? `쿨다운 ${heavyCd}턴` : "강공격"}
            >
              <span style={styles.btnIcon}>💥</span> 강공격 {heavyCd > 0 ? `(${heavyCd})` : ""}
            </button>

            <label style={{ ...styles.luckyRow, ...(luckyDisabled ? styles.luckyDisabled : null) }}>
              <input
                type="checkbox"
                checked={luckyChecked}
                onChange={(e) => setLuckyChecked(e.target.checked)}
                disabled={luckyDisabled}
                style={{ transform: "scale(1.12)" }}
              />
              <span style={styles.diceIcon}>🎲</span>
              <span>럭키어택 {luckyCd > 0 ? `(쿨 ${luckyCd})` : ""}</span>
            </label>

            {stunned && <div style={styles.stunText}>반동으로 이번 턴 행동 불가</div>}
          </div>

          {/* defeat */}
          {isDefeat && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <div style={styles.overlayTitle}>패배</div>
                <div style={styles.overlayDesc}>로비로 돌아갑니다.</div>
                <button style={styles.overlayBtn} onClick={() => navigate("/lobby")}>
                  확인
                </button>
              </div>
            </div>
          )}

          {/* victory reward */}
          {rewardOpen && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <div style={styles.overlayTitle}>승리</div>
                <div style={styles.overlayDesc}>보상을 선택하세요.</div>

                <div style={styles.rewardGrid}>
                  <button style={styles.rewardBtn} onClick={() => onPickReward("POTION")}>
                    포션 +1
                  </button>
                  <button style={styles.rewardBtn} onClick={() => onPickReward("STR")}>
                    힘 +1
                  </button>
                  <button style={styles.rewardBtn} onClick={() => onPickReward("AGI")}>
                    민첩 +1
                  </button>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes hitShake {
              0% { transform: translate(0,0); }
              25% { transform: translate(-6px, 2px); }
              50% { transform: translate(6px, -2px); }
              75% { transform: translate(-4px, -2px); }
              100% { transform: translate(0,0); }
            }
          `}</style>
        </div>

        <div style={styles.logPanel}>
          <div style={styles.logTitle}>전투 로그</div>
          <div ref={logRef} style={styles.logBody}>
            {logs.map((l, i) => (
              <div key={`${i}-${l}`} style={styles.logLine}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    height: "100vh",
    background: "#000",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
  },

  outsideBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: 'url("/battle/outside.png")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(8px) saturate(0.9) contrast(1.05)",
    transform: "scale(1.04)",
    opacity: 0.85,
  },
  outsideDim: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.74)",
  },

  wrap: {
    width: "min(1700px, 97vw)",
    display: "flex",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },

  frame: {
    width: "min(1320px, 82vw)",
    aspectRatio: "16 / 9",
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 12px 70px rgba(0,0,0,0.85)",
  },

  bg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "contrast(1.05) saturate(0.95)",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.84) 100%), linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.40) 100%)",
  },

  escapeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 20,
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.50)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.2,
  },

  enemyTop: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 18,
    width: "min(640px, 52%)",
    display: "grid",
    gap: 10,
    justifyItems: "center",
  },

  stageDots: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 760,
  },
  dot: { width: 10, height: 10, borderRadius: 999 },

  // ✅ HP바: 길이 줄임 + 텍스트 가로
  enemyHpBarOuter: {
    width: "min(620px, 92%)",
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.75)",
    background: "rgba(0,0,0,0.42)",
    overflow: "hidden",
    position: "relative",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  enemyHpBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, rgba(230,60,60,0.95), rgba(150,10,10,0.95))",
  },
  enemyHpBarTextRow: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    pointerEvents: "none",
    textShadow: "0 2px 10px rgba(0,0,0,0.90)",
    gap: 10,
  },
  enemyHpName: {
    color: "rgba(255,255,255,0.96)",
    fontWeight: 900,
    fontSize: "clamp(12px, 1.05vw, 14px)",
    letterSpacing: 0.2,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: "1 1 auto",
  },
  enemyHpValue: {
    color: "rgba(255,255,255,0.90)",
    fontWeight: 900,
    fontSize: "clamp(11px, 0.95vw, 13px)",
    letterSpacing: 0.2,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },

  intentRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  turnPill: {
    color: "rgba(255,255,255,0.84)",
    fontWeight: 900,
    background: "rgba(0,0,0,0.32)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "6px 10px",
    borderRadius: 10,
  },
  intentPill: {
    color: "rgba(255,255,255,0.86)",
    fontWeight: 800,
    background: "rgba(0,0,0,0.38)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "6px 10px",
    borderRadius: 10,
    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
  },

  // 플레이어(일반)
  playerNormal: {
    position: "absolute",
    left: "3%",
    bottom: "5%",
    width: "38%",
    maxWidth: 500,
    zIndex: 6,
    pointerEvents: "none",
    filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.70))",
  },

  // ✅ 일반 몬스터: 박스 크기 고정(완전 동일) + 오른쪽 이동
  enemyBoxNormal: {
    position: "absolute",
    right: "22%", // ✅ 더 오른쪽
    top: "15%",
    width: "min(320px, 24vw)",
    height: "min(260px, 24vh)",
    zIndex: 7,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  },

  // ✅ 보스 배치: 플레이어가 안 가려지게
  playerBoss: {
    position: "absolute",
    left: "20%",
    bottom: "0%",
    width: "36%",
    maxWidth: 520,
    zIndex: 6,
    pointerEvents: "none",
    filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.78))",
  },
  enemyBoxBoss: {
    position: "absolute",
    left: "58%",
    transform: "translateX(-50%)",
    top: "10%",
    width: "min(560px, 48%)",
    height: "min(560px, 62%)",
    zIndex: 5,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  },

  enemyImgFit: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.75))",
  },

  shake: { animation: "hitShake 220ms ease" },

  playerBox: {
    position: "absolute",
    left: 18,
    bottom: 18,
    width: 280,
    height: 150,
    zIndex: 15,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.13)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.42))",
    boxShadow:
      "0 22px 70px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)",
    padding: 12,
    backdropFilter: "blur(6px)",
  },
  playerTitle: {
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 0.4,
    marginBottom: 8,
    textShadow: "0 2px 10px rgba(0,0,0,0.75)",
  },
  playerHpText: { color: "rgba(255,255,255,0.92)", fontWeight: 900, marginBottom: 8 },
  playerHpBarOuter: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.60)",
    background: "rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  playerHpBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, rgba(230,60,60,0.95), rgba(150,10,10,0.95))",
  },
  playerIconsRow: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  iconSlot: {
    width: 51,
    height: 51,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    padding: 0,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    cursor: "pointer",
  },
  iconSlotDisabled: { opacity: 0.55, cursor: "not-allowed" },
  slotImg: { width: 38, height: 38, objectFit: "contain" },
  potionBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 12,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },
  statMini: {
    marginLeft: "auto",
    color: "rgba(255,255,255,0.78)",
    fontSize: 9,
    display: "grid",
    gap: 2,
    textAlign: "right",
  },

  actionBox: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: "clamp(270px, 26%, 320px)",
    zIndex: 15,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.13)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.42))",
    boxShadow:
      "0 22px 70px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)",
    padding: 12,
    display: "grid",
    gap: 8,
    alignContent: "start",
    backdropFilter: "blur(6px)",
    minHeight: 230,
  },

  btnIcon: { marginRight: 10 },

  btnAttack: {
    height: 48,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.65)",
    background: "linear-gradient(180deg, rgba(170,25,25,0.96), rgba(95,10,10,0.92))",
    color: "#fff",
    fontWeight: 900,
    fontSize: 17,
    cursor: "pointer",
    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
  },
  btnDefend: {
    height: 48,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.65)",
    background: "linear-gradient(180deg, rgba(30,55,110,0.96), rgba(10,18,45,0.92))",
    color: "#fff",
    fontWeight: 900,
    fontSize: 17,
    cursor: "pointer",
    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
  },
  btnHeavy: {
    height: 48,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.65)",
    background: "linear-gradient(180deg, rgba(150,120,18,0.96), rgba(75,55,10,0.92))",
    color: "#fff",
    fontWeight: 900,
    fontSize: 17,
    cursor: "pointer",
    textShadow: "0 2px 10px rgba(0,0,0,0.7)",
  },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },

  luckyRow: {
    marginTop: 2,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    color: "rgba(255,255,255,0.90)",
    fontWeight: 800,
    cursor: "pointer",
    userSelect: "none",
  },
  luckyDisabled: { opacity: 0.55, cursor: "not-allowed" },
  diceIcon: { fontSize: 18 },

  stunText: {
    marginTop: 4,
    color: "#ffd7d7",
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.22)",
    background: "rgba(120,0,0,0.18)",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 60,
    background: "rgba(0,0,0,0.65)",
    display: "grid",
    placeItems: "center",
  },
  overlayCard: {
    width: 420,
    maxWidth: "90%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.72)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.78)",
    padding: 18,
    color: "#fff",
    textAlign: "center",
  },
  overlayTitle: { fontSize: 20, fontWeight: 900, marginBottom: 8 },
  overlayDesc: { color: "rgba(255,255,255,0.78)", marginBottom: 14 },
  overlayBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  rewardGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 10 },
  rewardBtn: {
    height: 44,
    borderRadius: 12,
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },

  logPanel: {
    width: 300,
    height: "min(78vh, 740px)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.65)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 12px 70px rgba(0,0,0,0.85)",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "52px 1fr",
  },
  logTitle: {
    padding: "14px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  logBody: {
    padding: 12,
    overflow: "auto",
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.45,
  },
  logLine: { marginBottom: 6 },
};
