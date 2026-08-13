/**
 * 통과 코드 확인 파일.
 *
 * 미션을 끝낸 학생은 강사가 불러주는 네 자리를 넣어야 로비로 돌아갑니다.
 * 반 전체의 진도를 맞추기 위한 장치입니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { UNLOCK_CODES, UNLOCK_CODE_LENGTH } from "@/data/rules";
import type { MissionId } from "@/data/types";

/**
 * 학생이 입력한 값을 정리합니다.
 * 숫자가 아닌 글자는 버리고, 네 자리까지만 받습니다.
 */
export function normalizeUnlockCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, UNLOCK_CODE_LENGTH);
}

/** 네 자리를 다 채웠는지. */
export function isCodeComplete(input: string): boolean {
  return normalizeUnlockCode(input).length === UNLOCK_CODE_LENGTH;
}

/** 이 미션의 통과 코드가 맞는지 확인합니다. */
export function isValidUnlockCode(
  missionId: MissionId,
  input: string,
): boolean {
  return normalizeUnlockCode(input) === UNLOCK_CODES[missionId];
}

/** 통과 코드 자릿수 (네 자리). 입력칸을 만들 때 씁니다. */
export const CODE_LENGTH = UNLOCK_CODE_LENGTH;
