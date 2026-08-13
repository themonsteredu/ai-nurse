"use client";

/**
 * 미션 제한시간을 보여주는 시계.
 *
 * 무엇을 하나:
 *   남은 시간을 "분:초"로 보여주고, 막대가 줄어듭니다.
 *   시간이 얼마 안 남으면 빨갛게 변합니다.
 *
 * 어떤 데이터를 받나:
 *   - remainingMs : 남은 시간(밀리초). 계산은 lib/timer.ts 가 합니다.
 *   - totalMs     : 전체 제한시간(밀리초)
 *   - paused      : 잠시 멈춘 상태인지 (해설 카드를 읽는 동안 멈춥니다)
 *
 * ⚠️ 제한시간이 몇 분인지는 이 파일이 정하지 않습니다.
 *    data/rules.ts 에 있고, 화면은 받아서 보여주기만 합니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import { formatDuration } from "@/lib/timer";

import styles from "./MissionTimer.module.css";

/** 남은 시간이 이 비율 아래로 떨어지면 "얼마 안 남음"으로 표시합니다. */
const URGENT_RATIO = 0.25;

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
  const urgent = ratio <= URGENT_RATIO;

  return (
    <div
      className={styles.timer}
      data-urgent={urgent}
      data-paused={paused}
      role="timer"
      aria-live="off"
    >
      <div className={styles.readout}>
        <span className={styles.label}>남은 시간</span>
        <span className={styles.value}>{formatDuration(remainingMs)}</span>
      </div>

      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </div>

      {paused ? <span className={styles.pausedNote}>잠시 멈춤</span> : null}
    </div>
  );
}
