"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { getIcuRounds } from "@/data/specialty-missions";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./IcuMissionScreen.module.css";

function SwipeResponder({ inactive, completed, onComplete }: {
  inactive: boolean;
  completed: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const draggingRef = useRef(false);
  const progressRef = useRef(0);

  function updateProgress(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0, Math.min(1, (event.clientX - rect.left - 34) / (rect.width - 68)));
    progressRef.current = next;
    setProgress(next);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (inactive || completed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    updateProgress(event);
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (progressRef.current >= 0.72) {
      progressRef.current = 1;
      setProgress(1);
      onComplete();
    } else {
      progressRef.current = 0;
      setProgress(0);
    }
  }

  return (
    <button
      type="button"
      className={styles.swipe}
      disabled={inactive || completed}
      aria-label="오른쪽으로 밀어 즉시 대응"
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => { if (draggingRef.current) updateProgress(event); }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { draggingRef.current = false; progressRef.current = 0; setProgress(0); }}
    >
      <span className={styles.swipeFill} style={{ width: `${progress * 100}%` }} />
      <i
        className={styles.swipeHandle}
        style={{ left: `calc(${progress * 100}% - ${progress * 68}px + 8px)` }}
      >→</i>
      <strong>{completed ? "대응 완료" : inactive ? "먼저 모니터를 선택하세요" : "오른쪽으로 밀어 즉시 대응"}</strong>
    </button>
  );
}

export function IcuMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();
  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [resolved, setResolved] = useState(false);

  if (session === null) return null;

  const difficulty = session.difficulty;
  const rounds = getIcuRounds(difficulty);
  const round = rounds[roundIndex];
  const selectedPatient = round.patients.find((patient) => patient.id === selectedPatientId);
  const isCorrect = selectedPatientId === round.urgentPatientId;

  function handleRespond() {
    if (selectedPatientId === null || resolved) return;
    setAnswers((current) => [...current, isCorrect]);
    setResolved(true);
  }

  function handleNext() {
    if (roundIndex === rounds.length - 1) {
      saveMissionResult(buildMissionResult(
        "icu",
        { correct: answers.filter(Boolean).length, total: rounds.length },
        difficulty,
      ));
      router.push("/unlock/icu");
      return;
    }
    setRoundIndex((current) => current + 1);
    setSelectedPatientId(null);
    setResolved(false);
  }

  return (
    <AppScreen title="중환자실" subtitle="모니터의 변화를 읽어라" tone="critical">
      {!started ? (
        <section className={styles.briefing}>
          <div className={styles.hero}>
            <Image
              className={styles.heroImage}
              src="/assets/nurse/icu-room-v1.webp"
              alt="중환자실 간호사가 환자 모니터를 집중해서 확인하는 장면"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1180px"
            />
            <div className={styles.heroShade} />
            <div className={styles.heroCopy}>
              <span>MISSION 05 · INTENSIVE CARE</span>
              <strong>변화는 숫자보다<br />먼저 신호를 보냅니다</strong>
              <p>세 모니터를 비교하고 가장 먼저 확인할 환자를 찾으세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>라운드</span><strong>{rounds.length}번의 상태 변화</strong></p>
            <p><span>조작</span><strong>모니터 선택 + 스와이프</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>모니터링 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="중환자실 모니터 관찰 활동">
          <div className={styles.roundHeader}>
            <p><span>LIVE ROUND</span><strong>{String(roundIndex + 1).padStart(2, "0")} / {String(rounds.length).padStart(2, "0")}</strong></p>
            <p className={styles.situation}>{round.situation}</p>
          </div>

          <div className={styles.monitorStage}>
            <Image
              className={styles.stageImage}
              src="/assets/nurse/icu-room-v1.webp"
              alt="환자와 모니터가 있는 중환자실"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1180px"
            />
            <div className={styles.stageShade} />
            <div className={styles.monitorBank}>
              {round.patients.map((patient) => {
                const selected = selectedPatientId === patient.id;
                const urgent = resolved && patient.id === round.urgentPatientId;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    className={styles.monitor}
                    data-selected={selected}
                    data-urgent={urgent}
                    disabled={resolved}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <span className={styles.bed}>{patient.bed}</span>
                    <span className={styles.patientName}>{patient.label}</span>
                    <svg className={styles.wave} viewBox="0 0 240 54" aria-hidden="true">
                      <path d="M0 30h32l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h40" />
                    </svg>
                    <dl className={styles.vitals}>
                      <div><dt>HR</dt><dd>{patient.heartRate}</dd></div>
                      <div data-alert={patient.spo2 < 92}><dt>SpO₂</dt><dd>{patient.spo2}%</dd></div>
                      <div data-alert={patient.resp < 10 || patient.resp > 28}><dt>RESP</dt><dd>{patient.resp}</dd></div>
                      <div data-alert={Number(patient.bloodPressure.split("/")[0]) < 90}><dt>BP</dt><dd>{patient.bloodPressure}</dd></div>
                    </dl>
                    <span className={styles.monitorStatus}>{patient.status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.responsePanel}>
            <div className={styles.selectionCopy}>
              <span>PRIORITY RESPONSE</span>
              <strong>{selectedPatient ? `${selectedPatient.bed} ${selectedPatient.label} 환자` : "먼저 확인할 모니터를 선택하세요"}</strong>
            </div>
            <SwipeResponder
              key={round.id}
              inactive={selectedPatientId === null}
              completed={resolved}
              onComplete={handleRespond}
            />
          </div>

          {resolved ? (
            <div className={styles.feedback} data-correct={isCorrect} role="status">
              <div>
                <span>{isCorrect ? "PRIORITY CONFIRMED" : "RECHECK THE TREND"}</span>
                <strong>{isCorrect ? "위험 신호를 정확히 찾았습니다." : "가장 급한 변화가 다른 모니터에 있습니다."}</strong>
                <p>{round.explanation}</p>
                <small>간호사의 판단 · {round.response}</small>
              </div>
              <PrimaryButton onClick={handleNext}>{roundIndex === rounds.length - 1 ? "결과 확인" : "다음 모니터"}</PrimaryButton>
            </div>
          ) : null}
        </section>
      )}
    </AppScreen>
  );
}
