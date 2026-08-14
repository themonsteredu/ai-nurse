"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { getIcuRounds, type IcuPatient } from "@/data/specialty-missions";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./IcuMissionScreen.module.css";

function interpolate(start: number, end: number, progress: number) {
  return Math.round(start + (end - start) * progress);
}

function baselineFor(value: number, normal: number, low: number, high: number) {
  return value < low || value > high ? normal : value;
}

type VitalKey = "heartRate" | "spo2" | "resp" | "bloodPressure";

const VITAL_LABELS: Record<VitalKey, string> = {
  heartRate: "맥박",
  spo2: "산소포화도",
  resp: "호흡",
  bloodPressure: "혈압",
};

function getAbnormalVitals(patient: IcuPatient): VitalKey[] {
  const [systolic] = patient.bloodPressure.split("/").map(Number);
  const abnormal: VitalKey[] = [];
  if (patient.heartRate < 55 || patient.heartRate > 110) abnormal.push("heartRate");
  if (patient.spo2 < 92) abnormal.push("spo2");
  if (patient.resp < 10 || patient.resp > 28) abnormal.push("resp");
  if (systolic < 90) abnormal.push("bloodPressure");
  return abnormal;
}

function vitalValue(patient: IcuPatient, vital: VitalKey) {
  if (vital === "heartRate") return `${patient.heartRate}회`;
  if (vital === "spo2") return `${patient.spo2}%`;
  if (vital === "resp") return `${patient.resp}회`;
  return patient.bloodPressure;
}

function TrendScrubber({ progress, completed, onProgress, onComplete }: {
  progress: number;
  completed: boolean;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}) {
  const draggingRef = useRef(false);
  const progressRef = useRef(progress);

  function update(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0, Math.min(1, (event.clientX - rect.left - 28) / (rect.width - 56)));
    progressRef.current = next;
    onProgress(next);
  }

  function finish() {
    draggingRef.current = false;
    if (progressRef.current >= 0.86) {
      progressRef.current = 1;
      onProgress(1);
      onComplete();
    } else if (!completed) {
      progressRef.current = 0;
      onProgress(0);
    }
  }

  return (
    <button
      type="button"
      className={styles.trendScrubber}
      data-complete={completed}
      aria-label={completed ? "10초 모니터 추세 확인 완료" : "손잡이를 오른쪽으로 밀어 10초 모니터 추세 재생"}
      onPointerDown={(event) => {
        if (completed) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        draggingRef.current = true;
        update(event);
      }}
      onPointerMove={(event) => { if (draggingRef.current) update(event); }}
      onPointerUp={finish}
      onPointerCancel={() => { draggingRef.current = false; if (!completed) { progressRef.current = 0; onProgress(0); } }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !completed) {
          event.preventDefault();
          progressRef.current = 1;
          onProgress(1);
          onComplete();
        }
      }}
    >
      <span className={styles.trendRail}><i style={{ width: `${progress * 100}%` }} /></span>
      <span className={styles.trendHandle} style={{ left: `calc(${progress * 100}% - ${progress * 56}px)` }}>▶</span>
      <span className={styles.trendStart}>10초 전</span>
      <strong>{completed ? "현재 변화 확인 완료" : "오른쪽으로 밀어 추세 재생"}</strong>
      <span className={styles.trendNow}>현재</span>
    </button>
  );
}

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
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !inactive && !completed) {
          event.preventDefault();
          progressRef.current = 1;
          setProgress(1);
          onComplete();
        }
      }}
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
  const [trendProgress, setTrendProgress] = useState(0);
  const [trendReviewed, setTrendReviewed] = useState(false);
  const [selectedSignals, setSelectedSignals] = useState<VitalKey[]>([]);

  if (session === null) return null;

  const difficulty = session.difficulty;
  const rounds = getIcuRounds(difficulty);
  const round = rounds[roundIndex];
  const selectedPatient = round.patients.find((patient) => patient.id === selectedPatientId);
  const requiredSignals = difficulty === "middle" ? 2 : 1;
  const abnormalSignals = selectedPatient ? getAbnormalVitals(selectedPatient) : [];
  const evidenceReady = selectedSignals.length === requiredSignals;
  const isCorrect = selectedPatientId === round.urgentPatientId
    && evidenceReady
    && selectedSignals.every((signal) => abnormalSignals.includes(signal));

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
    setTrendProgress(0);
    setTrendReviewed(false);
    setSelectedSignals([]);
  }

  function toggleSignal(signal: VitalKey) {
    if (resolved || !selectedPatient) return;
    setSelectedSignals((current) => {
      if (current.includes(signal)) return current.filter((candidate) => candidate !== signal);
      if (current.length >= requiredSignals) return current;
      return [...current, signal];
    });
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
              <p>세 모니터를 비교하고 환자 선택과 위험 근거를 함께 제출하세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>라운드</span><strong>{rounds.length}번의 상태 변화</strong></p>
            <p><span>판단</span><strong>환자 + 위험 근거 {requiredSignals}개</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>모니터링 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="중환자실 모니터 관찰 활동">
          <div className={styles.roundHeader}>
            <p><span>LIVE ROUND</span><strong>{String(roundIndex + 1).padStart(2, "0")} / {String(rounds.length).padStart(2, "0")}</strong></p>
            <p className={styles.situation}>{round.situation} 추세를 재생해 변화를 찾으세요.</p>
          </div>

          <div className={styles.trendPanel}>
            <p><span>STEP 01 · TREND REPLAY</span><strong>10초 전 수치가 현재까지 어떻게 변했는지 직접 재생하세요.</strong></p>
            <TrendScrubber
              key={round.id}
              progress={trendProgress}
              completed={trendReviewed}
              onProgress={setTrendProgress}
              onComplete={() => setTrendReviewed(true)}
            />
          </div>

          <div className={styles.monitorStage}>
            <Image
              className={styles.stageImage}
              src="/assets/nurse/icu-room-v1.webp"
              alt="환자와 모니터가 있는 중환자실"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1180px"
              style={{
                transform: `scale(${1.02 + trendProgress * 0.045}) translate3d(${-8 * trendProgress}px, ${3 * trendProgress}px, 0)`,
                filter: `brightness(${0.94 + trendProgress * 0.08}) saturate(${0.9 + trendProgress * 0.18})`,
              }}
            />
            <div className={styles.stageShade} />
            <div className={styles.replayHud} data-active={trendProgress > 0} data-complete={trendReviewed} aria-hidden="true">
              <p><span>MONITOR REPLAY</span><strong>{String(Math.round(trendProgress * 10)).padStart(2, "0")}.0s</strong></p>
              <div className={styles.replayTrack}>
                <i style={{ width: `${trendProgress * 100}%` }} />
                <b style={{ left: `calc(${trendProgress * 100}% - ${trendProgress * 10}px)` }} />
              </div>
              <small>{trendReviewed ? "LIVE FEED CONNECTED" : trendProgress > 0 ? "PATIENT CHANGE DETECTING" : "10 SECONDS AGO"}</small>
            </div>
            <div className={styles.monitorBank}>
              {round.patients.map((patient) => {
                const selected = selectedPatientId === patient.id;
                const urgent = resolved && patient.id === round.urgentPatientId;
                const [systolic, diastolic] = patient.bloodPressure.split("/").map(Number);
                const displayHeartRate = interpolate(
                  baselineFor(patient.heartRate, 82, 55, 110),
                  patient.heartRate,
                  trendProgress,
                );
                const displaySpo2 = interpolate(
                  baselineFor(patient.spo2, 97, 94, 101),
                  patient.spo2,
                  trendProgress,
                );
                const displayResp = interpolate(
                  baselineFor(patient.resp, 16, 10, 26),
                  patient.resp,
                  trendProgress,
                );
                const displaySystolic = interpolate(
                  baselineFor(systolic, 118, 90, 141),
                  systolic,
                  trendProgress,
                );
                const displayDiastolic = interpolate(
                  baselineFor(diastolic, 72, 55, 91),
                  diastolic,
                  trendProgress,
                );
                return (
                  <button
                    key={patient.id}
                    type="button"
                    className={styles.monitor}
                    data-selected={selected}
                    data-urgent={urgent}
                    data-changing={trendProgress > 0 && !trendReviewed}
                    disabled={resolved || !trendReviewed}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedSignals([]);
                    }}
                  >
                    <span className={styles.bed}>{patient.bed}</span>
                    <span className={styles.patientName}>{patient.label}</span>
                    <svg className={styles.wave} viewBox="0 0 240 54" aria-hidden="true">
                      <g
                        className={styles.waveStream}
                        style={{ animationDuration: `${Math.max(0.42, Math.min(1.35, 60 / displayHeartRate))}s` }}
                      >
                        <path d="M0 30h32l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h40" />
                        <path d="M0 30h32l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h31l7-2 6-22 8 43 9-19h40" transform="translate(240 0)" />
                      </g>
                      <line
                        className={styles.waveCursor}
                        x1="0"
                        y1="7"
                        x2="0"
                        y2="48"
                        style={{ animationDuration: `${Math.max(0.42, Math.min(1.35, 60 / displayHeartRate))}s` }}
                      />
                    </svg>
                    <dl className={styles.vitals}>
                      <div data-alert={displayHeartRate < 55 || displayHeartRate > 110}><dt>HR</dt><dd>{displayHeartRate}</dd></div>
                      <div data-alert={displaySpo2 < 92}><dt>SpO₂</dt><dd>{displaySpo2}%</dd></div>
                      <div data-alert={displayResp < 10 || displayResp > 28}><dt>RESP</dt><dd>{displayResp}</dd></div>
                      <div data-alert={displaySystolic < 90}><dt>BP</dt><dd>{displaySystolic}/{displayDiastolic}</dd></div>
                    </dl>
                    <span className={styles.monitorStatus}>{trendReviewed ? patient.status : trendProgress > 0 ? "추세 재생 중" : "10초 전 기준"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className={styles.evidencePanel} data-ready={selectedPatient !== undefined} aria-label="우선 대응 근거 선택">
            <div className={styles.evidenceCopy}>
              <span>STEP 03 · CLINICAL EVIDENCE</span>
              <strong>{selectedPatient
                ? `${selectedPatient.bed}에서 위험한 수치 ${requiredSignals}개를 고르세요.`
                : "환자를 선택하면 활력징후 근거가 열립니다."}</strong>
              <small>{selectedSignals.length} / {requiredSignals} 선택</small>
            </div>
            <div className={styles.evidenceGrid}>
              {(["heartRate", "spo2", "resp", "bloodPressure"] as VitalKey[]).map((vital) => (
                <button
                  key={vital}
                  type="button"
                  disabled={!selectedPatient || resolved}
                  data-selected={selectedSignals.includes(vital)}
                  onClick={() => toggleSignal(vital)}
                >
                  <span>{VITAL_LABELS[vital]}</span>
                  <strong>{selectedPatient ? vitalValue(selectedPatient, vital) : "—"}</strong>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.responsePanel}>
            <div className={styles.selectionCopy}>
              <span>PRIORITY RESPONSE</span>
              <strong>{!trendReviewed
                ? "먼저 10초 추세를 끝까지 재생하세요"
                : selectedPatient && !evidenceReady
                  ? `위험 근거를 ${requiredSignals - selectedSignals.length}개 더 선택하세요`
                  : selectedPatient
                    ? `${selectedPatient.bed} ${selectedPatient.label} · 근거 확인 완료`
                  : "가장 먼저 확인할 모니터를 선택하세요"}</strong>
            </div>
            <SwipeResponder
              key={round.id}
              inactive={!trendReviewed || selectedPatientId === null || !evidenceReady}
              completed={resolved}
              onComplete={handleRespond}
            />
          </div>

          {resolved ? (
            <div className={styles.feedback} data-correct={isCorrect} role="status">
              <div>
                <span>{isCorrect ? "PRIORITY CONFIRMED" : "RECHECK THE TREND"}</span>
                <strong>{isCorrect
                  ? "환자와 위험 근거를 모두 정확히 찾았습니다."
                  : selectedPatientId === round.urgentPatientId
                    ? "환자는 맞지만 선택한 활력징후 근거를 다시 확인하세요."
                    : "가장 급한 변화가 다른 모니터에 있습니다."}</strong>
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
