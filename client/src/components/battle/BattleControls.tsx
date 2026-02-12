// BattleControls.tsx
import { useState, type CSSProperties } from "react";

interface Props {
  canAct: boolean;
  luckyCooldown: number;
  luckyChecked: boolean;
  setLuckyChecked: (val: boolean) => void;
  onAttack: () => void;
  onDefend: () => void;
  onHeavy: () => void;
  styles: Record<string, CSSProperties>;
}

const IMG_ATTACK = "/battle/Attack_box.png";
const IMG_DEFENSE = "/battle/Defense_box.png";
const IMG_POWER = "/battle/Power_box.png";
const IMG_LUCKY = "/battle/Lucky_box.png";

type Key = "ATTACK" | "DEFENSE" | "POWER" | "LUCKY";

function CheckMark({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BattleControls({
  canAct,
  luckyCooldown,
  luckyChecked,
  setLuckyChecked,
  onAttack,
  onDefend,
  onHeavy,
  styles,
}: Props) {
  const [hovered, setHovered] = useState<Key | null>(null);
  const [pressed, setPressed] = useState<Key | null>(null);

  const luckyDisabled = luckyCooldown > 0;

  const BTN_W = 140;
  const BTN_H = 85;

  // ✅ (요청) 방어-강공 간격 줄이기: 값만 줄이면 강공 우측 고정 + 나머지 오른쪽으로 당겨짐
  // 기존 6 → 3 (원하면 2까지 가능)
  const GAP_PX = 0;

  // ✅ 3버튼 그룹 폭(오른쪽 정렬 기준)
  const GROUP_W = BTN_W * 3 + GAP_PX * 2;

  // ✅ 버튼 내부 표시 영역(통일)
  const ACTION_IMG_MAX_W = BTN_W;
  const ACTION_IMG_MAX_H = 78;

  // ✅ (요청) 공격을 방어/강공과 동일하게: 세 버튼 모두 같은 VISUAL_SCALE 적용
  const ACTION_VISUAL_SCALE = 0.82;

  // ✅ Lucky 규격
  const LUCKY_W = 160;
  const LUCKY_H = 40;

  const fx = (key: Key): CSSProperties => {
    const isHover = hovered === key;
    const isDown = pressed === key;
    if (isDown) return { transform: "translateY(1px) scale(0.99)", filter: "brightness(0.98)" };
    if (isHover) return { transform: "translateY(-2px) scale(1.02)", filter: "brightness(1.08)" };
    return {};
  };

  const bind = (key: Key) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => {
      setHovered(null);
      setPressed(null);
    },
    onMouseDown: () => setPressed(key),
    onMouseUp: () => setPressed(null),
  });

  const imgBtnBase: CSSProperties = {
    padding: 0,
    border: 0,
    outline: "none",
    background: "transparent",
    display: "grid",
    placeItems: "center",
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    overflow: "hidden",
  };

  const actionImg: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  };

  // ✅ 내부 표시 영역 + 시각 스케일 통일
  const wrapBox = (scale = 1): CSSProperties => ({
    width: ACTION_IMG_MAX_W,
    height: ACTION_IMG_MAX_H,
    display: "grid",
    placeItems: "center",
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: "50% 50%",
  });

  return (
    <div style={styles.actionBox}>
      {/* === 공격/방어/강공 === */}
      <div
        style={{
          ...styles.mainActions,
          display: "flex",
          gap: GAP_PX,
          width: GROUP_W,
          justifyContent: "flex-end",
        }}
      >
        {/* ATTACK */}
        <button
          type="button"
          onClick={onAttack}
          disabled={!canAct}
          style={{
            ...styles.btnAction,
            width: BTN_W,
            height: BTN_H,
            ...imgBtnBase,
            opacity: !canAct ? 0.45 : 1,
            cursor: !canAct ? "not-allowed" : "pointer",
            transition: "transform 120ms ease, filter 120ms ease, opacity 120ms ease",
            ...fx("ATTACK"),
          }}
          aria-label="공격"
          {...bind("ATTACK")}
        >
          <div style={wrapBox(ACTION_VISUAL_SCALE)}>
            <img src={IMG_ATTACK} alt="" draggable={false} style={actionImg} />
          </div>
        </button>

        {/* DEFENSE */}
        <button
          type="button"
          onClick={onDefend}
          disabled={!canAct}
          style={{
            ...styles.btnAction,
            width: BTN_W,
            height: BTN_H,
            ...imgBtnBase,
            opacity: !canAct ? 0.45 : 1,
            cursor: !canAct ? "not-allowed" : "pointer",
            transition: "transform 120ms ease, filter 120ms ease, opacity 120ms ease",
            ...fx("DEFENSE"),
          }}
          aria-label="방어"
          {...bind("DEFENSE")}
        >
          <div style={wrapBox(ACTION_VISUAL_SCALE)}>
            <img src={IMG_DEFENSE} alt="" draggable={false} style={actionImg} />
          </div>
        </button>

        {/* POWER */}
        <button
          type="button"
          onClick={onHeavy}
          disabled={!canAct}
          style={{
            ...styles.btnAction,
            width: BTN_W,
            height: BTN_H,
            ...imgBtnBase,
            opacity: !canAct ? 0.45 : 1,
            cursor: !canAct ? "not-allowed" : "pointer",
            transition: "transform 120ms ease, filter 120ms ease, opacity 120ms ease",
            ...fx("POWER"),
          }}
          aria-label="강공"
          {...bind("POWER")}
        >
          <div style={wrapBox(ACTION_VISUAL_SCALE)}>
            <img src={IMG_POWER} alt="" draggable={false} style={actionImg} />
          </div>
        </button>
      </div>

      {/* === LUCKY === */}
      {/* ✅ (요청) 노란 박스 영역까지 클릭되는 문제 해결:
          - 바깥은 정렬용 div (클릭 없음)
          - 실제 클릭은 카드 크기(LUCKY_W) 버튼만 */}
      <div
        style={{
          width: GROUP_W,
          height: LUCKY_H,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          disabled={luckyDisabled}
          onClick={() => setLuckyChecked(!luckyChecked)}
          style={{
            width: LUCKY_W, // ✅ 카드 영역만 클릭
            height: LUCKY_H,
            padding: 0,
            border: 0,
            background: "transparent",
            boxShadow: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            position: "relative",
            display: "block",
            opacity: luckyDisabled ? 0.45 : 1,
            cursor: luckyDisabled ? "not-allowed" : "pointer",
            transition: "transform 120ms ease, filter 120ms ease, opacity 120ms ease",
            ...fx("LUCKY"),
          }}
          aria-label={`럭키 토글 ${luckyChecked ? "켜짐" : "꺼짐"}`}
          {...bind("LUCKY")}
        >
          <img
            src={IMG_LUCKY}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          {/* 체크박스 */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: "48%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
              borderRadius: 3,
              boxShadow: luckyChecked ? "0 0 10px rgba(0,255,120,0.9)" : "none",
            }}
          >
            {luckyChecked && <CheckMark size={12} />}
          </div>

          {/* 괄호 안 숫자 */}
          <div
            style={{
              position: "absolute",
              right: 32,
              top: "43%",
              transform: "translateY(-50%)",
              color: "rgba(205, 165, 78, 0.95)",
              fontWeight: 900,
              fontSize: 13,
              textShadow: "0 2px 6px rgba(0,0,0,0.9)",
              pointerEvents: "none",
            }}
          >
            {luckyCooldown}
          </div>
        </button>
      </div>
    </div>
  );
}
