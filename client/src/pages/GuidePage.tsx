import { useNavigate } from "react-router-dom";
import GameFrame from "../components/GameFrame";

const BG = "/gadgets/lobby.png";

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <GameFrame bg={BG}>
      <button type="button" onClick={() => navigate("/lobby")} style={styles.topRightBtn}>
        로비
      </button>

      <div style={styles.panel}>
        <h1 style={styles.h1}>GUIDE</h1>

        <div style={styles.section}>
          <h2 style={styles.h2}>진행</h2>
          <p style={styles.p}>스테이지마다 선택지 카드에서 행동을 선택한다.</p>
          <ul style={styles.ul}>
            <li>전투: 승리 시 다음 STAGE</li>
            <li>상점/보물: 확정(획득) 시 다음 STAGE</li>
            <li>돌아가기/취소 시 STAGE 유지</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>상점</h2>
          <p style={styles.p}>포션/무기를 담고 “구매 확정”을 눌러야 적용된다.</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>인벤토리</h2>
          <p style={styles.p}>보유 무기를 장착/해제할 수 있다.</p>
        </div>
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

  panel: {
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translate(-50%, -50%)",
    width: "min(820px, 88%)",
    padding: "28px 26px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    color: "rgba(255,255,255,0.92)",
  },

  h1: { margin: 0, fontSize: 34, letterSpacing: 1 },
  section: { marginTop: 18 },
  h2: { margin: "0 0 8px 0", fontSize: 18, opacity: 0.95 },
  p: { margin: "0 0 8px 0", lineHeight: 1.6, opacity: 0.9 },
  ul: { margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.9 },
};
