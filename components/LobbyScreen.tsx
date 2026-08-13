"use client";

/**
 * 로비 화면 — 미션을 고르는 곳. 미션이 끝날 때마다 여기로 돌아옵니다.
 *
 * 무엇을 하나:
 *  1. 부서 카드 3개를 보여줍니다 (응급실 / 119 구급차 / 보건실)
 *  2. 끝낸 미션은 배지가 켜집니다
 *  3. 세 미션을 다 끝내면 최종 리포트 버튼이 나타납니다
 *
 * 어떤 데이터를 쓰나:
 *  - data/missions.ts : 부서 이름, 설명, 배지 이름
 *  - lib/badges.ts    : 배지를 받았는지 판정
 *  - lib/session.ts   : 어느 미션을 끝냈는지
 *
 * 감정 톤: 병원에 막 도착한 설렘. 어디로 갈지 고르는 기분.
 *
 * ✅ 코덱스(디자인 담당 AI)에게:
 *    이 화면은 카드 나열 대신 "위에서 내려다본 병원 조감도"로 바꾸는 것을
 *    권장합니다. 부서 세 곳을 건물 안 구역으로 그리고, 끝낸 구역에 불이
 *    들어오는 식이면 좋습니다. 아래 데이터와 판정 함수는 그대로 쓰면 됩니다.
 */

import { useRouter } from "next/navigation";

import { MISSION_LIST } from "@/data/missions";
import { badgeStatuses, earnedBadgeCount, TOTAL_BADGE_COUNT } from "@/lib/badges";
import {
  completedMissionCount,
  isAllMissionsComplete,
  isMissionComplete,
  resultList,
} from "@/lib/session";
import { TOTAL_MISSION_COUNT } from "@/lib/missions";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession } from "./SessionProvider";
import styles from "./LobbyScreen.module.css";

/** 미션마다 다른 색을 쓰기 위한 이름표. 실제 색은 design-tokens.css 에 있습니다. */
const MISSION_TONE: Record<string, string> = {
  er: "urgent",
  ambulance: "focused",
  healthRoom: "warm",
};

export function LobbyScreen() {
  const router = useRouter();
  const session = useRequireSession();

  // 새로고침으로 진행 상황이 사라졌으면 시작 화면으로 되돌아가는 중입니다.
  if (session === null) return null;

  const results = resultList(session);
  const badges = badgeStatuses(results);
  const completed = completedMissionCount(session);
  const allDone = isAllMissionsComplete(session);

  return (
    <AppScreen
      title={`${session.studentName} 간호사님, 어서 오세요`}
      subtitle={`세 곳 중 ${completed}곳을 다녀왔어요`}
      tone="calm"
      footer={
        allDone ? (
          <PrimaryButton fullWidth onClick={() => router.push("/report")}>
            최종 리포트 보러 가기
          </PrimaryButton>
        ) : null
      }
    >
      {/* 배지 진열장 */}
      <section className={styles.badgeShelf} aria-label="모은 배지">
        <p className={styles.badgeTitle}>
          모은 배지 {earnedBadgeCount(results)} / {TOTAL_BADGE_COUNT}
        </p>
        <ul className={styles.badgeList}>
          {badges.map((badge) => (
            <li
              key={badge.missionId}
              className={styles.badge}
              data-earned={badge.earned}
              data-attempted={badge.attempted}
            >
              <span className={styles.badgeIcon} aria-hidden="true">
                {badge.earned ? "★" : "☆"}
              </span>
              <span className={styles.badgeName}>{badge.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 부서 카드 3개 */}
      <ul className={styles.missionGrid}>
        {MISSION_LIST.map((mission) => {
          const done = isMissionComplete(session, mission.id);
          return (
            <li key={mission.id}>
              <button
                type="button"
                className={styles.missionCard}
                data-tone={MISSION_TONE[mission.id]}
                data-done={done}
                onClick={() => router.push(`/mission/${mission.id}`)}
              >
                <span className={styles.missionOrder}>
                  미션 {mission.order} / {TOTAL_MISSION_COUNT}
                </span>
                <span className={styles.missionTitle}>{mission.title}</span>
                <span className={styles.missionSubtitle}>
                  {mission.subtitle}
                </span>
                <span className={styles.missionStatus}>
                  {done ? "✓ 다녀왔어요 · 다시 하기" : "들어가기"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </AppScreen>
  );
}
