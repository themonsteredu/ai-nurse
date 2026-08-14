"use client";

/**
 * 미션 1 — 응급실 : 누구부터 살릴 것인가.
 *
 * 무엇을 하나:
 *   환자 한 명씩 카드로 보여주고, 학생이 색깔 구역으로 분류합니다.
 *   놓을 때마다 바로 해설 카드가 뜨고, 다 끝나면 결과를 보여줍니다.
 *
 * 화면 순서:
 *   ① 브리핑 (임무 설명 + 시작 버튼)
 *   ② 분류 진행 (환자 카드 + 구역들)
 *   ③ 결과 (정확도 + 틀린 환자 다시 보기)
 *
 * 조작 방법 (둘 다 됩니다):
 *   1) 카드를 구역으로 끌어다 놓기
 *   2) 구역을 그냥 누르기 — 드래그가 어려운 학생을 위한 방법
 *
 * 어떤 데이터를 쓰나:
 *   - data/triage-patients.ts : 환자 카드와 정답 (난이도별로 6명 / 10명)
 *   - data/triage-zones.ts    : 색깔 구역 (난이도별로 4개 / 5개)
 *   - lib/triage.ts           : 채점, 제한시간
 *   - lib/scoring.ts          : 정확도 계산, 통과 판정
 *
 * ⚠️ 이 파일에는 정답도, 기준 숫자도 없습니다. 전부 위에서 가져다 씁니다.
 *
 * 감정 톤: 긴박함. 환자가 밀려들고 시간이 없는 느낌.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일의 생김새를 마음껏 바꿔도 됩니다.
 *    ⚠️ 다만 아래 두 가지는 꼭 지켜주세요.
 *       - 드래그와 "구역 누르기" 두 방법 모두 남길 것
 *       - 틀린 직후 해설 카드가 바로 뜰 것 (기획서 요구사항)
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { MISSIONS } from "@/data/missions";
import { getTriagePatients } from "@/data/triage-patients";
import { getTriageZones, TRIAGE_ZONES } from "@/data/triage-zones";
import type { TriageLevel } from "@/data/types";
import { buildMissionResult, passThreshold } from "@/lib/scoring";
import {
  createEmptyPlacements,
  scoreTriage,
  triageTimeLimitMs,
  wrongPlacements,
  type TriagePlacements,
} from "@/lib/triage";

import { AppScreen } from "./AppScreen";
import { ExplanationCard } from "./ExplanationCard";
import { MissionTimer } from "./MissionTimer";
import { PrimaryButton } from "./PrimaryButton";
import { TriagePatientCard } from "./TriagePatientCard";
import { TriageZoneDropArea } from "./TriageZoneDropArea";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./TriageMissionScreen.module.css";

/** 화면 진행 단계 */
type Phase = "briefing" | "playing" | "finished";

/** 방금 놓은 결과 (해설 카드에 넘길 정보) */
type Feedback = {
  patientId: string;
  chosenZone: TriageLevel;
  correctZone: TriageLevel;
  correct: boolean;
};

/** 끌고 있는 카드의 위치 정보 */
type DragState = {
  pointerId: number;
  left: number;
  top: number;
  width: number;
  /**
   * 끌기 시작한 순간의 카드 높이.
   * 카드가 화면에서 떠오르면 그 자리가 비는데, 딱 이 높이만큼 빈 자리를 채워서
   * 아래 구역들이 위로 뛰어오르지 않게 합니다.
   * (높이를 고정값으로 두면 디자인이 바뀔 때 구역이 움직여 드래그가 빗나갑니다)
   */
  height: number;
  offsetX: number;
  offsetY: number;
};

/** 타이머를 얼마나 자주 갱신할지 (밀리초) */
const TIMER_TICK_MS = 200;

export function TriageMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();

  const difficulty = session?.difficulty ?? "elementary";

  const patients = useMemo(
    () => getTriagePatients(difficulty),
    [difficulty],
  );
  const zones = useMemo(() => getTriageZones(difficulty), [difficulty]);
  const timeLimitMs = useMemo(
    () => triageTimeLimitMs(difficulty),
    [difficulty],
  );
  const showVitals = difficulty === "middle";

  const [phase, setPhase] = useState<Phase>("briefing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placements, setPlacements] = useState<TriagePlacements>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredZone, setHoveredZone] = useState<TriageLevel | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [phase]);

  /** 구역들의 화면 위치. 끌어다 놓기를 판정할 때 씁니다. */
  const zoneElements = useRef(new Map<TriageLevel, HTMLElement>());
  /** 매우 빠른 포인터 이동도 놓치지 않도록 최신 드래그 위치를 즉시 보관합니다. */
  const dragRef = useRef<DragState | null>(null);

  const registerZoneElement = useCallback(
    (level: TriageLevel, element: HTMLElement | null) => {
      if (element) zoneElements.current.set(level, element);
      else zoneElements.current.delete(level);
    },
    [],
  );

  const currentPatient = patients[currentIndex];
  const isLastPatient = currentIndex >= patients.length - 1;

  /* ---------------- 제한시간 ---------------- */

  // 해설 카드를 읽는 동안에는 시계가 멈춥니다.
  // 읽는 시간 때문에 점수가 깎이면 안 되기 때문입니다.
  const timerRunning =
    phase === "playing" && feedback === null && timeLimitMs !== null;

  useEffect(() => {
    if (!timerRunning) return;

    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      setElapsedMs((current) => current + delta);
    }, TIMER_TICK_MS);

    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const remainingMs =
    timeLimitMs === null ? null : Math.max(0, timeLimitMs - elapsedMs);
  const timeUp = remainingMs !== null && remainingMs <= 0;

  // 시간이 다 되면 그때까지 놓은 것만으로 채점합니다.
  useEffect(() => {
    if (phase === "playing" && timeUp) {
      setFeedback(null);
      setPhase("finished");
    }
  }, [phase, timeUp]);

  /* ---------------- 환자 놓기 ---------------- */

  const placeCurrentPatient = useCallback(
    (zone: TriageLevel) => {
      if (phase !== "playing" || feedback !== null || !currentPatient) return;

      setPlacements((current) => ({ ...current, [currentPatient.id]: zone }));
      setFeedback({
        patientId: currentPatient.id,
        chosenZone: zone,
        correctZone: currentPatient.correctZone,
        correct: zone === currentPatient.correctZone,
      });
    },
    [phase, feedback, currentPatient],
  );

  /** 해설 카드를 닫고 다음 환자로 넘어갑니다. */
  function handleNextPatient() {
    setFeedback(null);
    if (isLastPatient) setPhase("finished");
    else setCurrentIndex((index) => index + 1);
  }

  /* ---------------- 카드 끌기 ---------------- */

  /** 화면의 이 지점에 어느 구역이 있는지 찾습니다. */
  const zoneAtPoint = useCallback(
    (x: number, y: number): TriageLevel | null => {
      for (const [level, element] of zoneElements.current) {
        const rect = element.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          return level;
        }
      }
      return null;
    },
    [],
  );

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (phase !== "playing" || feedback !== null) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    element.setPointerCapture(event.pointerId);

    const nextDrag = {
      pointerId: event.pointerId,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function handleDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    if (current === null || event.pointerId !== current.pointerId) return;

    const nextDrag = {
      ...current,
      left: event.clientX - current.offsetX,
      top: event.clientY - current.offsetY,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
    setHoveredZone(zoneAtPoint(event.clientX, event.clientY));
  }

  function handleDragEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    if (current === null || event.pointerId !== current.pointerId) return;

    const dropped = zoneAtPoint(event.clientX, event.clientY);
    dragRef.current = null;
    setDrag(null);
    setHoveredZone(null);
    if (dropped) placeCurrentPatient(dropped);
  }

  /* ---------------- 결과 ---------------- */

  const tally = useMemo(
    () => scoreTriage(placements, patients),
    [placements, patients],
  );
  const missionResult = useMemo(
    () => buildMissionResult("er", tally, difficulty),
    [tally, difficulty],
  );
  const wrongList = useMemo(
    () => wrongPlacements(placements, patients),
    [placements, patients],
  );

  function handleFinish() {
    saveMissionResult(missionResult);
    router.push("/unlock/er");
  }

  function handleStart() {
    setPlacements(createEmptyPlacements(patients));
    setCurrentIndex(0);
    setElapsedMs(0);
    setFeedback(null);
    setPhase("playing");
  }

  // 새로고침으로 진행 상황이 사라졌으면 시작 화면으로 되돌아가는 중입니다.
  if (session === null) return null;

  const mission = MISSIONS.er;

  /* ---------------- ① 브리핑 ---------------- */

  if (phase === "briefing") {
    return (
      <AppScreen title={mission.title} subtitle={mission.subtitle} tone="urgent">
        <div className={styles.briefing}>
          <section className={styles.briefingScene} aria-label="응급실 중증도 분류 훈련 장면">
            <Image
              className={styles.briefingImage}
              src="/assets/nurse/triage-briefing-v2.webp"
              alt="응급실에서 간호사가 환자 상태를 확인하고 응급구조사에게 환자를 인계받는 훈련 장면"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 760px"
            />
            <p className={styles.briefingSceneLabel}>
              <span>TRIAGE INTAKE</span>
              <strong>관찰 · 우선순위 · 인계</strong>
            </p>
          </section>

          <p className={styles.briefingText}>{mission.briefing}</p>

          <ul className={styles.briefingFacts}>
            <li>
              <span>분류 대상</span>
              <strong>{patients.length}<small>명</small></strong>
            </li>
            <li>
              <span>중증도 구역</span>
              <strong>{zones.length}<small>개</small></strong>
            </li>
            <li>
              <span>제한 시간</span>
              <strong>
                {timeLimitMs === null ? "없음" : Math.round(timeLimitMs / 60000)}
                {timeLimitMs === null ? null : <small>분</small>}
              </strong>
            </li>
            <li>
              <span>통과 기준</span>
              <strong>{passThreshold(difficulty)}<small>%</small></strong>
            </li>
          </ul>

          <p className={styles.briefingNote}>
            틀려도 괜찮아요. 틀리는 게 오늘 수업의 목적이에요.
          </p>

          <PrimaryButton fullWidth onClick={handleStart}>
            환자 받기 시작
          </PrimaryButton>
        </div>
      </AppScreen>
    );
  }

  /* ---------------- ③ 결과 ---------------- */

  if (phase === "finished") {
    return (
      <AppScreen
        title="분류를 마쳤어요"
        subtitle={timeUp ? "시간이 다 되었어요" : undefined}
        tone="urgent"
        footer={
          <PrimaryButton fullWidth onClick={handleFinish}>
            통과 코드 입력하러 가기
          </PrimaryButton>
        }
      >
        <div className={styles.result}>
          <section
            className={styles.scoreCard}
            data-passed={missionResult.passed}
          >
            <p className={styles.scoreValue}>
              {missionResult.accuracyPercent}%
            </p>
            <p className={styles.scoreDetail}>
              {patients.length}명 중 {tally.correct}명을 맞게 분류했어요
            </p>
            <p className={styles.scoreBadge}>
              {missionResult.passed
                ? `${mission.badgeName} 획득`
                : `${passThreshold(difficulty)}% 이상이면 배지를 받아요`}
            </p>
          </section>

          {wrongList.length > 0 ? (
            <section className={styles.wrongSection}>
              <h2 className={styles.wrongTitle}>
                다시 볼 환자 {wrongList.length}명
              </h2>
              <ul className={styles.wrongList}>
                {wrongList.map((patient) => {
                  const chosen = placements[patient.id];
                  return (
                    <li key={patient.id} className={styles.wrongItem}>
                      <p className={styles.wrongPatient}>
                        {patient.order}번 {patient.name}
                      </p>
                      <p className={styles.wrongZones}>
                        {chosen
                          ? `${TRIAGE_ZONES[chosen].label} → `
                          : "못 놓음 → "}
                        <strong>
                          {TRIAGE_ZONES[patient.correctZone].label}
                        </strong>
                      </p>
                      <p className={styles.wrongExplanation}>
                        {patient.explanation}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <p className={styles.allCorrect}>
              모든 환자의 우선순위를 정확히 판단했습니다.
            </p>
          )}
        </div>
      </AppScreen>
    );
  }

  /* ---------------- ② 분류 진행 ---------------- */

  return (
    <AppScreen
      title={mission.title}
      subtitle="골든타임 안에 환자의 상태를 판단하세요."
      tone="urgent"
    >
      <div className={styles.play}>
        {/* 진행 상황과 시계 */}
        <div className={styles.statusBar}>
          <p className={styles.progress}>
            <span>PATIENT</span>
            <strong>{String(currentIndex + 1).padStart(2, "0")}</strong>
            <span>/ {String(patients.length).padStart(2, "0")}</span>
          </p>
          {remainingMs !== null && timeLimitMs !== null ? (
            <MissionTimer
              remainingMs={remainingMs}
              totalMs={timeLimitMs}
              paused={feedback !== null}
            />
          ) : null}
        </div>

        {/* 지금 분류할 환자 */}
        {currentPatient ? (
          <div className={styles.cardArea}>
            {/*
              카드를 끌고 있는 동안 그 자리를 똑같은 높이로 채워둡니다.
              이게 없으면 아래 구역들이 위로 뛰어올라, 학생이 겨냥한 구역이
              손가락 밑에서 도망갑니다.
            */}
            {drag !== null ? (
              <div className={styles.cardSpacer} style={{ height: drag.height }} />
            ) : null}
            <TriagePatientCard
              patient={currentPatient}
              showVitals={showVitals}
              draggable={feedback === null}
              dragging={drag !== null}
              dragStyle={
                drag === null
                  ? undefined
                  : { left: drag.left, top: drag.top, width: drag.width }
              }
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
            />
          </div>
        ) : null}

        <section className={styles.actionSection} aria-labelledby="priority-action-title">
          <div className={styles.actionHeader}>
            <div>
              <span>PRIORITY ACTION</span>
              <h2 id="priority-action-title">가장 먼저 배정할 우선순위를 선택하세요.</h2>
            </div>
            <p>환자 상태와 활력징후를 근거로 판단하세요.</p>
          </div>

          <div className={styles.zoneRow}>
            {zones.map((zone) => (
              <TriageZoneDropArea
                key={zone.level}
                zone={zone}
                placedCount={
                  Object.values(placements).filter((value) => value === zone.level)
                    .length
                }
                isDropTarget={hoveredZone === zone.level}
                disabled={feedback !== null}
                onSelect={placeCurrentPatient}
                registerElement={registerZoneElement}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 놓은 직후 바로 뜨는 해설 카드 */}
      {feedback && currentPatient ? (
        <ExplanationCard
          correct={feedback.correct}
          chosenZone={feedback.chosenZone}
          correctZone={feedback.correctZone}
          patientName={`${currentPatient.order}번 ${currentPatient.name}`}
          explanation={currentPatient.explanation}
          isLast={isLastPatient}
          onNext={handleNextPatient}
        />
      ) : null}
    </AppScreen>
  );
}
