/**
 * 미션 종류를 다루는 도우미 파일.
 *
 * 주소창에 /mission/er 처럼 미션 이름이 들어오는데,
 * 그게 진짜 있는 미션인지 확인하는 일을 합니다.
 * (학생이 주소를 잘못 치거나 장난쳐도 앱이 깨지지 않게)
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { MISSIONS, MISSION_LIST, type MissionInfo } from "@/data/missions";
import type { MissionId } from "@/data/types";

/** 이 글자가 진짜 미션 이름인지 확인합니다. */
export function isMissionId(value: string): value is MissionId {
  return Object.prototype.hasOwnProperty.call(MISSIONS, value);
}

/** 글자를 미션 이름으로 바꿉니다. 없는 미션이면 null. */
export function parseMissionId(value: string): MissionId | null {
  return isMissionId(value) ? value : null;
}

/** 미션 정보를 가져옵니다. */
export function getMission(missionId: MissionId): MissionInfo {
  return MISSIONS[missionId];
}

/** 로비 순서에서 이 미션이 몇 번째인지 (1부터). */
export function missionPosition(missionId: MissionId): number {
  return MISSION_LIST.findIndex((mission) => mission.id === missionId) + 1;
}

/** 전체 미션 개수. */
export const TOTAL_MISSION_COUNT = MISSION_LIST.length;

/** 모든 미션 이름 목록. 주소를 미리 만들어둘 때 씁니다. */
export const ALL_MISSION_IDS: MissionId[] = MISSION_LIST.map(
  (mission) => mission.id,
);
