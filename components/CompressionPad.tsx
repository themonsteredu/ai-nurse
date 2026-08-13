"use client";

/**
 * 가슴압박 리듬 연습 — 미션 2의 핵심 과제.
 *
 * 무엇을 하나:
 *   원이 커졌다 작아지는 리듬에 맞춰 학생이 화면을 탭합니다.
 *   원이 가장 작아지는 순간이 누를 때입니다.
 *
 * 화면 순서:
 *   ① 준비 (3-2-1 카운트다운)
 *   ② 압박 (제한시간 동안 탭)
 *   → 끝나면 누른 시각 목록을 부모에게 넘깁니다. 채점은 부모가 lib/cpr.ts 로 합니다.
 *
 * 난이도 차이 (전부 lib/cpr.ts 가 판단합니다):
 *   초등 — 60초, 가이드 원이 끝까지 보임
 *   중등 — 120초, 20초가 지나면 가이드 원이 사라져 스스로 리듬 유지
 *
 * 기획서 요구사항:
 *   너무 느리면 화면이 어두워지고, 너무 빠르면 "깊이가 얕아요" 경고가 뜹니다.
 *
 * ⚠️ 성능 주의 (지우지 마세요)
 *    교실에서 태블릿 30대가 동시에 돕니다.
 *    원을 움직일 때 React 를 다시 그리면 느려지므로,
 *    원은 ref 로 직접 움직이고 React 상태는 1초에 다섯 번만 갱신합니다.
 *
 * 감정 톤: 집중. 손끝에 힘이 들어가는 리듬감.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    ⚠️ 다만 위의 성능 구조(ref 로 원 움직이기)는 유지해주세요.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Difficulty } from "@/data/types";
import {
  compressionDurationMs,
  currentBpm,
  guideCircleScale,
  isGuideVisible,
  rhythmZone,
} from "@/lib/cpr";
import { formatDuration } from "@/lib/timer";

import { BpmMeter } from "./BpmMeter";
import styles from "./CompressionPad.module.css";

/** 원이 가장 작을 때와 가장 클 때의 크기 비율. 보기 좋으라고 있는 값입니다. */
const CIRCLE_MIN_SCALE = 0.4;
const CIRCLE_MAX_SCALE = 1;

/** React 상태(숫자 표시)를 얼마나 자주 갱신할지. 1초에 다섯 번. */
const STATE_REFRESH_MS = 200;

/** 시작 전 카운트다운 (초) */
const READY_COUNT = 3;

type CompressionPadProps = {
  difficulty: Difficulty;
  /** 시간이 다 되면 누른 시각 목록을 넘겨줍니다. */
  onFinish: (tapTimestamps: number[]) => void;
};

export function CompressionPad({ difficulty, onFinish }: CompressionPadProps) {
  const durationMs = compressionDurationMs(difficulty);

  const [phase, setPhase] = useState<"ready" | "running">("ready");
  const [countdown, setCountdown] = useState(READY_COUNT);
  const [displayBpm, setDisplayBpm] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [guideVisible, setGuideVisible] = useState(true);
  const [tapCount, setTapCount] = useState(0);

  const circleRef = useRef<HTMLDivElement>(null);
  const tapsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);

  /* ---------------- ① 준비 카운트다운 ---------------- */

  useEffect(() => {
    if (phase !== "ready") return;

    if (countdown <= 0) {
      startedAtRef.current = performance.now();
      setPhase("running");
      return;
    }

    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdown]);

  /* ---------------- ② 압박 진행 ---------------- */

  useEffect(() => {
    if (phase !== "running") return;

    let frame = 0;
    let lastStateUpdate = 0;

    function tick(now: number) {
      const elapsed = now - startedAtRef.current;

      // 원은 React 를 거치지 않고 직접 움직입니다 (성능)
      const visible = isGuideVisible(difficulty, elapsed);
      if (circleRef.current) {
        if (visible) {
          const scale =
            CIRCLE_MIN_SCALE +
            (CIRCLE_MAX_SCALE - CIRCLE_MIN_SCALE) * guideCircleScale(elapsed);
          circleRef.current.style.transform = `scale(${scale})`;
          circleRef.current.style.opacity = "1";
        } else {
          circleRef.current.style.opacity = "0";
        }
      }

      // 숫자 표시는 1초에 다섯 번만 갱신합니다
      if (now - lastStateUpdate >= STATE_REFRESH_MS) {
        lastStateUpdate = now;
        setDisplayBpm(currentBpm(tapsRef.current));
        setRemainingMs(Math.max(0, durationMs - elapsed));
        setGuideVisible(visible);
      }

      if (elapsed >= durationMs) {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinish([...tapsRef.current]);
        }
        return;
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, difficulty, durationMs, onFinish]);

  /* ---------------- 탭 처리 ---------------- */

  const handleTap = useCallback(() => {
    if (phase !== "running") return;
    tapsRef.current.push(performance.now());
    setTapCount(tapsRef.current.length);
    setDisplayBpm(currentBpm(tapsRef.current));
  }, [phase]);

  /* ---------------- 화면 ---------------- */

  if (phase === "ready") {
    return (
      <div className={styles.ready}>
        <p className={styles.readyLabel}>손을 가슴 한가운데에 올려두세요</p>
        <p className={styles.readyCount} aria-live="assertive">
          {countdown > 0 ? countdown : "시작!"}
        </p>
        <p className={styles.readyHint}>
          원이 가장 작아지는 순간에 맞춰 눌러주세요
        </p>
      </div>
    );
  }

  const zone = displayBpm === null ? null : rhythmZone(displayBpm);

  return (
    <div className={styles.pad} data-zone={zone ?? "none"}>
      {/* 왼쪽: 탭 하는 곳 */}
      <button
        type="button"
        className={styles.tapArea}
        onPointerDown={handleTap}
        aria-label="가슴 압박하기. 원이 가장 작아질 때 누르세요."
      >
        {/* 리듬 가이드 원 — ref 로 직접 움직입니다 */}
        <span ref={circleRef} className={styles.guideCircle} aria-hidden="true" />
        <span className={styles.tapLabel}>누르기</span>
        <span className={styles.tapCount}>{tapCount}회</span>
      </button>

      {/* 오른쪽: 속도와 남은 시간 */}
      <div className={styles.side}>
        <BpmMeter bpm={displayBpm} />

        {/* role="timer" 는 화면을 못 보는 학생에게 이게 시계라고 알려줍니다 */}
        <div className={styles.timeBox} role="timer" aria-live="off">
          <span className={styles.timeLabel}>남은 시간</span>
          <span className={styles.timeValue}>{formatDuration(remainingMs)}</span>
        </div>

        {!guideVisible ? (
          <p className={styles.guideGoneNote}>
            가이드가 사라졌어요. 이제 스스로 리듬을 지켜보세요!
          </p>
        ) : null}
      </div>
    </div>
  );
}
