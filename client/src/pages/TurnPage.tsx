// src/pages/TurnPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore, WEAPONS } from "../stores/game.store";
import type { TurnOption, TurnOptionType } from "../shared/api/types";
import StageIndicators from "../components/StageIndicators";

// Helper to map server option strings to UI cards
const OPTION_DETAILS: Record<string, Omit<TurnOption, 'type' | 'route'>> = {
  BATTLE: { title: "전투", desc: "몬스터와 전투를 치릅니다.", tag: "전투" },
  SHOP: { title: "상점", desc: "장비를 구매하거나 정비합니다.", tag: "상점" },
  TREASURE: { title: "보물", desc: "운이 좋다면 보상을 얻습니다.", tag: "보물" },
  REST: { title: "휴식", desc: "체력을 회복합니다.", tag: "회복" },
};

function mapOptions(serverOptions: string[] = []): TurnOption[] {
  return serverOptions.map((opt) => {
    const details = OPTION_DETAILS[opt] || { title: opt, desc: "알 수 없는 행동", tag: "?" };
    return {
      type: opt as TurnOptionType,
      route: opt === 'BATTLE' ? '/battle' : opt === 'SHOP' ? '/shop' : opt === 'TREASURE' ? '/treasure' : '/rest',
      ...details
    } as TurnOption;
  });
}

export default function TurnPage() {
  const navigate = useNavigate();

  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const selectOption = useGameStore((s) => s.selectOption);

  // Mapped Data
  const stage = gameData?.currentTurn ?? 1;
  const gold = gameData?.gold ?? 0;
  const potions = gameData?.potions ?? 0;
  const gameOptions = useMemo(() => mapOptions(gameData?.options), [gameData?.options]);
  const ownedWeapons = gameData?.inventory ?? [];
  const equippedWeaponId = gameData?.equippedWeapon ?? null;
  const equipWeapon = useGameStore((s) => s.equipWeapon);

  const [invOpen, setInvOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!gameData || !userId) {
      navigate("/");
      return;
    }

    // ✨ 전투 상태면 즉시 이동
    if (gameData.state === 'BATTLE' || gameData.state === 'BOSS_BATTLE') {
      navigate('/battle');
    }
  }, [gameData, userId, navigate]);

  const onPick = async (opt: TurnOption) => {
    if (!userId) return;
    try {
      await selectOption(userId, opt.type);
      navigate(opt.route || "/turn");
    } catch (e) {
      alert("선택 처리 중 오류 발생");
      console.error(e);
    }
  };

  const typeIcon = useMemo(() => {
    return {
      BATTLE: "/gadgets/노말검.png",
      SHOP: "/gadgets/포션.png",
      TREASURE: "/gadgets/보물상자1.png",
      REST: "/gadgets/휴식모닥불.png",
    } as const;
  }, []);

  const typeTint = useMemo(() => {
    return {
      BATTLE: "rgba(255,255,255,0.06)",
      SHOP: "rgba(255,255,255,0.06)",
      TREASURE: "rgba(255,255,255,0.06)",
      REST: "rgba(255,255,255,0.06)",
    } as const;
  }, []);

  if (!gameData) return <div>Loading...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.frame}>
        <div style={styles.bg} />
        <div style={styles.vignette} />

        <div style={styles.topLeft}>
          <button
            type="button"
            style={styles.iconBtn}
            title="인벤토리"
            onClick={() => setInvOpen(true)}
          >
            <img src="/gadgets/인벤토리.png" alt="inv" style={styles.iconImg} draggable={false} />
          </button>

          <div style={styles.goldBox}>
            <img src="/gadgets/골드1.png" alt="gold" style={styles.goldImg} draggable={false} />
            <span style={styles.goldText}>{gold}</span>
          </div>
        </div>

        <button style={styles.topRightBtn} onClick={() => navigate("/lobby")}>
          로비
        </button>

        {/* 중앙 상단: STAGE Area */}
        <div style={styles.stageArea}>
          <StageIndicators currentStage={stage} />
        </div>

        <div style={styles.cards}>
          {gameOptions.map((opt, idx) => {
            const iconSrc = typeIcon[opt.type as keyof typeof typeIcon] ?? "/gadgets/인벤토리.png";
            const tint = typeTint[opt.type as keyof typeof typeTint] ?? "rgba(255,255,255,0.06)";
            const isHover = hoverIdx === idx;
            const isPressed = pressedIdx === idx;

            const cardStyle: CSSProperties = {
              ...styles.card,
              background: `linear-gradient(180deg, ${tint} 0%, rgba(0,0,0,0.35) 38%, rgba(0,0,0,0.58) 100%)`,
              ...(isHover ? styles.cardHover : null),
              ...(isPressed ? styles.cardPressed : null),
            };

            return (
              <button
                key={`${opt.type}-${idx}`}
                style={cardStyle}
                onClick={() => onPick(opt)}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => { setHoverIdx(null); setPressedIdx(null); }}
                onMouseDown={() => setPressedIdx(idx)}
                onMouseUp={() => setPressedIdx(null)}
                onBlur={() => setPressedIdx(null)}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardIconWrap}>
                    <img src={iconSrc} alt="icon" style={styles.cardIcon} draggable={false} />
                  </div>
                  <div style={styles.cardTitleBlock}>
                    <div style={styles.cardTitleRow}>
                      <div style={styles.cardTitle}>{opt.title}</div>
                      <div style={styles.cardTag}>{opt.tag}</div>
                    </div>
                    <div style={styles.cardDesc}>{opt.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {invOpen && (
          <div style={styles.modalWrap}>
            <div style={styles.modalDim} onClick={() => setInvOpen(false)} />
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <div style={styles.modalTitle}>인벤토리</div>
                <button style={styles.modalClose} onClick={() => setInvOpen(false)}>닫기</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.invSection}>
                  <div style={styles.invSectionTitle}>소모품</div>
                  <div style={styles.invRow}>
                    <div style={styles.invItem}>
                      <img src="/gadgets/포션.png" alt="포션" style={styles.invIcon} draggable={false} />
                      <div style={styles.invInfo}>
                        <div style={styles.invName}>포션</div>
                        <div style={styles.invMeta}>보유: {potions}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={styles.invSection}>
                  <div style={styles.invSectionTitle}>무기</div>
                  {ownedWeapons.length === 0 ? (
                    <div style={styles.invEmpty}>보유 중인 무기가 없습니다.</div>
                  ) : (
                    <div style={styles.invGrid}>
                      {ownedWeapons.map((wid) => {
                        const w = WEAPONS[wid];
                        if (!w) return null;
                        const isEquipped = equippedWeaponId === wid;
                        return (
                          <button
                            key={wid}
                            type="button"
                            style={{ ...styles.weaponCard, ...(isEquipped ? styles.weaponCardEquipped : null) }}
                            onClick={() => userId && equipWeapon(userId, isEquipped ? 'NO_SWORD' : wid)}
                          >
                            <img src={w.img} alt={w.name} style={styles.weaponIcon} draggable={false} />
                            <div style={styles.weaponInfo}>
                              <div style={styles.weaponName}>{w.name} {isEquipped && <span style={styles.badge}>장착중</span>}</div>
                              <div style={styles.weaponMeta}>ATK +{w.atk}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { width: "100%", height: "100vh", display: "grid", placeItems: "center", background: "#000" },
  frame: { width: "92vw", maxWidth: 1280, aspectRatio: "16 / 9", position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 10px 60px rgba(0,0,0,0.8)" },
  bg: { position: "absolute", inset: 0, backgroundImage: 'url("/turn.png")', backgroundSize: "cover", backgroundPosition: "center", filter: "contrast(1.05) saturate(0.95)" },
  vignette: { position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.40) 100%)" },
  topLeft: { position: "absolute", top: 18, left: 18, display: "flex", gap: 10, alignItems: "center", zIndex: 5 },
  iconBtn: { width: 50, height: 50, borderRadius: 10, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", display: "grid", placeItems: "center", cursor: "pointer", padding: 0, zIndex: 6 },
  iconImg: { width: 40, height: 40, objectFit: "contain", opacity: 0.95 },
  goldBox: { height: 50, padding: "0 14px", borderRadius: 10, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", gap: 10 },
  goldImg: { width: 40, height: 40, objectFit: "contain" },
  goldText: { color: "#fff", fontWeight: 800, letterSpacing: 0.5 },
  topRightBtn: { position: "absolute", top: 18, right: 18, zIndex: 5, padding: "10px 16px", borderRadius: 12, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer" },
  stageArea: { position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  stageTitle: { color: "#fff", fontWeight: 900, fontSize: 44, letterSpacing: 2, textShadow: "0 2px 18px rgba(0,0,0,0.80)" },
  cards: { position: "absolute", left: 36, right: 36, bottom: 34, zIndex: 5, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 },
  card: { height: 176, borderRadius: 18, padding: 18, textAlign: "left", color: "#fff", cursor: "pointer", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 18px 55px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.04)", transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, filter 120ms ease", outline: "none" },
  cardHover: { transform: "translateY(-4px)", border: "1px solid rgba(255,255,255,0.45)", boxShadow: "0 26px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.05)", filter: "brightness(1.06)" },
  cardPressed: { transform: "translateY(-1px) scale(0.995)", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 14px 45px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)", filter: "brightness(0.96)" },
  cardTop: { display: "grid", gridTemplateColumns: "72px 1fr", gap: 14, alignItems: "center" },
  cardIconWrap: { width: 72, height: 72, borderRadius: 16, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)", display: "grid", placeItems: "center", overflow: "hidden" },
  cardIcon: { width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.75))" },
  cardTitleBlock: { minWidth: 0 },
  cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 30, fontWeight: 900, letterSpacing: 0.3, textShadow: "0 2px 10px rgba(0,0,0,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardTag: { fontSize: 11, padding: "5px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.78)", background: "rgba(0,0,0,0.30)", flexShrink: 0 },
  cardDesc: { color: "rgba(255,255,255,0.82)", lineHeight: 1.35, textShadow: "0 2px 10px rgba(0,0,0,0.45)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  modalWrap: { position: "absolute", inset: 0, zIndex: 50, display: "grid", placeItems: "center" },
  modalDim: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.62)" },
  modal: { position: "relative", width: 760, maxWidth: "92%", borderRadius: 18, background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 20px 80px rgba(0,0,0,0.75)", padding: 18, backdropFilter: "blur(10px)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: 900 },
  modalClose: { padding: "8px 14px", borderRadius: 12, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer" },
  modalBody: { padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.35)", minHeight: 200, overflow: "auto", maxHeight: 420 },
  invSection: { display: "grid", gap: 10, marginBottom: 14 },
  invSectionTitle: { color: "rgba(255,255,255,0.9)", fontWeight: 900, fontSize: 14, letterSpacing: 0.3 },
  invRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  invItem: { display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", minWidth: 240 },
  invIcon: { width: 44, height: 44, objectFit: "contain" },
  invInfo: { minWidth: 0 },
  invName: { color: "#fff", fontWeight: 900, fontSize: 16 },
  invMeta: { marginTop: 4, color: "rgba(255,255,255,0.72)", fontSize: 12 },
  invEmpty: { color: "rgba(255,255,255,0.70)", padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.20)" },
  invGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  weaponCard: { display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: "#fff", textAlign: "left" },
  weaponCardEquipped: { border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)" },
  weaponIcon: { width: 52, height: 52, objectFit: "contain" },
  weaponInfo: { minWidth: 0 },
  weaponName: { fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", gap: 8 },
  weaponMeta: { marginTop: 4, color: "rgba(255,255,255,0.72)", fontSize: 12 },
  badge: { fontSize: 11, padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.25)" },
};
