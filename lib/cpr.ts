/**
 * 가슴압박(CPR) 리듬 계산 파일.
 *
 * 학생이 화면을 탭할 때마다 그 시각을 기록해두고,
 * 탭 사이의 간격으로 "분당 몇 번 누르고 있는지"(BPM)를 계산합니다.
 *
 * ★ 화면 코드는 여기 있는 함수만 부르면 됩니다.
 *   화면에 100 이나 120 같은 숫자를 직접 쓰면 안 됩니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import {
  CPR_BPM_MAX,
  CPR_BPM_MIN,
  CPR_DURATION_SECONDS,
  CPR_GUIDE_VISIBLE_SECONDS,
  CPR_MIN_COMPRESSIONS,
  CPR_SMOOTHING_WINDOW,
  CPR_TARGET_COMPRESSIONS,
} from "@/data/rules";
import type { Difficulty, ScoreTally } from "@/data/types";

/** 리듬이 느린지, 알맞은지, 빠른지. 화면에서 안내 문구를 고를 때 씁니다. */
export type RhythmZone = "slow" | "good" | "fast";

/** 화면에 표시할 BPM 숫자의 최대치. 실수로 두 번 눌렸을 때 튀는 걸 막습니다. */
const DISPLAY_BPM_CEILING = 240;

/** 탭 간격(밀리초)을 분당 횟수로 바꿉니다. */
export function bpmFromIntervalMs(intervalMs: number): number {
  if (intervalMs <= 0) return 0;
  return 60000 / intervalMs;
}

/** 이 속도가 권장 범위(분당 100~120회) 안에 있는지. */
export function isGoodRhythm(bpm: number): boolean {
  return bpm >= CPR_BPM_MIN && bpm <= CPR_BPM_MAX;
}

/** 느림 / 알맞음 / 빠름 중 어디인지 알려줍니다. */
export function rhythmZone(bpm: number): RhythmZone {
  if (bpm < CPR_BPM_MIN) return "slow";
  if (bpm > CPR_BPM_MAX) return "fast";
  return "good";
}

/** 권장 속도 범위. 화면에 "100~120회"라고 안내할 때 씁니다. */
export function targetBpmRange(): { min: number; max: number } {
  return { min: CPR_BPM_MIN, max: CPR_BPM_MAX };
}

/* ------------------------------------------------------------------ */
/* 리듬 가이드 원 (커졌다 작아지는 동그라미)                            */
/* ------------------------------------------------------------------ */

/**
 * 가이드 원이 한 번 커졌다 작아지는 데 걸리는 시간(밀리초).
 * 권장 속도 한가운데(분당 110회)에 맞춥니다.
 */
export function guideBeatIntervalMs(): number {
  const middleBpm = (CPR_BPM_MIN + CPR_BPM_MAX) / 2;
  return 60000 / middleBpm;
}

/**
 * 지금 이 순간 가이드 원의 크기(0~1).
 * 1에 가까울수록 크고, 0에 가까울수록 작습니다.
 * 학생은 이 값이 0이 되는 순간(가장 작아질 때) 탭해야 합니다.
 */
export function guideCircleScale(elapsedMs: number): number {
  const beat = guideBeatIntervalMs();
  const phase = (elapsedMs % beat) / beat;
  // 0 → 1 → 0 으로 부드럽게 오갑니다.
  return (Math.cos(phase * Math.PI * 2 - Math.PI) + 1) / 2;
}

/**
 * 지금 가이드 원을 보여줘야 하는지.
 *
 * 기획서 기준:
 *   초등 모드 — 끝까지 계속 보임
 *   중등 모드 — 20초가 지나면 사라짐 (스스로 리듬 유지)
 */
export function isGuideVisible(
  difficulty: Difficulty,
  elapsedMs: number,
): boolean {
  const visibleSeconds = CPR_GUIDE_VISIBLE_SECONDS[difficulty];
  if (visibleSeconds === null) return true;
  return elapsedMs < visibleSeconds * 1000;
}

/* ------------------------------------------------------------------ */
/* 가슴압박 시간                                                       */
/* ------------------------------------------------------------------ */

/** 이 난이도의 가슴압박 시간(밀리초). 초등 60초 / 중등 120초. */
export function compressionDurationMs(difficulty: Difficulty): number {
  return CPR_DURATION_SECONDS[difficulty] * 1000;
}

/** 탭한 시각들 사이의 간격 목록을 만듭니다. */
export function intervalsFromTaps(tapTimestamps: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < tapTimestamps.length; i += 1) {
    intervals.push(tapTimestamps[i] - tapTimestamps[i - 1]);
  }
  return intervals;
}

/**
 * 지금 이 순간의 BPM. 화면에 실시간으로 크게 보여줄 숫자입니다.
 * 숫자가 덜덜 떨리지 않게 최근 몇 번의 간격을 평균냅니다.
 * 아직 두 번도 안 눌렀으면 null 을 돌려줍니다. (보여줄 숫자가 없음)
 */
export function currentBpm(
  tapTimestamps: number[],
  windowSize: number = CPR_SMOOTHING_WINDOW,
): number | null {
  const intervals = intervalsFromTaps(tapTimestamps);
  if (intervals.length === 0) return null;

  const recent = intervals.slice(-Math.max(1, windowSize));
  const averageInterval =
    recent.reduce((sum, value) => sum + value, 0) / recent.length;

  const bpm = bpmFromIntervalMs(averageInterval);
  return Math.min(Math.round(bpm), DISPLAY_BPM_CEILING);
}

/** 채점할 수 있을 만큼 충분히 눌렀는지. */
export function hasEnoughCompressions(tapTimestamps: number[]): boolean {
  return tapTimestamps.length >= CPR_MIN_COMPRESSIONS;
}

/** 목표 압박 횟수까지 몇 번 남았는지. 화면의 진행 표시에 씁니다. */
export function compressionsRemaining(tapTimestamps: number[]): number {
  return Math.max(0, CPR_TARGET_COMPRESSIONS - tapTimestamps.length);
}

/** 목표 압박 횟수를 채웠는지. */
export function reachedCompressionTarget(tapTimestamps: number[]): boolean {
  return tapTimestamps.length >= CPR_TARGET_COMPRESSIONS;
}

/**
 * 가슴압박 점수를 매깁니다.
 *
 * 전체 개수는 "목표 횟수만큼 눌렀을 때 생기는 간격 수"로 고정합니다.
 * 그래서 몇 번만 정확히 누르고 멈추면 점수가 낮게 나옵니다.
 * (실제 심폐소생술도 리듬을 오래 유지하는 게 중요하기 때문입니다.)
 */
export function scoreCompressions(tapTimestamps: number[]): ScoreTally {
  const total = Math.max(1, CPR_TARGET_COMPRESSIONS - 1);

  if (!hasEnoughCompressions(tapTimestamps)) {
    return { correct: 0, total };
  }

  const goodIntervals = intervalsFromTaps(tapTimestamps).filter((interval) =>
    isGoodRhythm(bpmFromIntervalMs(interval)),
  ).length;

  return { correct: Math.min(goodIntervals, total), total };
}
