/**
 * 통과 코드 주소 ( /unlock/er 처럼 미션 이름이 붙습니다 ).
 *
 * 주소에 들어온 미션 이름이 진짜 있는 미션인지 먼저 확인하고,
 * 없는 이름이면 "없는 주소" 화면을 보여줍니다.
 * (학생이 주소를 잘못 쳐도 앱이 깨지지 않게 하기 위해서입니다)
 *
 * 실제 내용은 components/UnlockCodeScreen.tsx 에 있습니다.
 */

import { notFound } from "next/navigation";

import { UnlockCodeScreen } from "@/components/UnlockCodeScreen";
import { ALL_MISSION_IDS, parseMissionId } from "@/lib/missions";

/** 미션 세 곳의 주소를 미리 만들어 둡니다. 인터넷이 느려도 빨리 열립니다. */
export function generateStaticParams() {
  return ALL_MISSION_IDS.map((missionId) => ({ missionId }));
}

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const validMissionId = parseMissionId(missionId);

  if (validMissionId === null) notFound();

  return <UnlockCodeScreen missionId={validMissionId} />;
}
