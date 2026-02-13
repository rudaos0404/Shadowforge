import { type CSSProperties } from "react";
import type { Monster } from "../../shared/api/types";

interface Props {
  bgImg: string;
  playerImg: string;
  monster: Monster | null;
  shakePlayer: boolean;
  shakeEnemy: boolean;
  styles: Record<string, CSSProperties>;
}

const BOSS_BG = "/battle/Bossbg.png";
const BOSS_PLAYER = "/battle/boss vs player.png";
const MONSTER_ASSET_BASE_URL = "/assets/monsters/";

// ✅ 너가 조정해둔 값(유지)
const BOSS_PLAYER_SLOT: CSSProperties = {
  position: "absolute",
  left: "27.5%",
  bottom: "-26%",
  width: "clamp(280px, 28vw, 420px)",
  height: "clamp(220px, 34vh, 480px)",
};

const BOSS_ENEMY_SLOT: CSSProperties = {
  position: "absolute",
  left: "26%",
  bottom: "-2%",
  width: "clamp(340px, 50vw, 520px)",
  height: "clamp(280px, 60vh, 500px)",
};

const perBossEnemySlot: Record<string, Partial<CSSProperties>> = {
  "lord_death.png": { left: "26%", bottom: "-2%" },
  "lord_earth.png": { left: "24%", bottom: "11%", width: "clamp(360px, 52vw, 560px)" },
  "lord_bone.png": { left: "23%", bottom: "10%" },
  "lord_dark.png": { left: "24.5%", bottom: "-6%" },
  "lord_rot.png": { left: "27%", bottom: "3%", height: "clamp(300px, 62vh, 520px)" },
};

export default function BattleStage({
  bgImg,
  playerImg,
  monster,
  shakePlayer,
  shakeEnemy,
  styles,
}: Props) {

  const monsterFile = monster?.imagePath || "";
  const monsterPath = monsterFile ? `${MONSTER_ASSET_BASE_URL}${monsterFile}` : "";
  const isBoss = monsterFile.includes("lord_");

  const bossEnemySlot: CSSProperties = {
    ...BOSS_ENEMY_SLOT,
    ...(perBossEnemySlot[monsterFile] ?? {}),
  };

  // ✅ 보스 스케일(너가 조정한 값 유지)
  const BOSS_BASE_SCALE = 1.1;
  const perBossScale: Record<string, number> = {
    "lord_death.png": 1.0,
    "lord_earth.png": 0.8,
    "lord_bone.png": 0.88,
    "lord_dark.png": 1.17,
    "lord_rot.png": 1.0,
  };
  const bossScale = perBossScale[monsterFile] ?? BOSS_BASE_SCALE;

  // ✅ 일반 몹 높이 보정(유지)
  const NORMAL_H = 210;
  const perMonsterH: Record<string, number> = {
    "mimic.png": 170, // Assuming mimic.png exists or mapping to an English equivalent
    "scarab.png": 180,
    "goblin.png": 150,
    "imp.png": 240,
    "kobold.png": 260,
  };
  const normalTargetH = perMonsterH[monsterFile] ?? NORMAL_H;

  // ✅ 보스는 height 고정 조절은 “일반 스테이지”에서만 의미 있으므로 유지
  const BOSS_BASE_H = 330;
  const perBossH: Record<string, number> = {
    "lord_death.png": 360,
  };
  const bossTargetH = perBossH[monsterFile] ?? BOSS_BASE_H;

  const targetH = isBoss ? bossTargetH : normalTargetH;

  const stageBg = isBoss ? BOSS_BG : bgImg;
  const stagePlayerImg = isBoss ? BOSS_PLAYER : playerImg;

  // ✅ 플레이어 스케일(기존 유지)
  const playerScale = isBoss ? 1.0 : 1.4;

  // ✅ overflow
  const visibleWrap: CSSProperties = { overflow: "visible" };

  // ✅ shake는 inner에만(여기엔 transform 넣지 않음: keyframes transform과 충돌 방지)
  const shaker = (on: boolean): CSSProperties => ({
    display: "block",
    width: "100%",
    height: "100%",
    animation: on ? "hitShake 220ms ease-in-out" : "none",
    willChange: "transform",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  });

  // ✅ filter는 outer로 분리 (eslint any 없음)
  const playerFilter = styles.playerSprite.filter;
  const enemyFilter = styles.enemySprite.filter;

  // ✅ 보스 슬롯에서 정중앙+바닥 정렬용 positioner
  const slotPositioner: CSSProperties = {
    position: "absolute",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
  };

  // ✅ 보스 슬롯 img 기본(필터는 img에 절대 안 줌)
  const slotImgBase: CSSProperties = {
    width: "auto",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transformOrigin: "50% 100%",
    pointerEvents: "none",
    userSelect: "none",
    filter: "none",
    transition: "none",
  };

  // ✅ 일반 스테이지에서 “원래 위치/크기 유지” + filter 제거만 적용
  const playerImgStyle: CSSProperties = {
    ...styles.playerSprite, // ✅ top 등 기존 레이아웃 유지
    filter: "none", // ✅ img엔 filter 금지
    transition: "none",
    transform: `scale(${playerScale})`,
    transformOrigin: "50% 100%",
  };

  const enemyImgStyle: CSSProperties = {
    ...styles.enemySprite, // ✅ 기존 레이아웃 유지
    filter: "none", // ✅ img엔 filter 금지
    transition: "none",
    maxHeight: "none",
    maxWidth: "none",
    height: targetH,
    width: "auto",
  };

  return (
    <>
      <div style={{ ...styles.bg, backgroundImage: `url("${stageBg}")` }} />
      <div style={styles.vignette} />

      {isBoss ? (
        <div style={{ ...styles.centerStage, ...visibleWrap }}>
          {/* PLAYER SLOT */}
          <div style={{ ...BOSS_PLAYER_SLOT, ...visibleWrap }}>
            <div style={{ ...slotPositioner, filter: playerFilter }}>
              <div style={shaker(shakePlayer)}>
                <img
                  src={stagePlayerImg}
                  alt="Player"
                  draggable={false}
                  style={{ ...slotImgBase, transform: `scale(${playerScale})` }}
                />
              </div>
            </div>
          </div>

          {/* BOSS SLOT */}
          <div style={{ ...bossEnemySlot, ...visibleWrap }}>
            <div style={{ ...slotPositioner, filter: enemyFilter }}>
              <div style={shaker(shakeEnemy)}>
                <img
                  src={monsterPath}
                  alt="Enemy"
                  draggable={false}
                  style={{ ...slotImgBase, transform: `scale(${bossScale})` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...styles.centerStage, ...visibleWrap }}>
          {/* PLAYER (기존 구도 유지) */}
          <div style={{ ...styles.spriteWrap, ...visibleWrap }}>
            <div style={{ display: "inline-block", filter: playerFilter }}>
              <div style={shaker(shakePlayer)}>
                <img src={stagePlayerImg} alt="Player" draggable={false} style={playerImgStyle} />
              </div>
            </div>
          </div>

          {/* ENEMY (기존 구도 유지) */}
          <div style={{ ...styles.spriteWrap, ...visibleWrap }}>
            {!!monsterPath && (
              <div style={{ display: "inline-block", filter: enemyFilter }}>
                <div style={shaker(shakeEnemy)}>
                  <img src={monsterPath} alt="Enemy" draggable={false} style={enemyImgStyle} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
