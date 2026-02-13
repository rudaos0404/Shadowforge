// BattlePage.tsx
import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/game.store";
import type { Monster } from "../shared/api/types";

// ✨ Sub-components
import BattleHUD from "../components/battle/BattleHUD";
import BattleStage from "../components/battle/BattleStage";
import BattleControls from "../components/battle/BattleControls";
import PlayerPanel from "../components/battle/PlayerPanel";
import VictoryOverlay from "../components/battle/VictoryOverlay";

const BATTLE_DIR = "/battle";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatIntent(
  monster: Monster | undefined,
  intent: string | undefined | null,
  visible: boolean
) {
  if (!monster || !intent) return "❓  ???";
  if (!visible) return "❓  ???";
  if (intent === "ATTACK") return `⚔️  공격 준비`;
  if (intent === "DEFENSE") return `🛡️  방어 태세`;
  return "❓  ???";
}

export default function BattlePage() {
  const navigate = useNavigate();

  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const battleAction = useGameStore((s) => s.battle);
  const claimReward = useGameStore((s) => s.claimReward);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const isLoading = useGameStore((s) => s.isLoading);
  const weapons = useGameStore((s) => s.weapons); // 동적 무기 데이터

  const stage = gameData?.currentTurn ?? 1;
  const hp = gameData?.hp ?? 0;
  const maxHp = gameData?.maxHp ?? 100;
  const str = gameData?.str ?? 0;
  const agi = gameData?.agi ?? 0;
  const potions = gameData?.potions ?? 0;
  const equippedWeaponId = gameData?.equippedWeapon;
  const luckyCooldown = gameData?.luckyCooldown ?? 0;
  const stunned = gameData?.stunned ?? false;

  const monster = useGameStore((s) => s.currentMonster);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [luckyChecked, setLuckyChecked] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [escapeHover, setEscapeHover] = useState(false);

  const isVictory = (monster?.hp ?? 0) <= 0;
  const isDefeat = hp <= 0;
  const canAct = !isLoading && !isVictory && !isDefeat && !stunned;

  const [nextIntent, setNextIntent] = useState<string | null>(null);
  const [canSeeIntent, setCanSeeIntent] = useState(false);

  const storeNextIntent = useGameStore((s) => s.nextMonsterIntent);
  const storeCanSeeIntent = useGameStore((s) => s.canSeeIntent);

  useEffect(() => {
    if (!gameData || !userId) {
      navigate("/");
      return;
    }
    setNextIntent(storeNextIntent);
    setCanSeeIntent(storeCanSeeIntent);
  }, [gameData, userId, navigate, storeNextIntent, storeCanSeeIntent]);

  useEffect(() => {
    if (gameData?.state === "SELECTING" && !rewardOpen) {
      navigate("/turn");
    }
  }, [gameData?.state, navigate, rewardOpen]);

  const triggerShakePlayer = () => {
    setShakePlayer(true);
    setTimeout(() => setShakePlayer(false), 220);
  };
  const triggerShakeEnemy = () => {
    setShakeEnemy(true);
    setTimeout(() => setShakeEnemy(false), 220);
  };

  const handleAction = async (action: string) => {
    if (!monster || !canAct || !userId) return;

    try {
      const res = await battleAction(
        userId,
        monster.id,
        action,
        luckyChecked && action !== "DEFENSE"
      );

      if (res.result === "WIN") setRewardOpen(true);

      if (action === "ATTACK" || action === "STRONG_ATTACK") triggerShakeEnemy();
      if (res.monsterAction === "ATTACK") triggerShakePlayer();

      setNextIntent(res.nextMonsterIntent);
      setCanSeeIntent(res.canSeeIntent);

      if (luckyChecked) setLuckyChecked(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onAttack = () => handleAction("ATTACK");
  const onDefend = () => handleAction("DEFENSE");
  const onHeavy = () => handleAction("STRONG_ATTACK");

  const onPickReward = async (kind: "STR" | "AGI" | "POTION") => {
    if (!userId) return;
    try {
      await claimReward(userId, kind);
      const res = await nextTurn(userId);
      setRewardOpen(false);
      if (res.state === "SELECTING") navigate("/turn");
    } catch (e) {
      console.error(e);
      alert("보상 처리 중 오류가 발생했습니다.");
    }
  };

  const onUsePotion = async () => {
    if (!userId || !canAct || potions <= 0) return;
    try {
      await useGameStore.getState().usePotion(userId);
    } catch (e: any) {
      console.error(e);
    }
  };

  const onEscape = async () => {
    if (!userId) return;
    try {
      await useGameStore.getState().escapeBattle(userId);
      navigate("/turn");
    } catch (e) {
      console.error(e);
      alert("탈출 중 오류 발생");
    }
  };

  const weaponIcon = weapons[equippedWeaponId as string]?.img ?? "/gadgets/검.png";
  const isBossBattle = gameData?.state === "BOSS_BATTLE";
  const bgImg = isBossBattle ? `${BATTLE_DIR}/Bossbg.png` : `${BATTLE_DIR}/monsterbg.png`;
  const playerImg = isBossBattle ? `${BATTLE_DIR}/boss vs player.png` : `${BATTLE_DIR}/vs player.png`;

  const isInBattle = gameData?.state === "BATTLE" || gameData?.state === "BOSS_BATTLE";

  if (!gameData) return <div style={styles.page}>Loading Battle...</div>;
  if (isInBattle && !monster && isLoading) return <div style={styles.page}>Loading Battle...</div>;
  if (!isInBattle && !rewardOpen) return null;

  return (
    <div style={styles.page}>
      <div style={styles.outsideBg} />
      <div style={styles.outsideDim} />

      <div style={styles.wrap}>
        <div style={styles.frame}>
          <BattleStage
            bgImg={bgImg}
            playerImg={playerImg}
            monster={monster}
            shakePlayer={shakePlayer}
            shakeEnemy={shakeEnemy}
            styles={styles}
          />

            <button
            type="button"
            style={{
              ...styles.escapeBtn, 
              ...(escapeHover ? styles.escapeBtnHover : null), 
            }}
            onClick={onEscape}
            onMouseEnter={() => setEscapeHover(true)} 
            onMouseLeave={() => setEscapeHover(false)} 
            aria-label="도망" 
          >
            <img
              src="/battle/run.png" 
              alt="도망"
              style={styles.escapeImg} 
              draggable={false} 
            />
          </button>


          <BattleHUD
            stage={stage}
            monster={monster}
            intentText={formatIntent(monster || undefined, nextIntent, canSeeIntent)}
            styles={styles}
            clamp={clamp}
          />

          <div style={styles.bottomBar}>
            <PlayerPanel
              hp={hp}
              maxHp={maxHp}
              str={str}
              agi={agi}
              potions={potions}
              onUsePotion={onUsePotion}
              weaponIcon={weaponIcon}
              styles={styles}
              clamp={clamp}
            />

            <BattleControls
              canAct={canAct}
              luckyCooldown={luckyCooldown}
              luckyChecked={luckyChecked}
              setLuckyChecked={setLuckyChecked}
              onAttack={onAttack}
              onDefend={onDefend}
              onHeavy={onHeavy}
              styles={styles}
            />
          </div>

          {isDefeat && (
            <div style={styles.overlay}>
              <div style={styles.overlayContent}>
              <div style={styles.overlayTitle}>DEFEAT</div>
              <div style={styles.overlaySub}>여정은 여기까지입니다...</div>
              <button style={styles.exitBtn} onClick={() => navigate("/")}>
                타이틀로 이동
              </button>
              </div>
            </div>
          )}

          {rewardOpen && <VictoryOverlay onPickReward={onPickReward} styles={styles} />}
        </div>
      </div>
    </div>
  );
}

// ✅ BattleControls.tsx 기준 동기화
const BTN_W = 140;
const BTN_H = 85;

// ✅ (요청) BattleControls.tsx와 GAP 동기화: 6 → 3
const GAP = 3;

const GROUP_W = BTN_W * 3 + GAP * 2;

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    height: "100vh",
    background: "#000",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  outsideBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: 'url("/battle/outside.png")', // <--- 여기를 수정 (outside.png로 교체)
    backgroundSize: "cover",
    backgroundPosition: "center", // <--- 여기를 수정 (중앙 기준)
    transform: "scale(1.08)", // <--- 여기를 수정 (블러로 생기는 가장자리 빈틈 방지)
    filter: "blur(12px) brightness(0.5)", // <--- 여기를 수정 (블러/밝기 조절)
  },
  outsideDim: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" },

  wrap: { display: "flex", gap: 20, zIndex: 10, alignItems: "stretch" },

  frame: {
    width: 960,
    height: 640,
    position: "relative",
    background: "#121212",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 20px 80px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.1)",
  },

  bg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "background 0.5s ease",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)",
    pointerEvents: "none",
  },

    escapeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 20,
    background: "transparent", // <--- 여기를 수정
    border: 0, // <--- 여기를 수정
    padding: 0, // <--- 여기를 수정
    borderRadius: 0, // <--- 여기를 수정
    cursor: "pointer",
    transition: "transform 120ms ease, filter 120ms ease", // <--- 여기를 수정
  },

  escapeBtnHover: {
    transform: "scale(1.00)", // <--- 여기를 수정 (호버 확대감)
    filter: "brightness(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.55))", // <--- 여기를 수정 (호버 느낌)
  },

  escapeImg: {
    width: 96, // <--- 여기를 수정 (표시 사이즈)
    height: 40, // <--- 여기를 수정 (표시 사이즈)
    display: "block",
    userSelect: "none",
    WebkitUserSelect: "none",
    pointerEvents: "none",
  },


  enemyTop: {
    position: "absolute",
    top: 14,
    left: "50%",
    transform: "translateX(-50%)",
    width: 440,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
    intentBoxWrap: {
    position: "relative",
    width: 160, // <--- 여기를 수정 (의도 박스 표시 크기)
    height: 40, // <--- 여기를 수정
    alignSelf: "center",
    display: "grid",
    placeItems: "center",
  },

  intentBoxImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    zIndex: 0,
  },

  enemyHpBoxWrap: {
    position: "relative",
    width: 960, // <--- 여기를 수정 (1400/2)
    height: 48, // <--- 여기를 수정 (1400/2)
    alignSelf: "center",
    display: "block", // <--- 여기를 수정 (중앙정렬로 내려가는 문제 방지)
  },

  enemyHpBoxImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "fill",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    zIndex: 0,
    transform: "translateY(-5px)", // <--- 여기를 수정 (박스만 위로)
  },


  intentRow: {
    position: "absolute", // <--- 여기를 수정
    inset: 0,             // <--- 여기를 수정 (박스 전체 덮기)
    display: "grid",      // <--- 여기를 수정
    placeItems: "center", // <--- 여기를 수정
    zIndex: 1,            // <--- 여기를 수정 (박스 이미지 위로)
    transform: "translate(-1px, -1px)", // <--- 여기를 수정 (x, y) 
  },

  turnPill: {
    background: "rgba(255,255,255,0.15)",
    padding: "4px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  intentPill: {
    background: "transparent",
    padding: "0", // <--- 여기를 수정 (박스 크기 줄였으니 패딩 제거)
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700, // <--- 여기를 수정 (가독성)
    color: "#ffc107",
    border: "0",
    boxShadow: "none",
    textShadow: "0 2px 6px rgba(0,0,0,0.8)", // <--- 여기를 수정 (텍스트 안 보이는 문제 보강)
  },



  enemyHpBarOuter: {
    width: 335.7,
    height: 24.5,
    background: "rgba(0,0,0,0.25)", // <--- 여기를 수정 (홈 바닥 톤)
    position: "absolute",
    left: "50.06%",
    transform: "translateX(-50%)",
    top: 7,
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)", // <--- 여기를 수정 (얇은 테두리)
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.55)", // <--- 여기를 수정 (홈에 들어간 느낌)
    zIndex: 1,
  },

  enemyHpBarInner: {
    height: "100%",
    borderRadius: 3,
    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%), linear-gradient(90deg, #7a1f1f 0%, #c43737 45%, #e05858 100%)", // <--- 여기를 수정
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 6px rgba(0,0,0,0.35)", // <--- 여기를 수정 (바 자체 입체감)
    transition: "width 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
  },


  enemyHpBarTextRow: {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "space-between",
    padding: "0 14px",
    color: "rgba(255,255,255,0.92)", // <--- 여기를 수정
    alignItems: "center",
    pointerEvents: "none",
    transform: "translateY(-1px)",
    textShadow: "0 2px 6px rgba(0,0,0,0.85)", // <--- 여기를 수정 (프레임 위에서 가독성)
  },



  monsterName: { fontWeight: 900, fontSize: 15, textShadow: "0 2px 4px rgba(0,0,0,0.8)" },
  monsterHpVal: { fontWeight: 800, fontSize: 13, opacity: 0.95 }, // <--- 여기를 수정

  centerStage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 80px",
  },
  spriteWrap: {
    flex: 1,
    display: "grid",
    placeItems: "center",
    minWidth: 420,
  },
  playerSprite: {
    width: 200,
    height: "auto",
    filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.8))",
    transition: "none",
    position: "relative",
    top: 150,
  },
  enemySprite: {
    width: 320,
    height: 320,
    objectFit: "contain",
    filter: "drop-shadow(0 15px 45px rgba(0,0,0,0.9))",
    transition: "none",
  },
  shake: { transform: "translateX(8px)" },
  shakeWrap: {
    display: "inline-block",
    animation: "hitShake 220ms ease-in-out",
    willChange: "transform",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform: "translateZ(0)",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    background:
      "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "0 15px 25px 15px",
    pointerEvents: "none",
  },


  playerBox: {
    width: 310,
    padding: 0,
    background: "transparent",
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    pointerEvents: "auto",
  },

  playerBarRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  playerTitle: { fontWeight: 900, fontSize: 13, letterSpacing: 1, opacity: 0.6 },
  playerHpText: { fontWeight: 800, fontSize: 16 },
  
  playerHpBarOuter: {
    width: "100%",
    height: 10,
    background: "rgba(0,0,0,0.35)", // <--- 여기를 수정 (홈 바닥 톤)
    borderRadius: 3, // <--- 여기를 수정 (프레임 각진 느낌에 맞춤)
    overflow: "hidden",
    marginBottom: 16,
    border: "1px solid rgba(255,255,255,0.08)", // <--- 여기를 수정 (얇은 테두리)
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.65)", // <--- 여기를 수정 (홈에 들어간 느낌)
  },
  
  playerHpBarInner: {
    height: "100%",
    borderRadius: 3, // <--- 여기를 수정 (outer와 통일)
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%), linear-gradient(90deg, #3e5a22 0%, #6e8f34 55%, #a7c957 100%)", // <--- 여기를 수정 (올리브/황동 톤)
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.35)", // <--- 여기를 수정 (질감)
    transition: "width 0.4s ease",
  },

  playerStatRow: { display: "flex", gap: 15, alignItems: "center" },
  slotWrap: {
    width: 50,
    height: 50,
    background: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    placeItems: "center",
  },
  slotImg: { width: 40, height: 40, objectFit: "contain" },
  statMini: { display: "flex", flexDirection: "column", gap: 2 },
  statItem: { fontSize: 14, fontWeight: 700 },
  statLabel: { opacity: 0.5, fontSize: 11, fontWeight: 500, marginRight: 6 },

  actionBox: {
    width: GROUP_W,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    pointerEvents: "auto",
    alignItems: "flex-end",
    marginLeft: "auto",
  },

  mainActions: {
    display: "flex",
    gap: GAP,
    width: "100%",
    justifyContent: "flex-end",
  },

  btnAction: {
    width: BTN_W,
    height: BTN_H,
    flex: "0 0 auto",
    background: "transparent",
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
  },

  btnIcon: { fontSize: 24 },
  btnLabel: { fontSize: 13, fontWeight: 800, opacity: 0.8 },
  btnHeavyCol: { background: "rgba(255, 152, 0, 0.1)", borderColor: "rgba(255, 152, 0, 0.3)" },

  luckyToggle: {
    width: 180,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.55)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.55)",
    cursor: "pointer",
    gap: 0,
    color: "#fff",
  },
  luckyCheck: { width: 18, height: 18 },
  luckyText: { fontSize: 13, fontWeight: 700, letterSpacing: 0.5 },


  /**
   * =========================
   * CTRL+F: BATTLE_PAGE_OVERLAY_STYLES
   * =========================
   * 승리/패배 오버레이 + 로그 스크롤이 “안 보이거나/안 움직이는” 문제 해결용
   * (기존 로직/배치는 그대로, 스타일 키만 추가)
   */
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 999,
    background: "rgba(0,0,0,0.72)",
    display: "grid",
    placeItems: "center",
    pointerEvents: "auto",
  },
  overlayContent: {                      // <--- 여기 수정(추가)
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,                             // <--- 여기 수정(간격 조절)
    textAlign: "center",
  },
  overlayTitle: {
    fontSize: 44,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#ff4d4d",
    textShadow: "0 10px 40px rgba(0,0,0,0.9)",
    marginBottom: 0,
  },
  overlaySub: {
    fontSize: 16,
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 0,
    textShadow: "0 6px 24px rgba(0,0,0,1)",
  },
  exitBtn: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    letterSpacing: 0.5,
    marginTop: 10,
  },

  // VictoryOverlay.tsx에서 사용하는 스타일 키들
  victoryTitle: {
    fontSize: 44,
    fontWeight: 900,
    letterSpacing: 2,
    color: "#fff",
    textShadow: "0 10px 40px rgba(0,0,0,0.9)",
    marginBottom: 14,
  },
  rewardBox: {
    width: 420,
    borderRadius: 18,
    background: "rgba(15,15,15,0.9)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.85)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  rewardHead: {
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.75)",
    paddingBottom: 10,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  rewardBtns: { display: "flex", flexDirection: "column", gap: 10 },
  rewardBtn: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
  },
  rewardIcon: { fontSize: 18 },

  // BattleLog.tsx에서 흔히 쓰는 스크롤 바디
};
