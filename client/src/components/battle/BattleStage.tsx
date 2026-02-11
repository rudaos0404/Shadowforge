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

export default function BattleStage({ bgImg, playerImg, monster, shakePlayer, shakeEnemy, styles }: Props) {
    return (
        <>
            <div style={{ ...styles.bg, backgroundImage: `url("${bgImg}")` }} />
            <div style={styles.vignette} />

            <div style={styles.centerStage}>
                <div style={styles.spriteWrap}>
                    <img
                        src={playerImg}
                        style={{ ...styles.playerSprite, ...(shakePlayer ? styles.shake : {}) }}
                        alt="Player"
                    />
                </div>
                <div style={styles.spriteWrap}>
                    {monster && (
                        <img
                            src={monster.imagePath}
                            style={{ ...styles.enemySprite, ...(shakeEnemy ? styles.shake : {}) }}
                            alt="Enemy"
                        />
                    )}
                </div>
            </div>
        </>
    );
}
