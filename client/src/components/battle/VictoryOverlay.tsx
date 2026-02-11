import { type CSSProperties } from "react";

interface Props {
    onPickReward: (kind: 'STR' | 'AGI' | 'POTION') => void;
    styles: Record<string, CSSProperties>;
}

export default function VictoryOverlay({ onPickReward, styles }: Props) {
    return (
        <div style={styles.overlay}>
            <div style={styles.victoryTitle}>VICTORY</div>
            <div style={styles.rewardBox}>
                <div style={styles.rewardHead}>보상을 선택하세요</div>
                <div style={styles.rewardBtns}>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("STR")}>
                        <span style={styles.rewardIcon}>💪</span> 힘 +1
                    </button>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("AGI")}>
                        <span style={styles.rewardIcon}>💨</span> 민첩 +1
                    </button>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("POTION")}>
                        <span style={styles.rewardIcon}>🧪</span> 포션 +1
                    </button>
                </div>
            </div>
        </div>
    );
}
