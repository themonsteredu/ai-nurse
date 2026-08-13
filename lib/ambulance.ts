/**
 * 미션 2(119 구급차) 채점 파일.
 *
 * 이 미션은 과제가 3개라서, 세 점수를 합쳐 하나의 성적으로 만듭니다.
 *   ① 신고 순서 맞추기
 *   ② 가슴압박 리듬 (계산은 lib/cpr.ts 가 담당)
 *   ③ AED 패드 위치
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { AED_PAD_COUNT, AED_PAD_SPOTS, type AedPadSpot } from "@/data/aed-pads";
import type { DispatchStep } from "@/data/dispatch-steps";
import type { ScoreTally } from "@/data/types";
import { combineTallies } from "./scoring";

/* --------------------------- ① 신고 순서 --------------------------- */

/**
 * 학생이 배열한 순서를 채점합니다.
 * 제자리에 놓인 카드 하나당 1점입니다.
 *
 * @param arrangedIds 학생이 위에서부터 배열한 카드 id 목록
 * @param steps 이 난이도에서 쓰는 카드 목록 (정답 순서대로 정렬된 것)
 */
export function scoreDispatchOrder(
  arrangedIds: string[],
  steps: DispatchStep[],
): ScoreTally {
  const correctOrder = [...steps]
    .sort((a, b) => a.correctOrder - b.correctOrder)
    .map((step) => step.id);

  let correct = 0;
  for (let i = 0; i < correctOrder.length; i += 1) {
    if (arrangedIds[i] === correctOrder[i]) correct += 1;
  }
  return { correct, total: correctOrder.length };
}

/** 이 카드가 지금 자리에 제대로 놓였는지. 화면에서 O/X 표시할 때 씁니다. */
export function isStepInCorrectPosition(
  stepId: string,
  position: number,
  steps: DispatchStep[],
): boolean {
  const step = steps.find((item) => item.id === stepId);
  if (!step) return false;
  return step.correctOrder === position + 1;
}

/* --------------------------- ③ AED 패드 --------------------------- */

/** 패드 자리 id 로 자리 정보를 찾습니다. */
export function findPadSpot(spotId: string): AedPadSpot | undefined {
  return AED_PAD_SPOTS.find((spot) => spot.id === spotId);
}

/** 이 자리가 정답인지. */
export function isCorrectPadSpot(spotId: string): boolean {
  return findPadSpot(spotId)?.isCorrect ?? false;
}

/** 이 자리를 골랐을 때 보여줄 설명. */
export function padExplanationFor(spotId: string): string {
  return findPadSpot(spotId)?.explanation ?? "";
}

/** 패드를 붙일 만큼 다 골랐는지. */
export function isPadSelectionComplete(selectedIds: string[]): boolean {
  return selectedIds.length >= AED_PAD_COUNT;
}

/**
 * AED 패드 점수를 매깁니다.
 * 붙여야 하는 개수(2개)가 전체 점수이고, 그중 맞게 붙인 개수가 점수입니다.
 */
export function scoreAedPads(selectedIds: string[]): ScoreTally {
  const unique = Array.from(new Set(selectedIds)).slice(0, AED_PAD_COUNT);
  const correct = unique.filter((id) => isCorrectPadSpot(id)).length;
  return { correct, total: AED_PAD_COUNT };
}

/* ------------------------ 세 과제 점수 합치기 ----------------------- */

/** 미션 2 전체 점수 = 신고 순서 + 가슴압박 + AED 패드. */
export function scoreAmbulanceMission(parts: {
  dispatch: ScoreTally;
  compressions: ScoreTally;
  aed: ScoreTally;
}): ScoreTally {
  return combineTallies(parts.dispatch, parts.compressions, parts.aed);
}
