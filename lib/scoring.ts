/**
 * 점수 계산의 기본이 되는 파일.
 *
 * "몇 개 맞았는지"를 "몇 퍼센트인지"로 바꾸고,
 * 난이도별 통과 기준을 넘었는지 판단합니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { PASS_THRESHOLD_PERCENT } from "@/data/rules";
import type {
  Difficulty,
  MissionId,
  MissionResult,
  ScoreTally,
} from "@/data/types";

/** 맞은 개수 0개, 전체 0개짜리 빈 성적. */
export const EMPTY_TALLY: ScoreTally = { correct: 0, total: 0 };

/**
 * 정확도를 0~100 사이 정수로 계산합니다.
 * 문제가 하나도 없으면 0을 돌려줍니다. (0으로 나누기 방지)
 */
export function accuracyPercent(tally: ScoreTally): number {
  if (tally.total <= 0) return 0;
  return Math.round((tally.correct / tally.total) * 100);
}

/** 이 난이도에서 통과하려면 몇 퍼센트가 필요한지. */
export function passThreshold(difficulty: Difficulty): number {
  return PASS_THRESHOLD_PERCENT[difficulty];
}

/** 통과 기준을 넘었는지 판단합니다. (기준값과 같으면 통과) */
export function isPassing(tally: ScoreTally, difficulty: Difficulty): boolean {
  return accuracyPercent(tally) >= passThreshold(difficulty);
}

/** 여러 과제의 성적을 하나로 합칩니다. (미션 2처럼 과제가 3개인 경우) */
export function combineTallies(...tallies: ScoreTally[]): ScoreTally {
  return tallies.reduce<ScoreTally>(
    (sum, item) => ({
      correct: sum.correct + item.correct,
      total: sum.total + item.total,
    }),
    { ...EMPTY_TALLY },
  );
}

/** 미션 하나를 끝냈을 때의 성적표를 만듭니다. */
export function buildMissionResult(
  missionId: MissionId,
  tally: ScoreTally,
  difficulty: Difficulty,
): MissionResult {
  return {
    missionId,
    tally,
    accuracyPercent: accuracyPercent(tally),
    passed: isPassing(tally, difficulty),
  };
}

/** 전체 미션의 평균 정확도. 최종 리포트의 총점으로 씁니다. */
export function overallAccuracyPercent(results: MissionResult[]): number {
  if (results.length === 0) return 0;
  const combined = combineTallies(...results.map((item) => item.tally));
  return accuracyPercent(combined);
}
