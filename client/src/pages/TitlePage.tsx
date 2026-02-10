// client/src/pages/TitlePage.tsx
import { useNavigate } from "react-router-dom";

export default function TitlePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      {/* 프레임(16:9 고정) */}
      <div className="relative w-[min(1200px,92vw)] aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
        {/* 배경 */}
        <img
          src="/title_screen.png"
          alt="title"
          className="absolute inset-0 w-full h-full object-cover select-none"
          draggable={false}
        />

        {/* GAMESTART 이미지 버튼 (hover/active/ focus 효과) */}
        <button
          type="button"
          onClick={() => navigate("/lobby")}
          aria-label="GAMESTART"
          className="
            absolute left-1/2 -translate-x-1/2 bottom-[1%]
            outline-none
            rounded-2xl
            px-3 py-2
            transition-transform duration-150 ease-out
            hover:-translate-y-1 hover:scale-[1.02]
            active:translate-y-[2px] active:scale-[0.98]
            focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-black
          "
        >
          <img
            src="/gadgets/gamestart.png"
            alt="gamestart"
            draggable={false}
            className="
              w-[min(420px,58vw)] h-auto select-none
              transition-[filter,transform] duration-150 ease-out
            "
            style={{
              filter:
                "drop-shadow(0 10px 18px rgba(0,0,0,0.70))",
            }}
          />
        </button>

        {/* 비네팅: 클릭 방해 X */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.65)" }}
        />
      </div>
    </div>
  );
}
