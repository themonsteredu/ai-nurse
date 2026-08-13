/**
 * 미션 3(보건실) 채점 파일.
 *
 * 초등 모드: 응급처치 상황 5개만 채점합니다.
 * 중등 모드: 여기에 보건일지 문장 조립 점수가 더해집니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import {
  HEALTH_LOG_SLOT_LIST,
  type HealthLogSlot,
} from "@/data/health-log";
import {
  HEALTH_ROOM_CASES,
  type HealthRoomCase,
  type HealthRoomChoice,
} from "@/data/health-room-cases";
import type { Difficulty, ScoreTally } from "@/data/types";
import { combineTallies, EMPTY_TALLY } from "./scoring";

/** 학생이 각 상황에서 고른 선택지. 키는 상황 id, 값은 선택지 id. */
export type HealthRoomAnswers = Record<string, string | null>;

/** 학생이 보건일지 각 칸에서 고른 조각. 키는 칸 id, 값은 조각 id. */
export type HealthLogAnswers = Record<string, string | null>;

/* ------------------------- 응급처치 상황 5개 ------------------------ */

/** 상황 id 로 상황 정보를 찾습니다. */
export function findCase(caseId: string): HealthRoomCase | undefined {
  return HEALTH_ROOM_CASES.find((item) => item.id === caseId);
}

/** 이 상황의 정답 선택지. */
export function correctChoiceFor(
  caseId: string,
): HealthRoomChoice | undefined {
  return findCase(caseId)?.choices.find((choice) => choice.isCorrect);
}

/** 학생이 고른 선택지 정보를 찾습니다. */
export function findChoice(
  caseId: string,
  choiceId: string,
): HealthRoomChoice | undefined {
  return findCase(caseId)?.choices.find((choice) => choice.id === choiceId);
}

/** 이 선택이 정답인지. */
export function isCorrectChoice(caseId: string, choiceId: string): boolean {
  return findChoice(caseId, choiceId)?.isCorrect ?? false;
}

/** 고른 선택지에 붙은 설명. 정답이든 오답이든 보여줍니다. */
export function choiceExplanationFor(
  caseId: string,
  choiceId: string,
): string {
  return findChoice(caseId, choiceId)?.explanation ?? "";
}

/** 응급처치 상황 점수를 매깁니다. */
export function scoreHealthRoomCases(
  answers: HealthRoomAnswers,
  cases: HealthRoomCase[],
): ScoreTally {
  let correct = 0;
  for (const item of cases) {
    const chosen = answers[item.id];
    if (chosen && isCorrectChoice(item.id, chosen)) correct += 1;
  }
  return { correct, total: cases.length };
}

/* --------------------- 보건일지 (중등 모드 전용) -------------------- */

/** 칸 id 로 칸 정보를 찾습니다. */
export function findLogSlot(slotId: string): HealthLogSlot | undefined {
  return HEALTH_LOG_SLOT_LIST.find((slot) => slot.id === slotId);
}

/** 이 칸의 정답 조각인지. */
export function isCorrectLogOption(slotId: string, optionId: string): boolean {
  const slot = findLogSlot(slotId);
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
    return chosen?.label ?? "____";
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

/** 이 난이도에서 보건일지 과제를 해야 하는지. */
export function needsHealthLog(difficulty: Difficulty): boolean {
  return difficulty === "middle";
}

/* ------------------------ 미션 3 전체 점수 ------------------------- */

/**
 * 미션 3 전체 점수.
 * 중등 모드일 때만 보건일지 점수가 합쳐집니다.
 */
export function scoreHealthRoomMission(parts: {
  cases: ScoreTally;
  log: ScoreTally | null;
  difficulty: Difficulty;
}): ScoreTally {
  if (!needsHealthLog(parts.difficulty) || parts.log === null) {
    return parts.cases;
  }
  return combineTallies(parts.cases, parts.log ?? EMPTY_TALLY);
}
