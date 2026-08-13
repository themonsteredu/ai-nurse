"use client";

import { formatDuration } from "@/lib/timer";

import styles from "./MissionTimer.module.css";

const URGENT_RATIO = 0.25;
const CAUTION_RATIO = 0.5;

type MissionTimerProps = {
  remainingMs: number;
  totalMs: number;
  paused?: boolean;
};

export function MissionTimer({
  remainingMs,
  totalMs,
  paused = false,
}: MissionTimerProps) {
  const ratio = totalMs > 0 ? Math.max(0, remainingMs / totalMs) : 0;
  const state = ratio <= URGENT_RATIO ? "urgent" : ratio <= CAUTION_RATIO ? "caution" : "normal";

  return (
    <div
      className={styles.timer}
      data-state={state}
      data-paused={paused}
      role="timer"
      aria-live="off"
    >
      <div className={styles.readout}>
        <span className={styles.label}>GOLDEN TIME</span>
        <span className={styles.value}>{formatDuration(remainingMs)}</span>
        {paused ? <span className={styles.pausedNote}>PAUSED</span> : null}
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
