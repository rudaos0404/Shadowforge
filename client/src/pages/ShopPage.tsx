// src/pages/ShopPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SHOP_ITEMS, useGameStore } from "../stores/game.store";

type ShopItem = (typeof SHOP_ITEMS)[number];
type CartEntry = { id: ShopItem["id"]; qty: number };

function formatGold(n: number) {
  return `${n}G`;
}

export default function ShopPage() {
  const navigate = useNavigate();

  const stage = useGameStore((s) => s.stage);
  const hp = useGameStore((s) => s.hp);
  const gold = useGameStore((s) => s.gold);
  const potions = useGameStore((s) => s.potions);
  const ownedWeapons = useGameStore((s) => s.ownedWeapons);
  const snapshotBeforeEvent = useGameStore((s) => s.snapshotBeforeEvent);

  const snapshotEvent = useGameStore((s) => s.snapshotEvent);
  const restoreSnapshotIfAny = useGameStore((s) => s.restoreSnapshotIfAny);
  const clearSnapshot = useGameStore((s) => s.clearSnapshot);

  const spendGold = useGameStore((s) => s.spendGold);
  const addPotion = useGameStore((s) => s.addPotion);
  const addWeapon = useGameStore((s) => s.addWeapon);
  const completeSpecialStage = useGameStore((s) => s.completeSpecialStage);

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [notice, setNotice] = useState<string>("");

  // ✅ 상점 들어왔을 때만 스냅샷(구매 안하고 돌아가기 시 카드 유지)
  useEffect(() => {
    if (!snapshotBeforeEvent) snapshotEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartTotal = useMemo(() => {
    const map = new Map<ShopItem["id"], number>();
    for (const c of cart) map.set(c.id, (map.get(c.id) ?? 0) + c.qty);

    let total = 0;
    for (const it of SHOP_ITEMS) {
      const qty = map.get(it.id) ?? 0;
      total += it.cost * qty;
    }
    return total;
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);

  const isWeapon = (item: ShopItem) => item.id !== "POTION";
  const isOwnedWeapon = (item: ShopItem) => {
    if (!isWeapon(item)) return false;
    return ownedWeapons.includes(item.weaponId!);
  };

  const addToCart = (item: ShopItem) => {
    setNotice("");

    // 검: 중복 구매 불가 (이미 보유 or 카트에 이미 있음)
    if (isWeapon(item)) {
      const alreadyOwned = isOwnedWeapon(item);
      const alreadyInCart = cart.some((c) => c.id === item.id);
      if (alreadyOwned || alreadyInCart) return;
      setCart((prev) => [...prev, { id: item.id, qty: 1 }]);
      return;
    }

    // 포션: 중복 가능
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      if (idx === -1) return [...prev, { id: item.id, qty: 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setNotice("");
  };

  const onBack = () => {
    // ✅ 구매 확정 안하면 유지(카드 그대로)
    restoreSnapshotIfAny();
    clearCart(); // ✅ 잔상 방지
    navigate("/turn");
  };

  const onConfirm = () => {
    setNotice("");

    if (cartCount === 0) {
      setNotice("담긴 아이템이 없다.");
      return;
    }
    if (gold < cartTotal) {
      setNotice("금화가 부족하다.");
      return;
    }

    // 실제 구매 반영(골드 차감)
    const ok = spendGold(cartTotal);
    if (!ok) {
      setNotice("금화가 부족하다.");
      return;
    }

    // 구매 반영: 포션/검
    const countMap = new Map<ShopItem["id"], number>();
    for (const c of cart) countMap.set(c.id, (countMap.get(c.id) ?? 0) + c.qty);

    for (const item of SHOP_ITEMS) {
      const qty = countMap.get(item.id) ?? 0;
      if (qty <= 0) continue;

      if (item.id === "POTION") {
        addPotion(qty);
      } else if (item.weaponId) {
        addWeapon(item.weaponId);
      }
    }

    // ✅ 구매 확정 시에만: STAGE +1 & 다음 선택지 새로(카드 변화)
    clearSnapshot();
    completeSpecialStage("SHOP");

    // ✅ 상태 정리(다음 진입 잔상 방지)
    clearCart();

    navigate("/turn");
  };

  return (
    <div className="shopRoot">
      <button className="topRightBtn" onClick={onBack}>
        돌아가기
      </button>

      <div className="panel">
        <div className="left">
          <div className="leftHeader">
            <img className="leftIcon" src="/gadgets/인벤토리.png" alt="shop" />
            <div className="leftTitleWrap">
              <div className="leftTitle">상점</div>
              <div className="leftSub">구매 확정 시 STAGE +1</div>
            </div>
          </div>

          <div className="stats">
            <div className="row">
              <span>HP</span>
              <span>
                {hp} / 100
              </span>
            </div>
            <div className="row">
              <span>Gold</span>
              <span>{formatGold(gold)}</span>
            </div>
            <div className="row">
              <span>보유 포션</span>
              <span>{potions}개</span>
            </div>
            <div className="row">
              <span>보유 무기</span>
              <span>{ownedWeapons.length}개</span>
            </div>
            <div className="row">
              <span>STAGE</span>
              <span>{stage}</span>
            </div>
          </div>

          <div className="cartBox">
            <div className="cartTitle">장바구니</div>
            <div className="cartLine">
              <span>총액</span>
              <span>{formatGold(cartTotal)}</span>
            </div>
            <div className="cartHint">
              {cartCount === 0 ? "담긴 아이템이 없다." : `${cartCount}개 담김`}
            </div>

            {notice ? <div className="notice">{notice}</div> : null}

            <div className="cartActions">
              <button className="btnPrimary" onClick={onConfirm}>
                구매 확정
              </button>
              <button className="btnGhost" onClick={clearCart}>
                비우기
              </button>
            </div>
          </div>
        </div>

        <div className="right scrollArea">
          <div className="grid">
            {SHOP_ITEMS.map((item) => {
              const owned = isOwnedWeapon(item);
              const inCart = cart.some((c) => c.id === item.id);
              const disabled = owned || (isWeapon(item) && inCart);

              return (
                <div key={item.id} className="itemCard">
                  <div className="itemTop">
                    <div className="itemName">{item.title}</div>
                  </div>

                  <div className="itemImgWrap">
                    <img className="itemImg" src={item.img} alt={item.title} />
                  </div>

                  <div className="meta">
                    <div className="metaRow">
                      <span className="metaKey">가격</span>
                      <span className="metaVal">{formatGold(item.cost)}</span>
                    </div>
                    <div className="metaRow">
                      <span className="metaKey">효과</span>
                      <span className="metaVal">{item.effectText}</span>
                    </div>
                  </div>

                  <button
                    className={`addBtn ${disabled ? "disabled" : ""}`}
                    onClick={() => addToCart(item)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    title={owned ? "이미 보유" : inCart ? "이미 담김" : "담기"}
                  >
                    {owned ? "이미 보유" : inCart ? "이미 담김" : "담기"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .shopRoot{
          min-height:100vh;
          width:100%;
          position:relative;
          background-image:url("/turn.png");
          background-size:cover;
          background-position:center;
          background-repeat:no-repeat;
          overflow:hidden;
          padding:28px 28px 24px;
        }
        .shopRoot::before{
          content:"";
          position:absolute;
          inset:0;
          background:rgba(0,0,0,0.55);
          pointer-events:none;
        }

        .topRightBtn{
          position:absolute;
          top:28px;
          right:28px;
          z-index:5;
          padding:10px 18px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.18);
          background:rgba(0,0,0,0.45);
          color:#fff;
          cursor:pointer;
          backdrop-filter: blur(6px);
        }
        .topRightBtn:hover{
          border-color:rgba(255,255,255,0.32);
          background:rgba(0,0,0,0.55);
        }

        .panel{
          position:relative;
          z-index:2;
          width:min(1180px, 100%);
          margin:0 auto;
          border-radius:18px;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(0,0,0,0.35);
          box-shadow:0 20px 60px rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);

          padding:56px 22px 22px;
          display:grid;
          grid-template-columns: 320px 1fr;
          gap:18px;
          height: min(78vh, 760px);
        }

        .left{
          border-radius:16px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(0,0,0,0.35);
          padding:16px;
          display:flex;
          flex-direction:column;
          gap:14px;
          overflow:hidden;
        }

        .leftHeader{
          display:flex;
          align-items:center;
          gap:12px;
        }
        .leftIcon{
          width:44px;
          height:44px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(0,0,0,0.35);
          padding:6px;
          object-fit:contain;
        }
        .leftTitleWrap{ display:flex; flex-direction:column; gap:2px; }
        .leftTitle{ color:#fff; font-size:18px; font-weight:800; letter-spacing:0.5px; }
        .leftSub{ color:rgba(255,255,255,0.70); font-size:12px; }

        .stats{
          border-radius:14px;
          border:1px solid rgba(255,255,255,0.10);
          background:rgba(0,0,0,0.28);
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .row{
          display:flex;
          justify-content:space-between;
          color:rgba(255,255,255,0.86);
          font-size:13px;
          padding:6px 0;
          border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .row:last-child{ border-bottom:none; }

        .cartBox{
          margin-top:auto;
          border-radius:14px;
          border:1px solid rgba(255,255,255,0.10);
          background:rgba(0,0,0,0.28);
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .cartTitle{ color:#fff; font-weight:800; }
        .cartLine{
          display:flex;
          justify-content:space-between;
          color:rgba(255,255,255,0.86);
          font-size:13px;
        }
        .cartHint{
          color:rgba(255,255,255,0.65);
          font-size:12px;
        }
        .notice{
          color:#ffd7d7;
          font-size:12px;
          padding:8px 10px;
          border-radius:10px;
          border:1px solid rgba(255,80,80,0.22);
          background:rgba(120,0,0,0.18);
        }

        .cartActions{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:10px;
          margin-top:4px;
        }
        .btnPrimary, .btnGhost{
          height:44px;
          border-radius:12px;
          cursor:pointer;
          color:#fff;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(0,0,0,0.35);
        }
        .btnPrimary{
          border-color:rgba(255,255,255,0.22);
          background:rgba(255,255,255,0.06);
        }
        .btnPrimary:hover{ background:rgba(255,255,255,0.10); }
        .btnGhost:hover{ background:rgba(255,255,255,0.07); }

        .right{
          border-radius:16px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(0,0,0,0.25);
          padding:14px;
        }

        .scrollArea{
          overflow:auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.18) rgba(0,0,0,0.20);
        }
        .scrollArea::-webkit-scrollbar{ width:10px; }
        .scrollArea::-webkit-scrollbar-track{
          background: rgba(0,0,0,0.25);
          border-radius: 999px;
        }
        .scrollArea::-webkit-scrollbar-thumb{
          background: rgba(255,255,255,0.16);
          border-radius: 999px;
          border: 2px solid rgba(0,0,0,0.25);
        }
        .scrollArea:hover::-webkit-scrollbar-thumb{
          background: rgba(255,255,255,0.26);
        }
        .scrollArea::-webkit-scrollbar-thumb:active{
          background: rgba(255,255,255,0.34);
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap:14px;
        }
        @media (max-width: 980px){
          .panel{ grid-template-columns: 1fr; height:auto; }
          .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px){
          .grid{ grid-template-columns: 1fr; }
        }

        .itemCard{
          border-radius:16px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(0,0,0,0.34);
          padding:14px;
          display:flex;
          flex-direction:column;
          gap:10px;
          min-height: 230px;
        }
        .itemTop{
          display:flex;
          justify-content:space-between;
          align-items:center;
        }
        .itemName{
          color:#fff;
          font-weight:800;
          letter-spacing:0.3px;
        }

        .itemImgWrap{
          height:84px;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .itemImg{
          max-height:84px;
          max-width:100%;
          object-fit:contain;
          image-rendering: auto;
          filter: drop-shadow(0 10px 18px rgba(0,0,0,0.65));
        }

        .meta{
          margin-top:4px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .metaRow{
          display:flex;
          justify-content:space-between;
          color:rgba(255,255,255,0.84);
          font-size:13px;
          border-bottom:1px solid rgba(255,255,255,0.06);
          padding-bottom:6px;
        }
        .metaRow:last-child{ border-bottom:none; padding-bottom:0; }
        .metaKey{ color:rgba(255,255,255,0.60); }
        .metaVal{ font-weight:700; }

        .addBtn{
          margin-top:auto;
          height:42px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.14);
          background:rgba(255,255,255,0.06);
          color:#fff;
          cursor:pointer;
        }
        .addBtn:hover{ background:rgba(255,255,255,0.10); }
        .addBtn.disabled{
          cursor:not-allowed;
          opacity:0.55;
          background:rgba(255,255,255,0.03);
        }
      `}</style>
    </div>
  );
}
