"use client";

/**
 * 로비 화면 — 미션을 고르는 곳. 미션이 끝날 때마다 여기로 돌아옵니다.
 *
 * 무엇을 하나:
 *  1. 위에서 내려다본 병원 조감도를 보여줍니다
 *  2. 부서 구역을 누르면 그 미션으로 들어갑니다
 *  3. 다녀온 구역은 불이 켜지고, 배지를 받으면 별이 붙습니다
 *  4. 세 미션을 다 끝내면 최종 리포트 버튼이 나타납니다
 *
 * 어떤 데이터를 쓰나:
 *  - data/missions.ts        : 부서 이름, 설명, 배지 이름
 *  - lib/badges.ts           : 배지를 받았는지 판정
 *  - lib/session.ts          : 어느 미션을 끝냈는지
 *  - components/HospitalFloorPlan.tsx : 조감도 그림과 부서 버튼
 *
 * 이 파일은 "무엇을 보여줄지" 정하고, 실제로 그리는 일은
 * HospitalFloorPlan 이 합니다.
 *
 * 감정 톤: 병원에 막 도착한 설렘. 어디로 갈지 고르는 기분.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 바꿔도 됩니다.
 */

import { useRouter } from "next/navigation";

import { MISSION_LIST } from "@/data/missions";
import type { MissionId } from "@/data/types";
import { hasBadge, earnedBadgeCount, TOTAL_BADGE_COUNT } from "@/lib/badges";
import {
  canOpenReport,
  completedMissionCount,
  isMissionComplete,
  missionsToRetry,
  resultList,
} from "@/lib/session";

import { AppScreen } from "./AppScreen";
import { HospitalFloorPlan, type HospitalRoom } from "./HospitalFloorPlan";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession } from "./SessionProvider";
import styles from "./LobbyScreen.module.css";

export function LobbyScreen() {
  const router = useRouter();
  const session = useRequireSession();

  // 새로고침으로 진행 상황이 사라졌으면 시작 화면으로 되돌아가는 중입니다.
  if (session === null) return null;

  const results = resultList(session);

  // 조감도에 넘겨줄 부서 세 곳의 상태를 만듭니다.
  const rooms: HospitalRoom[] = MISSION_LIST.map((mission) => ({
    missionId: mission.id,
    title: mission.title,
    subtitle: mission.subtitle,
    order: mission.order,
    visited: isMissionComplete(session, mission.id),
    badgeEarned: hasBadge(results, mission.id),
  }));

  function handleEnterRoom(missionId: MissionId) {
    router.push(`/mission/${missionId}`);
  }

  const completed = completedMissionCount(session);

  // 기획서 기준: 배지 3개를 다 모아야 리포트가 열립니다.
  const reportReady = canOpenReport(session);

  // 다녀왔지만 통과 못 해서 다시 도전해야 하는 미션들
  const retryList = missionsToRetry(session);

  return (
    <AppScreen
      title={`${session.studentName} 간호사님, 어서 오세요`}
      subtitle="가고 싶은 곳을 눌러보세요"
      tone="calm"
      footer={
        reportReady ? (
          <PrimaryButton fullWidth onClick={() => router.push("/report")}>
            최종 리포트 보러 가기
          </PrimaryButton>
        ) : null
      }
    >
      {/* 진행 상황 한 줄 요약 */}
      <p className={styles.progress}>
        세 곳 중 <strong>{completed}곳</strong>을 다녀왔어요 · 모은 배지{" "}
        <strong>
          {earnedBadgeCount(results)} / {TOTAL_BADGE_COUNT}
        </strong>
      </p>

      {/* 배지를 못 받은 곳이 있으면 다시 도전하라고 알려줍니다 */}
      {retryList.length > 0 ? (
        <p className={styles.retryNotice}>
          배지 3개를 다 모아야 최종 리포트가 열려요. 아직 배지를 못 받은 곳에
          다시 도전해보세요.
        </p>
      ) : null}

      {/* 위에서 내려다본 병원 조감도 */}
      <HospitalFloorPlan rooms={rooms} onEnterRoom={handleEnterRoom} />
    </AppScreen>
  );
}
