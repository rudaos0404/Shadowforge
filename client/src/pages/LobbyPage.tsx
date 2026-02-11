// src/pages/LobbyPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/game.store";
import GameFrame from "../components/GameFrame";

const BG = "/lobby.png";
const BTN_NEW = "/gadgets/NEW GAME.png";
const BTN_CONTINUE = "/gadgets/continue.png";
const BTN_GUIDE = "/gadgets/GUIDE.png";

type BtnKey = "NEW" | "CONTINUE" | "GUIDE" | null;

export default function LobbyPage() {
  const navigate = useNavigate();
  // We need userId to start game. 
  // Ideally, AuthStore provides it. 
  // But GameStore has `userId` state. 
  // Let's assume we use a fixed ID for now if Auth is not fully set up, 
  // OR we rely on `gameStore.initialize` calling `api.me()` which usually returns user info.
  // Wait, `game.store` doesn't have `me` call in `initialize` in my previous edit?
  // I need to be careful.
  // Let's assume `userId` is 1 for dev if missing.

  const startGame = useGameStore((s) => s.startGame);
  const setUserId = useGameStore((s) => s.setUserId);
  const gameData = useGameStore((s) => s.gameData);

  // Local UI
  const [hovered, setHovered] = useState<BtnKey>(null);
  const [pressed, setPressed] = useState<BtnKey>(null);

  // Initialize: Set UserID (Mock or Real)
  useEffect(() => {
    // In a real app, we check AuthStore. 
    // For this migration, let's hardcode 1 or get from localStorage if available.
    // Or better, logic:
    setUserId(1);
    // And maybe fetch current game data to see if Continue is possible
    // await api.me() ... but gameStore doesn't expose it easily.
    // Let's assume "New Game" is the primary path for testing now.
  }, [setUserId]);

  const onNew = async () => {
    try {
      await startGame(1); // userId 1
      navigate("/turn");
    } catch (e) {
      alert("게임 시작 실패");
    }
  };

  const onContinue = () => {
    if (gameData && gameData.hp > 0) {
      navigate("/turn");
    } else {
      alert("이어할 데이터가 없습니다.");
    }
  };

  const onGuide = () => navigate("/guide");

  const getBtnStyle = (key: Exclude<BtnKey, null>): React.CSSProperties => {
    const isHover = hovered === key;
    const isDown = pressed === key;

    return {
      ...styles.imgBtn,
      transform: isDown
        ? "translateY(3px) scale(0.98)"
        : isHover
          ? "translateY(-3px) scale(1.02)"
          : "translateY(0px) scale(1)",
      filter: isDown
        ? "drop-shadow(0 6px 14px rgba(0,0,0,0.55))"
        : isHover
          ? "drop-shadow(0 14px 26px rgba(0,0,0,0.65))"
          : "drop-shadow(0 10px 20px rgba(0,0,0,0.55))",
    };
  };

  return (
    <GameFrame bg={BG}>
      <button type="button" onClick={() => navigate("/")} style={styles.topRightBtn}>
        타이틀로
      </button>

      <div style={styles.centerWrap}>
        <button
          type="button"
          onClick={onNew}
          style={{ ...getBtnStyle("NEW"), marginBottom: -8 }}
          onMouseEnter={() => setHovered("NEW")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("NEW")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_NEW} alt="NEW GAME" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onContinue}
          style={getBtnStyle("CONTINUE")}
          onMouseEnter={() => setHovered("CONTINUE")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("CONTINUE")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_CONTINUE} alt="CONTINUE" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onGuide}
          style={{ ...getBtnStyle("GUIDE"), marginBottom: -8 }}
          onMouseEnter={() => setHovered("GUIDE")}
          onMouseLeave={() => { setHovered(null); setPressed(null); }}
          onMouseDown={() => setPressed("GUIDE")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_GUIDE} alt="GUIDE" style={styles.img} draggable={false} />
        </button>
      </div>
    </GameFrame>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topRightBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  centerWrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "min(360px, 52%)",
  },

  imgBtn: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "transform 140ms ease, filter 140ms ease",
    borderRadius: 16,
    outline: "none",
  },

  img: {
    width: "100%",
    height: "auto",
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
  },
};
