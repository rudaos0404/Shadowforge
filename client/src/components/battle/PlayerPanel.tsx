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

export default function PlayerPanel({ hp, maxHp, str, agi, weaponIcon, styles, clamp }: Props) {
    return (
        <div style={styles.playerBox}>
            <div style={styles.playerBarRow}>
                <div style={styles.playerTitle}>PLAYER</div>
                <div style={styles.playerHpText}>
                    {hp} / {maxHp}
                </div>
            </div>
            <div style={styles.playerHpBarOuter}>
                <div
                    style={{ ...styles.playerHpBarInner, width: `${clamp((hp / maxHp) * 100, 0, 100)}%` }}
                />
            </div>

            <div style={styles.playerStatRow}>
                <div style={styles.slotWrap}>
                    <img src={weaponIcon} style={styles.slotImg} alt="Weapon" />
                </div>
                <div style={styles.statMini}>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>STR</span> {str}
                    </div>
                    <div style={styles.statItem}>
                        <span style={styles.statLabel}>AGI</span> {agi}
                    </div>
                </div>
            </div>
        </div>
    );
}
