// src/pages/RestPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameFrame from "../components/GameFrame";
import { useGameStore } from "../stores/game.store";

const BG = "/turn.png";
const FIRE = "/gadgets/휴식모닥불.png"; // <--- 여기 수정(추가)

export default function RestPage() {
  const navigate = useNavigate();

  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const confirmRest = useGameStore((s) => s.confirmRest);

  const [healed, setHealed] = useState(false);

  useEffect(() => {
    if (!gameData || !userId) navigate("/");
  }, [gameData, userId, navigate]);

  const onRest = async () => {
    if (healed || !userId) return;
    try {
      await confirmRest(userId);
      setHealed(true);
      setTimeout(() => {
        navigate("/turn");
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const hp = gameData?.hp ?? 0;
  const maxHp = gameData?.maxHp ?? 100;

  return (
    <GameFrame>
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
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
  style={{
    width: "min(980px, 92%)", // <--- 여기 수정
    border: "1px solid rgba(255,255,255,0.35)", // <--- 여기 수정
    borderRadius: 18, // <--- 여기 수정
    background: "rgba(0,0,0,0.35)", // <--- 여기 수정
    padding: 28, // <--- 여기 수정
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)", // <--- 여기 수정
  }}
>
  {/* 상단 중앙 타이틀(보물 텍스트 위치) */}
  <div style={{ textAlign: "center", marginBottom: 18 }}> {/* <--- 여기 수정 */}
    <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 2 }}>
      휴식 {/* <--- 여기 수정 */}
    </div>
    <div style={{ opacity: 0.9, marginTop: 6 }}>
      휴식을 취합니다. {/* <--- 여기 수정 */}
    </div>
  </div>

  {/* 보물처럼 2컬럼 */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 28,
      alignItems: "center",
      padding: "10px 8px 4px",
    }}
  >
    {/* 왼쪽: 모닥불 이미지(보물 상자 위치) */}
    <div style={{ display: "flex", justifyContent: "center" }}>
      <img
        src={FIRE} // <--- 여기 수정(모닥불 이미지)
        alt="campfire"
        style={{
          width: "min(360px, 90%)",
          height: "auto",
          filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.55))",
          userSelect: "none",
        }}
        draggable={false}
      />
    </div>

    {/* 오른쪽: HP 영역(상자 개봉 위치) */}
    <div style={{ textAlign: "left" }}>
      {/* HP 라벨/수치 + HP바 */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            fontSize: 13,
            fontWeight: 800,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span>HP</span> {/* <--- 여기 수정 (HP RECOVERY -> HP) */}
          <span>
            {hp} / {maxHp}
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: 12,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(hp / maxHp) * 100}%`,
              background: "linear-gradient(90deg, #43a047, #66bb6a)",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* 설명(상자를 열어 골드... 위치) */}
      <div style={{ opacity: 0.9, marginBottom: 18 }}>
        휴식을 하여 HP를 회복할 수 있다. {/* <--- 여기 수정 */}
      </div>

      {/* 버튼(획득하고 다음 STAGE 위치) */}
      <button
        onClick={onRest}
        disabled={healed}
        style={{
          width: "min(420px, 100%)", // <--- 여기 수정
          height: 54,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.25)", // <--- 여기 수정
          background: healed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)", // <--- 여기 수정
          color: "white", // <--- 여기 수정
          fontSize: 16,
          fontWeight: 700,
          cursor: healed ? "not-allowed" : "pointer",
          transition: "transform 120ms ease, background 120ms ease",
        }}
        onMouseDown={(e) => {
          if (healed) return;
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.99)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {healed ? "회복 완료" : "체력 회복하기"}
      </button>

      {/* 완료 문구(+56G 위치) */}
      <div
        style={{
          marginTop: 14,
          height: 22,
          opacity: healed ? 1 : 0,
          transition: "opacity 220ms ease",
          color: "rgba(255,255,255,0.9)", // <--- 여기 수정(원하면 색 조절)
          fontWeight: 700,
        }}
      >
        {healed ? "체력이 회복 되었습니다." : ""} {/* <--- 여기 수정 */}
      </div>
    </div>
  </div>
</div>
         </div>
        </div>
    </GameFrame>
  );
}
