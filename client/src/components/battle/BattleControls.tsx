import { type CSSProperties } from "react";

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

export default function BattleControls({
    canAct,
    luckyCooldown,
    luckyChecked,
    setLuckyChecked,
    onAttack,
    onDefend,
    onHeavy,
    styles
}: Props) {
    return (
        <div style={styles.actionBox}>
            <div style={styles.mainActions}>
                <button style={styles.btnAction} onClick={onAttack} disabled={!canAct}>
                    <div style={styles.btnIcon}>⚔️</div>
                    <div style={styles.btnLabel}>공격</div>
                </button>
                <button style={styles.btnAction} onClick={onDefend} disabled={!canAct}>
                    <div style={styles.btnIcon}>🛡️</div>
                    <div style={styles.btnLabel}>방어</div>
                </button>
                <button
                    style={{ ...styles.btnAction, ...styles.btnHeavyCol }}
                    onClick={onHeavy}
                    disabled={!canAct}
                >
                    <div style={styles.btnIcon}>💥</div>
                    <div style={styles.btnLabel}>강공</div>
                </button>
            </div>

            <label style={styles.luckyToggle}>
                <input
                    type="checkbox"
                    style={styles.luckyCheck}
                    checked={luckyChecked}
                    onChange={(e) => setLuckyChecked(e.target.checked)}
                    disabled={luckyCooldown > 0}
                />
                <span style={styles.luckyText}>🎲 LUCKY ({luckyCooldown})</span>
            </label>
        </div>
    );
}
