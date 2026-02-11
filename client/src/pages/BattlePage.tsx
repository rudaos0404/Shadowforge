import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore, WEAPONS } from "../stores/game.store";
import type { Monster } from "../shared/api/types";

// ✨ Sub-components
import BattleHUD from "../components/battle/BattleHUD";
import BattleStage from "../components/battle/BattleStage";
import BattleControls from "../components/battle/BattleControls";
import BattleLog from "../components/battle/BattleLog";
import PlayerPanel from "../components/battle/PlayerPanel";
import VictoryOverlay from "../components/battle/VictoryOverlay";

const BATTLE_DIR = "/battle";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatIntent(monster: Monster | undefined, intent: string | undefined | null, visible: boolean) {
  if (!monster || !intent) return "❓  ???";
  if (!visible) return "❓  ???";
  if (intent === "ATTACK") return `⚔️  공격 준비`;
  if (intent === "DEFENSE") return `🛡️  방어 태세`;
  return "❓  ???";
}

export default function BattlePage() {
  const navigate = useNavigate();

  // ✅ Store State (Server Synced)
  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const battleAction = useGameStore((s) => s.battle);
  const claimReward = useGameStore((s) => s.claimReward);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const isLoading = useGameStore((s) => s.isLoading);

  // ✅ Server Data mapping
  const stage = gameData?.currentTurn ?? 1;
  const hp = gameData?.hp ?? 0;
  const maxHp = gameData?.maxHp ?? 100;
  const str = gameData?.str ?? 0;
  const agi = gameData?.agi ?? 0;
  const equippedWeaponId = gameData?.equippedWeapon;
  const luckyCooldown = gameData?.luckyCooldown ?? 0;
  const stunned = gameData?.stunned ?? false;

  const monster = useGameStore((s) => s.currentMonster);

  const [logs, setLogs] = useState<string[]>([]);

  // Local UI states
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [luckyChecked, setLuckyChecked] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);

  // Derived
  const isVictory = (monster?.hp ?? 0) <= 0;
  const isDefeat = hp <= 0;
  const canAct = !isLoading && !isVictory && !isDefeat && !stunned;

  // Intent
  const [nextIntent, setNextIntent] = useState<string | null>(null);
  const [canSeeIntent, setCanSeeIntent] = useState(false);

  // Initialize
  const storeNextIntent = useGameStore((s) => s.nextMonsterIntent);
  const storeCanSeeIntent = useGameStore((s) => s.canSeeIntent);

  const pushLog = (lines: string[]) => {
    setLogs((prev) => [...prev.slice(-50), ...lines]);
  };

  useEffect(() => {
    if (!gameData || !userId) {
      navigate("/");
      return;
    }
    // ✨ 초기 의도 동기화
    setNextIntent(storeNextIntent);
    setCanSeeIntent(storeCanSeeIntent);
  }, [gameData, userId, navigate, storeNextIntent, storeCanSeeIntent]);

  // ✨ 상태가 SELECTING으로 바뀌면 즉시 퇴장 (로딩 멈춤 방지)
  useEffect(() => {
    if (gameData?.state === 'SELECTING' && !rewardOpen) {
      navigate('/turn');
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

  // Actions
  const handleAction = async (action: string) => {
    if (!monster || !canAct || !userId) return;

    try {
      const res = await battleAction(userId, monster.id, action, luckyChecked && action !== 'DEFENSE');

      pushLog(res.logs);

      if (res.result === 'WIN') {
        setRewardOpen(true);
      } else if (res.result === 'LOSE') {
        // 패배 처리
      }

      if (action === 'ATTACK' || action === 'STRONG_ATTACK') triggerShakeEnemy();
      if (res.monsterAction === 'ATTACK') triggerShakePlayer();

      setNextIntent(res.nextMonsterIntent);
      setCanSeeIntent(res.canSeeIntent);

      if (luckyChecked) setLuckyChecked(false);

    } catch (e) {
      console.error(e);
      pushLog(['❌ 통신 오류 발생']);
    }
  };

  const onAttack = () => handleAction('ATTACK');
  const onDefend = () => handleAction('DEFENSE');
  const onHeavy = () => handleAction('STRONG_ATTACK');

  const onPickReward = async (kind: 'STR' | 'AGI' | 'POTION') => {
    if (!userId) return;
    try {
      await claimReward(userId, kind);

      const res = await nextTurn(userId);
      setRewardOpen(false); // ✨ 턴 전환 정보까지 온 후 보상창 딛기

      // 일반 턴이면 이동, 보스전이면 배틀 페이지 유지
      if (res.state === 'SELECTING') {
        navigate("/turn");
      }
    } catch (e) {
      console.error(e);
      alert("보상 처리 중 오류가 발생했습니다.");
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

  // Visuals
  const weaponIcon = WEAPONS[equippedWeaponId as string]?.img ?? "/gadgets/검.png";
  const isBossBattle = gameData?.state === 'BOSS_BATTLE';
  const bgImg = isBossBattle ? `${BATTLE_DIR}/Bossbg.png` : `${BATTLE_DIR}/monsterbg.png`;
  const playerImg = isBossBattle ? `${BATTLE_DIR}/boss vs player.png` : `${BATTLE_DIR}/vs player.png`;

  const isInBattle = gameData?.state === 'BATTLE' || gameData?.state === 'BOSS_BATTLE';

  // ✨ 로딩 및 상태 예외 처리
  if (!gameData) return <div style={styles.page}>Loading Battle...</div>;

  // 1. 정말 데이터가 필요한 로딩 중인 경우
  if (isInBattle && !monster && isLoading) {
    return <div style={styles.page}>Loading Battle...</div>;
  }

  // 2. 이미 전투가 종료되어 선택 단계로 넘어간 경우 (화면 숨기기 및 즉시 이동 대기)
  if (!isInBattle && !rewardOpen) {
    return null;
  }

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

          <button type="button" style={styles.escapeBtn} onClick={onEscape}>
            도망
          </button>

          <BattleHUD
            stage={stage}
            monster={monster}
            intentText={formatIntent(monster || undefined, nextIntent, canSeeIntent)}
            styles={styles}
            clamp={clamp}
          />

          {/* Player Panel & Actions (Bottom layout) */}
          <div style={styles.bottomBar}>
            <PlayerPanel
              hp={hp}
              maxHp={maxHp}
              str={str}
              agi={agi}
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

          {/* Overlays */}
          {isDefeat && (
            <div style={styles.overlay}>
              <div style={styles.overlayTitle}>DEFEAT</div>
              <div style={styles.overlaySub}>여정은 여기까지입니다...</div>
              <button style={styles.exitBtn} onClick={() => navigate("/")}>
                타이틀로 이동
              </button>
            </div>
          )}

          {rewardOpen && <VictoryOverlay onPickReward={onPickReward} styles={styles} />}
        </div>

        <BattleLog logs={logs} styles={styles} />
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
    fontFamily: "'Inter', sans-serif",
  },
  outsideBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: 'url("/battle_bg_blur.png")', // If exists, else fallback
    backgroundSize: "cover",
    filter: "blur(20px) brightness(0.4)",
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
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    backdropFilter: "blur(8px)",
    transition: "all 0.2s",
  },

  enemyTop: {
    position: "absolute",
    top: 30,
    left: "50%",
    transform: "translateX(-50%)",
    width: 440,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  intentRow: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
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
    background: "rgba(0,0,0,0.7)",
    padding: "4px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#ffc107",
    border: "1px solid rgba(255,193,7,0.3)",
    boxShadow: "0 0 15px rgba(255,193,7,0.1)",
  },

  enemyHpBarOuter: {
    width: "100%",
    height: 32,
    background: "rgba(0,0,0,0.6)",
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  },
  enemyHpBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, #c62828 0%, #ef5350 100%)",
    boxShadow: "0 0 20px rgba(239, 83, 80, 0.4)",
    transition: "width 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
  },
  enemyHpBarTextRow: {
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "space-between",
    padding: "0 14px",
    color: "white",
    alignItems: "center",
    pointerEvents: "none",
  },
  monsterName: { fontWeight: 900, fontSize: 15, textShadow: "0 2px 4px rgba(0,0,0,0.8)" },
  monsterHpVal: { fontWeight: 700, fontSize: 13, opacity: 0.9 },

  centerStage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 120, // Leave room for bottom bar
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "0 80px",
  },
  spriteWrap: {
    flex: 1,
    display: "grid",
    placeItems: "center",
  },
  playerSprite: {
    width: 200,
    height: "auto",
    filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.8))",
    transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    position: "relative",
    top: 150,
  },
  enemySprite: {
    width: 320,
    height: 320,
    objectFit: "contain",
    filter: "drop-shadow(0 15px 45px rgba(0,0,0,0.9))",
    transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  shake: { transform: "translateX(8px)" },

  // Bottom layout
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "0 40px 30px 40px",
    pointerEvents: "none",
  },

  playerBox: {
    width: 300,
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "16px 20px",
    borderRadius: 20,
    color: "white",
    pointerEvents: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
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
    background: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 16,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  playerHpBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, #43a047 0%, #66bb6a 100%)",
    boxShadow: "0 0 15px rgba(102, 187, 106, 0.3)",
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
    width: 440,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    pointerEvents: "auto",
    alignItems: "flex-end",
  },
  mainActions: {
    display: "flex",
    gap: 12,
    width: "100%",
  },
  btnAction: {
    flex: 1,
    height: 84,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 18,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backdropFilter: "blur(10px)",
    transition: "all 0.2s",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  btnIcon: { fontSize: 24 },
  btnLabel: { fontSize: 13, fontWeight: 800, opacity: 0.8 },
  btnHeavyCol: { background: "rgba(255, 152, 0, 0.1)", borderColor: "rgba(255, 152, 0, 0.3)" },

  luckyToggle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    padding: "8px 20px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
  },
  luckyCheck: { width: 18, height: 18 },
  luckyText: { fontSize: 13, fontWeight: 700, letterSpacing: 0.5 },

  // Logs
  logPanel: {
    width: 320,
    height: 640,
    background: "rgba(10,10,10,0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
  },
  logHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontWeight: 900,
    fontSize: 14,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logCircle: { width: 8, height: 8, borderRadius: "50%", background: "#4caf50" },
  logBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "rgba(255,255,255,0.7)",
  },
  logLine: { fontSize: 13, lineHeight: 1.5, wordBreak: "break-all" },

  // Overlays
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    zIndex: 100,
    animation: "fadeIn 0.5s ease forwards",
  },
  overlayTitle: { fontSize: 80, fontWeight: 900, letterSpacing: 10, color: "#f44336", marginBottom: 10 },
  overlaySub: { fontSize: 18, opacity: 0.6, marginBottom: 40 },
  exitBtn: {
    padding: "16px 32px",
    background: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s",
  },

  victoryTitle: {
    fontSize: 80,
    fontWeight: 900,
    letterSpacing: 15,
    background: "linear-gradient(180deg, #ffd700, #ffa000)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    filter: "drop-shadow(0 0 20px rgba(255,215,0,0.4))",
    marginBottom: 40,
  },
  rewardBox: { width: 440, background: "rgba(255,255,255,0.05)", padding: 30, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" },
  rewardHead: { textAlign: "center", marginBottom: 24, fontSize: 18, fontWeight: 700, opacity: 0.8 },
  rewardBtns: { display: "flex", flexDirection: "column", gap: 12 },
  rewardBtn: {
    padding: "16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 15,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  rewardIcon: { fontSize: 20 },
};
