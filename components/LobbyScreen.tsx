"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { DISCLAIMER_SHORT, PRIVACY_NOTICE } from "@/data/disclaimer";
import { MISSION_LIST } from "@/data/missions";
import { STUDENT_NAME_MAX_LENGTH } from "@/data/rules";
import type { Difficulty, MissionId } from "@/data/types";
import { earnedBadgeCount, hasBadge, TOTAL_BADGE_COUNT } from "@/lib/badges";
import { passThreshold } from "@/lib/scoring";
import {
  canOpenReport,
  completedMissionCount,
  isMissionComplete,
  isNameReady,
  missionsToRetry,
  resultList,
} from "@/lib/session";

import { AppScreen } from "./AppScreen";
import { HospitalFloorPlan, type HospitalRoom } from "./HospitalFloorPlan";
import { PrimaryButton } from "./PrimaryButton";
import { useSession } from "./SessionProvider";
import styles from "./LobbyScreen.module.css";

const DIFFICULTY_CHOICES: Array<{
  value: Difficulty;
  label: string;
  description: string;
}> = [
  { value: "elementary", label: "소통 모드", description: "초등 3~6학년" },
  { value: "middle", label: "중등 모드", description: "중학생 · 더 많은 판단 정보" },
];

export function LobbyScreen() {
  const router = useRouter();
  const { session, startSession } = useSession();
  const [pendingMission, setPendingMission] = useState<MissionId | null>(null);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const results = session === null ? [] : resultList(session);
  const rooms: HospitalRoom[] = MISSION_LIST.map((mission) => ({
    missionId: mission.id,
    title: mission.title,
    subtitle: mission.subtitle,
    order: mission.order,
    visited: session === null ? false : isMissionComplete(session, mission.id),
    badgeEarned: session === null ? false : hasBadge(results, mission.id),
  }));

  const handleEnterRoom = useCallback((missionId: MissionId) => {
    if (session === null) {
      setPendingMission(missionId);
      return;
    }
    router.push(`/mission/${missionId}`);
  }, [router, session]);

  function handleCheckIn() {
    if (pendingMission === null || difficulty === null || !isNameReady(name)) return;
    startSession(name, difficulty);
    router.push(`/mission/${pendingMission}`);
  }

  const completed = session === null ? 0 : completedMissionCount(session);
  const reportReady = session !== null && canOpenReport(session);
  const retryList = session === null ? [] : missionsToRetry(session);
  const canCheckIn = difficulty !== null && isNameReady(name);

  return (
    <AppScreen
      title="오늘의 간호 미션"
      subtitle="병원 여섯 현장에서 간호사의 판단과 행동을 경험하세요."
      tone="calm"
      footer={
        reportReady ? (
          <PrimaryButton fullWidth onClick={() => router.push("/report")}>
            최종 리포트 보러 가기
          </PrimaryButton>
        ) : null
      }
    >
      <div className={styles.controlBar}>
        <p className={styles.operator}>
          <span>ACTIVE OPERATOR</span>
          <strong>{session === null ? "미션을 선택하세요" : `${session.studentName} 간호사`}</strong>
        </p>
        <p className={styles.progress}>
          <strong>{completed} / {TOTAL_BADGE_COUNT}</strong>
          <span>COMPLETE</span>
          <small>배지 {earnedBadgeCount(results)}개 획득</small>
        </p>
      </div>

      {retryList.length > 0 ? (
        <p className={styles.retryNotice}>
          배지 {TOTAL_BADGE_COUNT}개를 모두 모아야 최종 리포트가 열려요. 아직 배지를 못 받은 곳에 다시 도전해보세요.
        </p>
      ) : null}

      <HospitalFloorPlan rooms={rooms} onEnterRoom={handleEnterRoom} />

      {pendingMission !== null ? (
        <div className={styles.checkInBackdrop} role="presentation" onMouseDown={() => setPendingMission(null)}>
          <section
            className={styles.checkIn}
            role="dialog"
            aria-modal="true"
            aria-labelledby="check-in-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.checkInHeader}>
              <div>
                <span>MISSION CHECK-IN</span>
                <h2 id="check-in-title">출동 정보를 입력하세요</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setPendingMission(null)} aria-label="닫기">
                ×
              </button>
            </div>

            <label className={styles.inputLabel} htmlFor="student-name">이름</label>
            <input
              id="student-name"
              className={styles.nameInput}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={STUDENT_NAME_MAX_LENGTH}
              placeholder="수료증에 표시할 이름"
              autoComplete="off"
              autoFocus
            />
            <p className={styles.privacy}>{PRIVACY_NOTICE}</p>

            <p className={styles.inputLabel}>난이도</p>
            <div className={styles.difficultyGrid}>
              {DIFFICULTY_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  className={styles.difficultyButton}
                  data-selected={difficulty === choice.value}
                  aria-pressed={difficulty === choice.value}
                  onClick={() => setDifficulty(choice.value)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.description}</span>
                  <small>통과 기준 {passThreshold(choice.value)}%</small>
                </button>
              ))}
            </div>

            <p className={styles.disclaimer}>{DISCLAIMER_SHORT}</p>
            <PrimaryButton fullWidth disabled={!canCheckIn} onClick={handleCheckIn}>
              선택한 미션 시작
            </PrimaryButton>
          </section>
        </div>
      ) : null}
    </AppScreen>
  );
}
