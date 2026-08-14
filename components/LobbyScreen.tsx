"use client";

import Image from "next/image";
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
import { TeacherMaterials } from "./TeacherMaterials";
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
  const [coverDismissed, setCoverDismissed] = useState(false);

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

  if (session === null && !coverDismissed) {
    return (
      <main className={styles.careerCover} aria-label="골든타임 진로체험 표지">
        <section className={styles.coverVisual} aria-label="간호사와 응급구조사의 환자 이송 현장">
          <Image
            className={styles.coverImage}
            src="/assets/nurse/career-cover-v2.webp"
            alt="병원 응급실 앞에서 간호사와 응급구조사가 환자를 함께 이송하는 모습"
            fill
            priority
            sizes="(max-width: 720px) 100vw, 48vw"
          />
          <div className={styles.coverShade} />
          <p className={styles.coverSignal}>
            <span>EMERGENCY NETWORK</span>
            <strong>READY</strong>
          </p>
        </section>

        <section className={styles.coverContent}>
          <div className={styles.coverBrand} aria-hidden="true">GT</div>
          <p className={styles.coverEyebrow}>GOLDEN TIME · CAREER EXPERIENCE</p>
          <h1>골든타임을<br />지키는 사람들</h1>
          <p className={styles.coverLead}>
            환자의 가장 가까운 곳에서 관찰하고 판단하고 움직이는 두 직업을 직접 경험하세요.
          </p>

          <div className={styles.careerRoles} aria-label="체험 직업">
            <article>
              <span>01 · NURSE</span>
              <strong>간호사</strong>
              <small>관찰 · 판단 · 처치 · 협업</small>
            </article>
            <article>
              <span>02 · EMT</span>
              <strong>응급구조사</strong>
              <small>현장평가 · 응급처치 · 이송 · 인계</small>
            </article>
          </div>

          <button type="button" className={styles.coverStart} onClick={() => setCoverDismissed(true)}>
            <span>6개의 병원 현장으로</span>
            <strong>미션 시작</strong>
            <i aria-hidden="true">→</i>
          </button>
          <small className={styles.coverNotice}>이름과 난이도는 미션을 선택한 뒤 입력합니다.</small>
        </section>
      </main>
    );
  }

  return (
    <AppScreen
      title="골든타임을 지키는 사람들"
      subtitle="병원 여섯 현장에서 간호사와 응급구조사의 판단을 경험하세요."
      tone="calm"
      compactTitle
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
        <div className={styles.controlActions}>
          <p className={styles.progress}>
            <strong>{completed} / {TOTAL_BADGE_COUNT}</strong>
            <span>COMPLETE</span>
            <small>배지 {earnedBadgeCount(results)}개 획득</small>
          </p>
          <TeacherMaterials />
        </div>
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
