/**
 * 미션 1(응급실) 채점 파일.
 *
 * 학생이 환자 카드를 어느 구역에 놓았는지 받아서, 몇 개 맞았는지 셉니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { TRIAGE_PATIENTS, type TriagePatient } from "@/data/triage-patients";
import { TRIAGE_TIME_LIMIT_SECONDS } from "@/data/rules";
import type { Difficulty, ScoreTally, TriageLevel } from "@/data/types";

/**
 * 학생이 카드를 어디에 놓았는지 기록하는 형태.
 * 키는 환자 id, 값은 놓은 구역(아직 안 놓았으면 null).
 */
export type TriagePlacements = Record<string, TriageLevel | null>;

/** 아직 아무 카드도 안 놓은 상태를 만듭니다. */
export function createEmptyPlacements(
  patients: TriagePatient[],
): TriagePlacements {
  const placements: TriagePlacements = {};
  for (const patient of patients) {
    placements[patient.id] = null;
  }
  return placements;
}

/** 이 환자를 이 구역에 놓은 게 맞는지. */
export function isCorrectPlacement(
  patient: TriagePatient,
  zone: TriageLevel,
): boolean {
  return patient.correctZone === zone;
}

/** 환자 id 로 환자 정보를 찾습니다. */
export function findPatient(patientId: string): TriagePatient | undefined {
  return TRIAGE_PATIENTS.find((patient) => patient.id === patientId);
}

/** 이 환자의 정답 구역. */
export function correctZoneFor(patientId: string): TriageLevel | null {
  return findPatient(patientId)?.correctZone ?? null;
}

/** 틀렸을 때 보여줄 해설 문구. */
export function explanationFor(patientId: string): string {
  return findPatient(patientId)?.explanation ?? "";
}

/** 모든 카드를 다 놓았는지. */
export function isAllPlaced(placements: TriagePlacements): boolean {
  return Object.values(placements).every((zone) => zone !== null);
}

/** 아직 안 놓은 카드 수. */
export function remainingCount(placements: TriagePlacements): number {
  return Object.values(placements).filter((zone) => zone === null).length;
}

/** 미션 1 점수를 매깁니다. */
export function scoreTriage(
  placements: TriagePlacements,
  patients: TriagePatient[],
): ScoreTally {
  let correct = 0;
  for (const patient of patients) {
    const placed = placements[patient.id];
    if (placed !== null && placed !== undefined) {
      if (isCorrectPlacement(patient, placed)) correct += 1;
    }
  }
  return { correct, total: patients.length };
}

/**
 * 이 난이도의 제한시간(밀리초). 제한이 없으면 null.
 * 기획서 기준: 초등 제한 없음 / 중등 3분.
 */
export function triageTimeLimitMs(difficulty: Difficulty): number | null {
  const seconds = TRIAGE_TIME_LIMIT_SECONDS[difficulty];
  return seconds === null ? null : seconds * 1000;
}

/** 이 난이도에 제한시간이 있는지. */
export function hasTimeLimit(difficulty: Difficulty): boolean {
  return TRIAGE_TIME_LIMIT_SECONDS[difficulty] !== null;
}

/** 틀린 카드 목록. 미션이 끝난 뒤 해설 카드를 보여줄 때 씁니다. */
export function wrongPlacements(
  placements: TriagePlacements,
  patients: TriagePatient[],
): TriagePatient[] {
  return patients.filter((patient) => {
    const placed = placements[patient.id];
    if (placed === null || placed === undefined) return true;
    return !isCorrectPlacement(patient, placed);
  });
}
