// src/pages/TreasurePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameFrame from "../components/GameFrame"; // 너 프로젝트에서 쓰는 경로 그대로 유지
import { useGameStore } from "../stores/game.store";

const BG = "/turn.png";
const CHEST_2 = "/gadgets/보물상자2.png";
const CHEST_3 = "/gadgets/보물상자3.png";

export default function TreasurePage() {
  const navigate = useNavigate();

  const nextTurn = useGameStore((s) => s.nextTurn);
  const userId = useGameStore((s) => s.userId);
  const rewardGold = useGameStore((s) => s.rewardGold);

  const [claimed, setClaimed] = useState(false);
  const [chestImg, setChestImg] = useState<string>(CHEST_2);
  const [toast,] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);

  const goNextDelayMs = 1400;

  useEffect(() => {
    if (!toastVisible) return;
    const t = window.setTimeout(() => setToastVisible(false), );
    return () => window.clearTimeout(t);
  }, [toastVisible]);

  const onClaim = () => {
    if (claimed) return;
    if (rewardGold === null || !userId) return;

    setClaimed(true);
    setChestImg(CHEST_3);

    window.setTimeout(async () => {
      await nextTurn(userId);
      navigate("/turn");
    }, goNextDelayMs);
  };

  return (
    <GameFrame>
      {/* ✅ GameFrame은 건드리지 않고, 내부에서 배경을 준다 */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {/* 살짝 어둡게 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
          }}
        />

        {/* 컨텐츠 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          {/* ✅ 바깥 큰 박스(프레임 내부) */}
          <div
            style={{
              width: "min(980px, 92%)",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 18,
              background: "rgba(0,0,0,0.35)",
              padding: 28,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            {/* ✅ 제목/설명: 중앙 정렬 */}
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 2 }}>
                보물
              </div>
              <div style={{ opacity: 0.9, marginTop: 6 }}>
                수상한 상자를 발견했다.
              </div>
            </div>

            {/* ✅ 작은 안쪽 박스 제거: 여기부터 그냥 레이아웃만 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 28,
                alignItems: "center",
                padding: "10px 8px 4px",
              }}
            >
              {/* 왼쪽: 상자 이미지 */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={chestImg}
                  alt="treasure chest"
                  style={{
                    width: "min(360px, 90%)",
                    height: "auto",
                    filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.55))",
                    userSelect: "none",
                  }}
                  draggable={false}
                />
              </div>

              {/* 오른쪽: 텍스트/버튼 */}
              <div style={{ textAlign: "left" }}>
              <div style={{ opacity: 0.9, marginBottom: 18 }}>
                  상자를 열어 골드를 획득할 수 있다.
                </div>

                <button
                  onClick={onClaim}
                  disabled={claimed}
                  style={{
                    width: "min(420px, 100%)",
                    height: 54,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                    background: claimed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)",
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: claimed ? "not-allowed" : "pointer",
                    transition: "transform 120ms ease, background 120ms ease",
                  }}
                  onMouseDown={(e) => {
                    if (claimed) return;
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)";
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                  }}
                >
                  {claimed ? (                                           /* <--- 여기 수정 */
                    <span>
                      <span style={{ color: "#f6d365", fontWeight: 900 }}> {/* <--- 여기 수정(56G 금색) */}
                        {rewardGold}G
                      </span>
                      <span style={{ color: "#fff", fontWeight: 800 }}>    {/* <--- 여기 수정(획득! 흰색) */}
                        {" "}획득!
                      </span>
                    </span>
                  ) : (
                    "상자 열기"                                           /* <--- 여기 수정 */
                  )}
                </button>
                
                {/* ✅ 안내 문구: 너무 빨리 안 사라지도록 */}
                <div
                  style={{
                    marginTop: 14,
                    height: 22,
                    opacity: toastVisible ? 1 : 0,
                    transition: "opacity 220ms ease",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 700,
                  }}
                >
                  {toast}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}
