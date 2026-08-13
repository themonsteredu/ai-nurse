/**
 * 미션 3(보건실) 채점 파일.
 *
 * 기획서 기준으로 상황마다 두 번 고릅니다.
 *   ① 바로 할 처치   ② 그 다음 조치
 * 두 선택 모두 각각 1점씩입니다. 상황 5개 = 10점.
 *
 * 중등 모드는 여기에 보건일지 점수(5점)가 더해집니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { HEALTH_LOG_SLOT_LIST } from "@/data/health-log";
import {
  HEALTH_ROOM_CASES,
  type HealthRoomCase,
  type HealthRoomChoice,
  type HealthRoomFollowUp,
} from "@/data/health-room-cases";
import type { Difficulty, ScoreTally } from "@/data/types";
import { combineTallies } from "./scoring";

/** 학생이 각 상황에서 고른 처치. 키는 상황 id, 값은 선택지 id. */
export type TreatmentAnswers = Record<string, string | null>;

/** 학생이 각 상황에서 고른 다음 조치. 키는 상황 id, 값은 선택지 id. */
export type FollowUpAnswers = Record<string, string | null>;

/** 학생이 보건일지 각 칸에서 고른 조각. 키는 칸 id, 값은 조각 id. */
export type HealthLogAnswers = Record<string, string | null>;

/* ------------------------- 상황 찾기 도우미 ------------------------ */

export function findCase(caseId: string): HealthRoomCase | undefined {
  return HEALTH_ROOM_CASES.find((item) => item.id === caseId);
}

/* --------------------------- ① 처치 선택 --------------------------- */

export function findTreatmentChoice(
  caseId: string,
  choiceId: string,
): HealthRoomChoice | undefined {
  return findCase(caseId)?.treatmentChoices.find(
    (choice) => choice.id === choiceId,
  );
}

/** 이 처치 선택이 정답인지. */
export function isCorrectTreatment(caseId: string, choiceId: string): boolean {
  return findTreatmentChoice(caseId, choiceId)?.isCorrect ?? false;
}

/** 고른 처치에 붙은 설명. 정답이든 오답이든 보여줍니다. */
export function treatmentExplanationFor(
  caseId: string,
  choiceId: string,
): string {
  return findTreatmentChoice(caseId, choiceId)?.explanation ?? "";
}

/** 이 상황의 정답 처치. */
export function correctTreatmentFor(
  caseId: string,
): HealthRoomChoice | undefined {
  return findCase(caseId)?.treatmentChoices.find((choice) => choice.isCorrect);
}

/* ------------------------- ② 다음 조치 선택 ------------------------ */

export function findFollowUpChoice(
  caseId: string,
  choiceId: string,
): HealthRoomFollowUp | undefined {
  return findCase(caseId)?.followUpChoices.find(
    (choice) => choice.id === choiceId,
  );
}

/** 이 다음 조치 선택이 정답인지. */
export function isCorrectFollowUp(caseId: string, choiceId: string): boolean {
  return findFollowUpChoice(caseId, choiceId)?.isCorrect ?? false;
}

/** 고른 다음 조치에 붙은 설명. */
export function followUpExplanationFor(
  caseId: string,
  choiceId: string,
): string {
  return findFollowUpChoice(caseId, choiceId)?.explanation ?? "";
}

/** 이 상황의 정답 다음 조치. */
export function correctFollowUpFor(
  caseId: string,
): HealthRoomFollowUp | undefined {
  return findCase(caseId)?.followUpChoices.find((choice) => choice.isCorrect);
}

/* --------------------------- 상황 점수 ----------------------------- */

/**
 * 응급처치 상황 점수를 매깁니다.
 * 상황 하나당 처치 1점 + 다음 조치 1점 = 2점입니다.
 */
export function scoreHealthRoomCases(
  treatments: TreatmentAnswers,
  followUps: FollowUpAnswers,
  cases: HealthRoomCase[],
): ScoreTally {
  let correct = 0;
  for (const item of cases) {
    const treatment = treatments[item.id];
    if (treatment && isCorrectTreatment(item.id, treatment)) correct += 1;

    const followUp = followUps[item.id];
    if (followUp && isCorrectFollowUp(item.id, followUp)) correct += 1;
  }
  return { correct, total: cases.length * 2 };
}

/* --------------------- 보건일지 (중등 모드 전용) -------------------- */

export function isCorrectLogOption(slotId: string, optionId: string): boolean {
  const slot = HEALTH_LOG_SLOT_LIST.find((item) => item.id === slotId);
  if (!slot) return false;
  return slot.options.some(
    (option) => option.id === optionId && option.isCorrect,
  );
}

/** 완성된 보건일지 문장을 만듭니다. 리포트에 보여줄 때 씁니다. */
export function buildLogSentence(answers: HealthLogAnswers): string {
  return HEALTH_LOG_SLOT_LIST.map((slot) => {
    const chosenId = answers[slot.id];
    const chosen = slot.options.find((option) => option.id === chosenId);
    const label = chosen?.label ?? "____";
    return slot.suffix ? `${label}${slot.suffix}` : label;
  }).join(" ");
}

/** 보건일지 점수를 매깁니다. */
export function scoreHealthLog(answers: HealthLogAnswers): ScoreTally {
  let correct = 0;
  for (const slot of HEALTH_LOG_SLOT_LIST) {
    const chosen = answers[slot.id];
    if (chosen && isCorrectLogOption(slot.id, chosen)) correct += 1;
  }
  return { correct, total: HEALTH_LOG_SLOT_LIST.length };
}

/** 이 난이도에서 보건일지 과제를 해야 하는지. (중등만) */
export function needsHealthLog(difficulty: Difficulty): boolean {
  return difficulty === "middle";
}

/* ------------------------ 미션 3 전체 점수 ------------------------- */

export function scoreHealthRoomMission(parts: {
  cases: ScoreTally;
  log: ScoreTally | null;
  difficulty: Difficulty;
}): ScoreTally {
  if (!needsHealthLog(parts.difficulty) || parts.log === null) {
    return parts.cases;
  }
  return combineTallies(parts.cases, parts.log);
}
