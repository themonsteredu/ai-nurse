/**
 * 미션 주소 ( /mission/er 처럼 미션 이름이 붙습니다 ).
 *
 * 어떤 화면이 열릴지는 components/MissionRouter.tsx 가 정합니다.
 *   응급실  → 완성 (3단계)
 *   119    → 임시 화면 (4단계에서 만듦)
 *   보건실  → 임시 화면 (5단계에서 만듦)
 */

import { notFound } from "next/navigation";

import { MissionRouter } from "@/components/MissionRouter";
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

  return <MissionRouter missionId={validMissionId} />;
}
