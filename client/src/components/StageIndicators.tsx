import React from "react";

type Props = {
    currentStage: number;
    maxStages?: number;
};

const SkullSVG: React.FC<{ status: "past" | "current" | "future" }> = ({ status }) => {
    const isPast = status === "past";
    const isCurrent = status === "current";

    // Colors & Styles based on status
    const color = isCurrent ? "#ffffff" : isPast ? "#333333" : "#666666";
    const opacity = isCurrent ? 1 : isPast ? 1 : 0.4;
    const glow = isCurrent ? "drop-shadow(0 0 8px rgba(255,255,255,0.8))" : "none";
    const scale = isCurrent ? 1.3 : 1;

    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                opacity,
                filter: glow,
                transform: `scale(${scale})`,
                transition: "all 0.4s ease",
            }}
        >
            {/* Basic Skull Shape */}
            <path
                d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V19C8 20.1 8.9 21 10 21H14C15.1 21 16 20.1 16 19V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z"
                fill={color}
            />
            {/* Eyes & Nose Sockets */}
            <circle cx="9" cy="9.5" r="1.5" fill={isPast ? "#000" : "rgba(0,0,0,0.5)"} />
            <circle cx="15" cy="9.5" r="1.5" fill={isPast ? "#000" : "rgba(0,0,0,0.5)"} />
            <path d="M12 12.5L11 14H13L12 12.5Z" fill={isPast ? "#000" : "rgba(0,0,0,0.5)"} />

            {/* Teeth/Mouth details */}
            <rect x="10" y="17" width="1" height="2" fill={isPast ? "#000" : "rgba(0,0,0,0.3)"} />
            <rect x="11.5" y="17" width="1" height="2" fill={isPast ? "#000" : "rgba(0,0,0,0.3)"} />
            <rect x="13" y="17" width="1" height="2" fill={isPast ? "#000" : "rgba(0,0,0,0.3)"} />

            {/* Conditional: Broken Crack for Past Status */}
            {isPast && (
                <path
                    d="M7 5L10 8L8 10L11 13"
                    stroke="#555555"
                    strokeWidth="1"
                    strokeLinecap="round"
                />
            )}
        </svg>
    );
};

const StageIndicators: React.FC<Props> = ({ currentStage, maxStages = 15 }) => {
    return (
        <div style={styles.indicators}>
            {Array.from({ length: maxStages }).map((_, i) => {
                const idx = i + 1;
                const status = idx < currentStage ? "past" : idx === currentStage ? "current" : "future";

                return (
                    <div key={idx} style={styles.skullWrap} title={`Stage ${idx}`}>
                        <SkullSVG status={status} />
                    </div>
                );
            })}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    indicators: {
        display: "flex",
        gap: 10,
        justifyContent: "center",
        padding: "10px 0",
        maxWidth: 600,
    },
    skullWrap: {
        width: 22,
        height: 22,
        display: "grid",
        placeItems: "center",
    },
};

export default StageIndicators;
