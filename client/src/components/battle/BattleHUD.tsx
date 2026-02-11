import { type CSSProperties } from "react";
import StageIndicators from "../StageIndicators";
import type { Monster } from "../../shared/api/types";

interface Props {
    stage: number;
    monster: Monster | null;
    intentText: string;
    styles: Record<string, CSSProperties>;
    clamp: (n: number, min: number, max: number) => number;
}

export default function BattleHUD({ stage, monster, intentText, styles, clamp }: Props) {
    return (
        <div style={styles.enemyTop}>
            <StageIndicators currentStage={stage} />

            <div style={styles.intentRow}>
                <div style={styles.intentPill}>
                    {intentText}
                </div>
            </div>

            <div style={styles.enemyHpBarOuter}>
                <div
                    style={{
                        ...styles.enemyHpBarInner,
                        width: `${clamp(((monster?.hp || 0) / (monster?.maxHp || 1)) * 100, 0, 100)}%`,
                    }}
                />
                <div style={styles.enemyHpBarTextRow}>
                    <div style={styles.monsterName}>{monster?.name || "???"}</div>
                    <div style={styles.monsterHpVal}>
                        {monster?.hp || 0} / {monster?.maxHp || 0}
                    </div>
                </div>
            </div>
        </div>
    );
}
