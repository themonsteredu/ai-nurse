/**
 * "나의 간호 유형" 판정 파일.
 *
 * 기획서 기준: 세 미션 중 최고점을 받은 미션으로 유형이 정해집니다.
 * 점수가 같으면 로비 순서(응급실 → 구급차 → 보건실)가 빠른 쪽이 이깁니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { MISSION_LIST } from "@/data/missions";
import {
  MISSION_TO_NURSE_TYPE,
  NURSE_TYPES,
  type NurseType,
  type NurseTypeId,
} from "@/data/nurse-types";
import type { MissionId, MissionResult } from "@/data/types";

/**
 * 가장 잘한 미션을 찾습니다.
 * 점수가 같으면 로비에 놓인 순서가 빠른 쪽이 이깁니다.
 */
export function bestMission(results: MissionResult[]): MissionId | null {
  if (results.length === 0) return null;

  const missionOrder = new Map(
    MISSION_LIST.map((mission, index) => [mission.id, index] as const),
  );

  return results.reduce((best, candidate) => {
    if (candidate.accuracyPercent > best.accuracyPercent) return candidate;
    if (candidate.accuracyPercent < best.accuracyPercent) return best;

    const bestOrder = missionOrder.get(best.missionId) ?? 0;
    const candidateOrder = missionOrder.get(candidate.missionId) ?? 0;
    return candidateOrder < bestOrder ? candidate : best;
  }).missionId;
}

/** 최종 유형을 결정합니다. 아직 아무 미션도 안 했으면 null. */
export function decideNurseTypeId(
  results: MissionResult[],
): NurseTypeId | null {
  const best = bestMission(results);
  return best === null ? null : MISSION_TO_NURSE_TYPE[best];
}

/** 최종 유형의 전체 설명을 가져옵니다. 리포트 화면에서 씁니다. */
export function decideNurseType(results: MissionResult[]): NurseType | null {
  const typeId = decideNurseTypeId(results);
  return typeId === null ? null : NURSE_TYPES[typeId];
}
