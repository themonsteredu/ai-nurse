"use client";

/**
 * 미션 주소로 들어왔을 때 어떤 화면을 열지 고르는 파일.
 *
 * 지금 상태:
 *   응급실  → 완성된 미션 화면 (TriageMissionScreen)
 *   119    → 완성된 미션 화면 (AmbulanceMissionScreen)
 *   보건실  → 임시 화면 (5단계에서 만듭니다)
 *
 * 미션을 새로 만들 때마다 아래 목록에 한 줄씩 연결하면 됩니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 손댈 필요가 없습니다.
 *    화면을 고르는 역할만 하고, 보이는 건 각 미션 화면이 담당합니다.
 */

import type { MissionId } from "@/data/types";

import { AmbulanceMissionScreen } from "./AmbulanceMissionScreen";
import { MissionPlaceholder } from "./MissionPlaceholder";
import { TriageMissionScreen } from "./TriageMissionScreen";

export function MissionRouter({ missionId }: { missionId: MissionId }) {
  switch (missionId) {
    case "er":
      return <TriageMissionScreen />;

    case "ambulance":
      return <AmbulanceMissionScreen />;

    // 5단계에서 진짜 화면으로 바꿉니다.
    case "healthRoom":
      return <MissionPlaceholder missionId={missionId} />;
  }
}
