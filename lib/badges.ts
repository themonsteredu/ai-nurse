/**
 * 배지 판정 파일.
 *
 * 미션을 "통과"하면 배지를 하나 받습니다.
 * 통과하지 못하면 미션은 끝나지만 배지는 안 켜집니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { MISSIONS, MISSION_LIST } from "@/data/missions";
import type { MissionId, MissionResult } from "@/data/types";

export type BadgeStatus = {
  missionId: MissionId;
  /** 배지 이름 */
  name: string;
  /** 배지를 받았는지 (통과했는지) */
  earned: boolean;
  /** 미션을 시도는 했는지 */
  attempted: boolean;
};

/** 이 미션의 배지를 받았는지. */
export function hasBadge(
  results: MissionResult[],
  missionId: MissionId,
): boolean {
  return results.some((item) => item.missionId === missionId && item.passed);
}

/** 로비의 배지 점등에 쓸, 미션 3개의 배지 상태 목록. */
export function badgeStatuses(results: MissionResult[]): BadgeStatus[] {
  return MISSION_LIST.map((mission) => ({
    missionId: mission.id,
    name: mission.badgeName,
    earned: hasBadge(results, mission.id),
    attempted: results.some((item) => item.missionId === mission.id),
  }));
}

/** 받은 배지 개수. */
export function earnedBadgeCount(results: MissionResult[]): number {
  return MISSION_LIST.filter((mission) => hasBadge(results, mission.id)).length;
}

/** 배지 세 개를 모두 받았는지. */
export function hasAllBadges(results: MissionResult[]): boolean {
  return earnedBadgeCount(results) === MISSION_LIST.length;
}

/** 전체 배지 개수 (지금은 3개). */
export const TOTAL_BADGE_COUNT = MISSION_LIST.length;

/** 이 미션의 배지 이름. */
export function badgeNameFor(missionId: MissionId): string {
  return MISSIONS[missionId].badgeName;
}
