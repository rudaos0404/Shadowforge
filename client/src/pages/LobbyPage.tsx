import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/game.store";

// GameFrame은 "사용만"
import GameFrame from "../components/GameFrame";

const BG = "/lobby.png";
const BTN_NEW = "/gadgets/NEW GAME.png";
const BTN_CONTINUE = "/gadgets/continue.png";
const BTN_GUIDE = "/gadgets/GUIDE.png";

type BtnKey = "NEW" | "CONTINUE" | "GUIDE" | null;

export default function LobbyPage() {
  const navigate = useNavigate();
  const loadLocal = useGameStore((s) => s.loadLocal);
  const newGame = useGameStore((s) => s.newGame);

  const [hovered, setHovered] = useState<BtnKey>(null);
  const [pressed, setPressed] = useState<BtnKey>(null);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  const onNew = () => {
    newGame();
    navigate("/turn");
  };

  const onContinue = () => {
    loadLocal();
    navigate("/turn");
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
    <GameFrame backgroundUrl={BG}>
      {/* 우상단: 타이틀로 */}
      <button type="button" onClick={() => navigate("/")} style={styles.topRightBtn}>
        타이틀로
      </button>

      {/* 중앙 버튼 영역 */}
      <div style={styles.centerWrap}>
        <button
          type="button"
          onClick={onNew}
          style={{ ...getBtnStyle("NEW"), marginBottom: -8 }}
          aria-label="새 게임"
          onMouseEnter={() => setHovered("NEW")}
          onMouseLeave={() => {
            setHovered(null);
            setPressed(null);
          }}
          onMouseDown={() => setPressed("NEW")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_NEW} alt="NEW GAME" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onContinue}
          style={getBtnStyle("CONTINUE")}
          aria-label="이어하기"
          onMouseEnter={() => setHovered("CONTINUE")}
          onMouseLeave={() => {
            setHovered(null);
            setPressed(null);
          }}
          onMouseDown={() => setPressed("CONTINUE")}
          onMouseUp={() => setPressed(null)}
        >
          <img src={BTN_CONTINUE} alt="CONTINUE" style={styles.img} draggable={false} />
        </button>

        <button
          type="button"
          onClick={onGuide}
          style={{ ...getBtnStyle("GUIDE"), marginBottom: -8 }}
          aria-label="가이드"
          onMouseEnter={() => setHovered("GUIDE")}
          onMouseLeave={() => {
            setHovered(null);
            setPressed(null);
          }}
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
    gap: 24, // ✅ 간격 약간 줄임
    alignItems: "center",
    justifyContent: "center",

    // ✅ 버튼 크기 줄이기(여기만 조절하면 전체가 같이 줄어듦)
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

    // 키보드 포커스 때도 “버튼” 느낌 나게
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
