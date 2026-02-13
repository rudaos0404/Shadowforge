import { type CSSProperties } from "react";

interface Props {
    onPickReward: (kind: 'STR' | 'AGI' | 'POTION') => void;
    styles: Record<string, CSSProperties>;
}

export default function VictoryOverlay({ onPickReward, styles }: Props) {

    const overlayStyle: CSSProperties = {                 // <--- 여기 수정
        ...styles.overlay,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,                                          // <--- 여기 수정 (간격 조절)
    };

    const victoryTitleStyle: CSSProperties = {            // <--- 여기 수정
        ...styles.victoryTitle,
        color: "#f5c542",                                 // <--- 여기 수정 (노란색 계열)
        textShadow: "0 2px 12px rgba(255, 204, 102, 0.35)",// <--- 여기 수정 (원하면 제거/조절)
    };

    return (
        <div style={overlayStyle}>                        {/* <--- 여기 수정 */}
            <div style={victoryTitleStyle}>VICTORY</div>
            <div style={styles.rewardBox}>
                <div style={styles.rewardHead}>보상을 선택하세요</div>
                <div style={styles.rewardBtns}>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("STR")}>
                        <span style={styles.rewardIcon}>💪</span> 힘 +1 ~ 3
                    </button>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("AGI")}>
                        <span style={styles.rewardIcon}>💨</span> 민첩 +1 ~ 5
                    </button>
                    <button style={styles.rewardBtn} onClick={() => onPickReward("POTION")}>
                        <span style={styles.rewardIcon}>🧪</span> 포션 0 ~ 2
                    </button>
                </div>
            </div>
        </div>
    );
}
