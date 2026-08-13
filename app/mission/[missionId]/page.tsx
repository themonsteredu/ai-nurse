/**
 * 미션 주소 ( /mission/er 처럼 미션 이름이 붙습니다 ).
 *
 * 📌 지금은 임시 화면입니다.
 *    진짜 미션은 3~5단계에서 만듭니다.
 *      3단계 → 미션 1 응급실
 *      4단계 → 미션 2 119 구급차
 *      5단계 → 미션 3 보건실
 *
 * 지금 이 임시 화면이 있는 이유는, 선생님이 지금 당장
 * "시작 → 로비 → 미션 → 통과 코드 → 로비(배지 켜짐)" 흐름을
 * 직접 눌러서 확인할 수 있게 하기 위해서입니다.
 */

import { notFound } from "next/navigation";

import { MissionPlaceholder } from "@/components/MissionPlaceholder";
import { ALL_MISSION_IDS, parseMissionId } from "@/lib/missions";

/** 미션 세 곳의 주소를 미리 만들어 둡니다. */
export function generateStaticParams() {
  return ALL_MISSION_IDS.map((missionId) => ({ missionId }));
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const validMissionId = parseMissionId(missionId);

  if (validMissionId === null) notFound();

  return <MissionPlaceholder missionId={validMissionId} />;
}
