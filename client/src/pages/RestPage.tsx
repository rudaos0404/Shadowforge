import { useNavigate } from "react-router-dom";
import GameFrame from "../components/GameFrame";
import { useGameStore } from "../stores/game.store";

export default function RestPage() {
  const navigate = useNavigate();

  const hp = useGameStore((s) => s.hp);
  const restHeal = useGameStore((s) => s.restHeal);
  const completeBattleStage = useGameStore((s) => s.completeBattleStage); // 휴식은 “행동”이므로 stage+1을 원하면 이걸 쓰면 됨
  const restoreSnapshotIfAny = useGameStore((s) => s.restoreSnapshotIfAny);
  const clearSnapshot = useGameStore((s) => s.clearSnapshot);

  const back = () => {
    restoreSnapshotIfAny();
    navigate("/turn");
  };

  const doRest = () => {
    restHeal();
    clearSnapshot();
    // 휴식도 한 턴 사용(=스테이지 진행)으로 처리하고 싶으면 아래를 유지
    completeBattleStage();
    navigate("/turn");
  };

  return (
    <GameFrame bg="/turn.png">
      <div className="h-full w-full relative p-12">
        <button
          onClick={back}
          className="absolute top-6 right-6 px-5 py-2 rounded-xl border border-white/15 bg-black/45 text-white hover:bg-black/60"
        >
          돌아가기
        </button>

        <div className="text-white text-6xl font-extrabold">휴식</div>
        <div className="text-white/70 mt-3">모닥불을 피우고 잠시 숨을 고른다.</div>

        <div className="mt-10 rounded-2xl border border-white/15 bg-black/40 p-10 flex items-center gap-10">
          <div className="w-[420px] flex items-center justify-center">
            <img src="/gadgets/휴식모닥불.png" alt="rest" className="w-[320px] h-[240px] object-contain" />
          </div>

          <div className="flex-1">
            <div className="text-white text-4xl font-extrabold">HP 회복</div>
            <div className="text-white/70 mt-2">HP +30 (최대 100)</div>

            <div className="mt-6 text-white/80">
              현재 HP: <span className="font-bold">{hp}</span> / 100
            </div>

            <div className="mt-8">
              <button
                onClick={doRest}
                className="h-12 px-7 rounded-xl border border-white/15 bg-black/45 text-white hover:bg-black/65"
              >
                휴식하고 다음 STAGE
              </button>
            </div>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}
