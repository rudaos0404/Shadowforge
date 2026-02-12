import { type CSSProperties } from "react";

interface Props {
  hp: number;
  maxHp: number;
  str: number;
  agi: number;
  weaponIcon: string;
  styles: Record<string, CSSProperties>;
  clamp: (n: number, min: number, max: number) => number;
}

const IMG_PLAYER_BOX = "/battle/Player_box.png";
const IMG_SWORD_BOX = "/battle/sword_box.png";
const IMG_POTION_BOX = "/battle/potion_box.png";

/**
 * =========================
 * CTRL+F: PLAYER_PANEL_TUNING
 * =========================
 * 아래 숫자만 바꾸면 “예시 배치”로 미세조정 가능
 */

// ✅ Player_box.png 원본 비율 (969 x 385)
const PLAYER_BOX_RATIO = 969 / 385;

// (1) HP 텍스트 위치
const HP_TEXT_TOP_PCT = 0.145;
const HP_TEXT_RIGHT_PCT = 0.18;

// (2) HP 바 위치/크기
const HP_BAR_TOP_PCT = 0.33;
const HP_BAR_LEFT_PCT = 0.14;
const HP_BAR_WIDTH_PCT = 0.71;
const HP_BAR_HEIGHT_PX = 12;

// (3) 슬롯 2개 위치/크기
const SLOT_TOP_PCT = 0.46;
const SLOT_LEFT_PCT = 0.13;
const SLOT_GAP_PCT = 0.01;
const SLOT_SIZE_H_PCT = 0.38; // 카드 높이 대비 슬롯 크기

// (4) 스탯 위치
const STAT_TOP_PCT = 0.5;
const STAT_RIGHT_PCT = 0.21;

// (5) 무기 아이콘 크기(슬롯 내부)
const WEAPON_ICON_PCT = 1;

export default function PlayerPanel({ hp, maxHp, str, agi, weaponIcon, styles, clamp }: Props) {
  const hpPct = clamp((hp / maxHp) * 100, 0, 100);

  // ✅ BattlePage.tsx의 styles.playerBox.width(=360)를 그대로 따름
  const wFromStyle =
    typeof styles.playerBox?.width === "number" ? (styles.playerBox.width as number) : undefined;

  const CARD_W = wFromStyle ?? 360;
  const CARD_H = Math.round(CARD_W / PLAYER_BOX_RATIO);

  const textTone = "rgba(243, 210, 140, 0.95)";
  const textShadow = "0 2px 6px rgba(0,0,0,0.85)";

  // ✅ 흰 박스(styles.playerBox) 안에서만 그리기
  const baseCard: CSSProperties = {
    ...styles.playerBox,
    width: CARD_W,
    height: CARD_H,
    position: "relative",
    background: "transparent",
    border: 0,
    padding: 0,
    margin: 0,
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    borderRadius: 0,
    overflow: "hidden", // ✅ 흰 박스 밖으로 절대 안 나감
    pointerEvents: styles.playerBox?.pointerEvents ?? "auto",
  };

  // ---------- HP 텍스트 ----------
  const hpTextStyle: CSSProperties = {
    position: "absolute",
    top: `${Math.round(HP_TEXT_TOP_PCT * 1000) / 10}%`,
    right: `${Math.round(HP_TEXT_RIGHT_PCT * 1000) / 10}%`,
    fontWeight: 900,
    fontSize: 16,
    color: textTone,
    textShadow,
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
    zIndex: 2,
  };

  // ---------- HP 바 ----------
  const hpBarOuter: CSSProperties = {
    position: "absolute",
    top: `${Math.round(HP_BAR_TOP_PCT * 1000) / 10}%`,
    left: `${Math.round(HP_BAR_LEFT_PCT * 1000) / 10}%`,
    width: `${Math.round(HP_BAR_WIDTH_PCT * 1000) / 10}%`,
    height: HP_BAR_HEIGHT_PX,
    background: "rgba(0,0,0,0.35)",
    borderRadius: 2,
    overflow: "hidden",
    boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.55)",
    pointerEvents: "none",
    zIndex: 2,
  };

  const hpBarInner: CSSProperties = {
    height: "100%",
    width: `${hpPct}%`,
    background: "linear-gradient(90deg, #2c743fff 0%, #30af49ff 100%)",
    boxShadow: "0 0 10px rgba(90, 255, 140, 0.25)",
    transition: "width 0.25s ease",
  };

  // ---------- 슬롯 ----------
  const SLOT = Math.round(CARD_H * SLOT_SIZE_H_PCT);
  const SLOT_GAP = Math.round(CARD_W * SLOT_GAP_PCT);

  const slotBtn: CSSProperties = {
    width: SLOT,
    height: SLOT,
    padding: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    transition: "transform 120ms ease, filter 120ms ease",
    pointerEvents: "auto",
  };

  const slotFrame: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
  };

  const weaponImg: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: `${Math.round(WEAPON_ICON_PCT * 100)}%`,
    height: `${Math.round(WEAPON_ICON_PCT * 100)}%`,
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
  };

  const hoverOn = (el: HTMLButtonElement) => {
    el.style.transform = "translateY(-1px)";
    el.style.filter = "brightness(1.08)";
  };
  const hoverOff = (el: HTMLButtonElement) => {
    el.style.transform = "none";
    el.style.filter = "none";
  };

  // ---------- 스탯 ----------
  const statWrap: CSSProperties = {
    position: "absolute",
    top: `${Math.round(STAT_TOP_PCT * 1000) / 10}%`,
    right: `${Math.round(STAT_RIGHT_PCT * 1000) / 10}%`,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: textTone,
    textShadow,
    fontWeight: 900,
    fontSize: 16,
    userSelect: "none",
    pointerEvents: "none",
    lineHeight: 1.1,
    textAlign: "right",
    zIndex: 2,
  };

  const statLine: CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" };
  const statLabel: CSSProperties = { opacity: 0.9, fontWeight: 900, fontSize: 14 };

  return (
    <div style={baseCard}>
      {/* ✅ 프레임 PNG는 카드 영역을 딱 채우기 (그림 자체가 비율대로 렌더되도록 카드 높이를 맞췄음) */}
      <img
        src={IMG_PLAYER_BOX}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
          filter: "none", // ✅ shadow 제거(흰 박스 밖으로 튀는 원인)
          zIndex: 1,
        }}
      />

      {/* HP 텍스트 */}
      <div style={hpTextStyle}>
        {hp} / {maxHp}
      </div>

      {/* HP 바 */}
      <div style={hpBarOuter}>
        <div style={hpBarInner} />
      </div>

      {/* 슬롯 2개 */}
      <div
        style={{
          position: "absolute",
          top: `${Math.round(SLOT_TOP_PCT * 1000) / 10}%`,
          left: `${Math.round(SLOT_LEFT_PCT * 1000) / 10}%`,
          display: "flex",
          gap: SLOT_GAP,
          zIndex: 2,
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          aria-label="무기"
          onClick={() => {}}
          style={slotBtn}
          onMouseEnter={(e) => hoverOn(e.currentTarget)}
          onMouseLeave={(e) => hoverOff(e.currentTarget)}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img src={IMG_SWORD_BOX} alt="" draggable={false} style={slotFrame} />
            <img src={weaponIcon} alt="" draggable={false} style={weaponImg} />
          </div>
        </button>

        <button
          type="button"
          aria-label="포션"
          onClick={() => {}}
          style={slotBtn}
          onMouseEnter={(e) => hoverOn(e.currentTarget)}
          onMouseLeave={(e) => hoverOff(e.currentTarget)}
        >
          <img src={IMG_POTION_BOX} alt="" draggable={false} style={slotFrame} />
        </button>
      </div>

      {/* STR / AGI */}
      <div style={statWrap}>
        <div style={statLine}>
          <span style={statLabel}>STR</span>
          <span>{str}</span>
        </div>
        <div style={statLine}>
          <span style={statLabel}>AGI</span>
          <span>{agi}</span>
        </div>
      </div>
    </div>
  );
}
