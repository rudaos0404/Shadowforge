import { useEffect, useRef, type CSSProperties } from "react";

interface Props {
    logs: string[];
    styles: Record<string, CSSProperties>;
}

export default function BattleLog({ logs, styles }: Props) {
    const logRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div style={styles.logPanel}>
            <div style={styles.logHeader}>
                <div style={styles.logCircle} />
                BATTLE LOG
            </div>
            <div ref={logRef} style={styles.logBody}>
                {logs.map((l, i) => (
                    <div key={i} style={styles.logLine}>
                        {l}
                    </div>
                ))}
            </div>
        </div>
    );
}
