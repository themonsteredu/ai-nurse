/**
 * 학생 한 명의 체험 진행 상황을 담는 파일.
 *
 * ★ 중요: 여기 담기는 내용은 브라우저 메모리에만 있습니다.
 *   서버로 보내지 않고, 저장하지도 않습니다.
 *   새로고침하면 전부 사라지고 처음부터 시작합니다.
 *   (학교 반입 시 개인정보 승인 절차를 피하기 위한 의도적인 설계입니다.)
 *
 * 이 파일에는 React 코드가 없습니다. 순수한 계산만 있습니다.
 * 화면에 연결하는 부분은 components/ 폴더에서 따로 만듭니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import { MISSION_LIST } from "@/data/missions";
import { STUDENT_NAME_MAX_LENGTH } from "@/data/rules";
import type { Difficulty, MissionId, MissionResult } from "@/data/types";

export type SessionState = {
  /** 수료증에 찍을 이름. 저장되지 않습니다. */
  studentName: string;
  /** 초등 모드 / 중등 모드 */
  difficulty: Difficulty;
  /** 미션별 성적표 */
  results: Partial<Record<MissionId, MissionResult>>;
  /** 통과 코드까지 넣고 로비로 돌아온 미션들 */
  unlockedMissions: MissionId[];
};

/** 입력한 이름을 정리합니다. 앞뒤 공백을 없애고 길이를 제한합니다. */
export function normalizeStudentName(input: string): string {
  return input.trim().slice(0, STUDENT_NAME_MAX_LENGTH);
}

/** 이름이 체험을 시작할 수 있을 만큼 입력되었는지. */
export function isNameReady(input: string): boolean {
  return normalizeStudentName(input).length > 0;
}

/** 새 체험을 시작합니다. */
export function createSession(
  studentName: string,
  difficulty: Difficulty,
): SessionState {
  return {
    studentName: normalizeStudentName(studentName),
    difficulty,
    results: {},
    unlockedMissions: [],
  };
}

/** 미션 성적을 기록합니다. 다시 하면 새 성적으로 덮어씁니다. */
export function recordMissionResult(
  state: SessionState,
  result: MissionResult,
): SessionState {
  return {
    ...state,
    results: { ...state.results, [result.missionId]: result },
  };
}

/** 통과 코드를 맞게 넣었을 때 호출합니다. */
export function markMissionUnlocked(
  state: SessionState,
  missionId: MissionId,
): SessionState {
  if (state.unlockedMissions.includes(missionId)) return state;
  return {
    ...state,
    unlockedMissions: [...state.unlockedMissions, missionId],
  };
}

/** 이 미션을 이미 해봤는지 (성적이 기록되었는지). */
export function hasAttempted(
  state: SessionState,
  missionId: MissionId,
): boolean {
  return state.results[missionId] !== undefined;
}

/** 이 미션이 완전히 끝났는지 (성적 기록 + 통과 코드 입력까지). */
export function isMissionComplete(
  state: SessionState,
  missionId: MissionId,
): boolean {
  return hasAttempted(state, missionId) &&
    state.unlockedMissions.includes(missionId);
}

/** 기록된 성적표 목록. 배지·유형 판정에 넘겨줍니다. */
export function resultList(state: SessionState): MissionResult[] {
  return MISSION_LIST.map((mission) => state.results[mission.id]).filter(
    (item): item is MissionResult => item !== undefined,
  );
}

/** 아직 안 끝낸 미션 중 로비 순서상 가장 앞선 것. 없으면 null. */
export function nextMission(state: SessionState): MissionId | null {
  const remaining = MISSION_LIST.find(
    (mission) => !isMissionComplete(state, mission.id),
  );
  return remaining?.id ?? null;
}

/** 세 미션을 모두 끝냈는지 (통과 여부와 관계없이 다녀왔는지). */
export function isAllMissionsComplete(state: SessionState): boolean {
  return MISSION_LIST.every((mission) =>
    isMissionComplete(state, mission.id),
  );
}

/**
 * 최종 리포트를 열 수 있는지.
 *
 * 기획서 기준: "배지 3개를 다 모아야 리포트가 열린다."
 * 즉 세 미션을 다녀오기만 해서는 안 되고, 세 곳 모두 통과해야 합니다.
 * 통과하지 못한 미션은 로비에서 다시 도전할 수 있습니다.
 */
export function canOpenReport(state: SessionState): boolean {
  return MISSION_LIST.every(
    (mission) => state.results[mission.id]?.passed === true,
  );
}

/** 아직 통과하지 못해 다시 도전해야 하는 미션 목록. */
export function missionsToRetry(state: SessionState): MissionId[] {
  return MISSION_LIST.filter(
    (mission) =>
      isMissionComplete(state, mission.id) &&
      state.results[mission.id]?.passed !== true,
  ).map((mission) => mission.id);
}

/** 끝낸 미션 개수. 로비의 진행 표시에 씁니다. */
export function completedMissionCount(state: SessionState): number {
  return MISSION_LIST.filter((mission) =>
    isMissionComplete(state, mission.id),
  ).length;
}
