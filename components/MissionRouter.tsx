"use client";

/**
 * 미션 주소로 들어왔을 때 어떤 화면을 열지 고르는 파일.
 *
 * 지금 상태: 세 미션 모두 완성되었습니다.
 *   응급실  → TriageMissionScreen
 *   119    → AmbulanceMissionScreen
 *   보건실  → HealthRoomMissionScreen
 *
 * 미션을 새로 추가하려면 아래 목록에 한 줄씩 연결하면 됩니다.
 * (기획서 8번 "확장 계획"의 수술실·감염관리실 등이 여기 붙습니다)
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 손댈 필요가 없습니다.
 *    화면을 고르는 역할만 하고, 보이는 건 각 미션 화면이 담당합니다.
 */

import type { MissionId } from "@/data/types";

import { AmbulanceMissionScreen } from "./AmbulanceMissionScreen";
import { HealthRoomMissionScreen } from "./HealthRoomMissionScreen";
import { TriageMissionScreen } from "./TriageMissionScreen";

export function MissionRouter({ missionId }: { missionId: MissionId }) {
  switch (missionId) {
    case "er":
      return <TriageMissionScreen />;

    case "ambulance":
      return <AmbulanceMissionScreen />;

    case "healthRoom":
      return <HealthRoomMissionScreen />;
  }
}
