"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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
type ResponseActionId = "airway" | "recheck" | "conscious" | "temperature";
type ResponseState = "idle" | "declining" | "recovering";

const RESPONSE_ACTIONS: Array<{ id: ResponseActionId; label: string; caption: string }> = [
  { id: "airway", label: "기도·산소 장비 확인", caption: "호흡음과 산소 연결 상태를 직접 확인" },
  { id: "recheck", label: "혈압 다시 측정", caption: "커프 위치를 확인하고 수동으로 재측정" },
  { id: "conscious", label: "의식·맥박 확인", caption: "환자를 부르고 맥박을 직접 촉지" },
  { id: "temperature", label: "체온 먼저 확인", caption: "체온 변화 여부를 우선 확인" },
];

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

function recommendedAction(patient: IcuPatient): ResponseActionId {
  const [systolic] = patient.bloodPressure.split("/").map(Number);
  if (patient.heartRate < 55) return "conscious";
  if (patient.spo2 < 92 || patient.resp < 10 || patient.resp > 28) return "airway";
  if (systolic < 90) return "recheck";
  return "conscious";
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
      <span className={styles.trendRail}>
        <i style={{ width: `${progress * 100}%` }} />
        <b style={{ left: `calc(${progress * 100}% - ${progress * 20}px)` }} />
      </span>
      <span className={styles.visuallyHidden}>
        {completed ? "현재 변화 확인 완료" : "오른쪽으로 밀어 10초 추세 재생"}
      </span>
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
  const [observedPatientId, setObservedPatientId] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<ResponseState>("idle");
  const [responseProgress, setResponseProgress] = useState(0);
  const [attemptRecorded, setAttemptRecorded] = useState(false);

  const difficulty = session?.difficulty ?? "elementary";
  const rounds = getIcuRounds(difficulty);
  const round = rounds[roundIndex];
  const selectedPatient = round.patients.find((patient) => patient.id === selectedPatientId);
  const requiredSignals = difficulty === "middle" ? 2 : 1;
  const abnormalSignals = selectedPatient ? getAbnormalVitals(selectedPatient) : [];
  const evidenceReady = selectedSignals.length === requiredSignals;
  const patientObserved = selectedPatient !== undefined && observedPatientId === selectedPatient.id;
  const correctActionId = selectedPatient ? recommendedAction(selectedPatient) : null;
  const isCorrect = selectedPatientId === round.urgentPatientId
    && evidenceReady
    && selectedSignals.every((signal) => abnormalSignals.includes(signal));

  useEffect(() => {
    if (!started || trendReviewed || resolved) return;
    let interval = 0;
    const delay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setTrendProgress((current) => Math.min(1, current + 0.035));
      }, 420);
    }, 900);
    return () => {
      window.clearTimeout(delay);
      if (interval) window.clearInterval(interval);
    };
  }, [started, trendReviewed, resolved, round.id]);

  useEffect(() => {
    if (trendProgress >= 1 && !trendReviewed) setTrendReviewed(true);
  }, [trendProgress, trendReviewed]);

  useEffect(() => {
    if (responseState === "idle") return;
    setResponseProgress(0);
    let progress = 0;
    const interval = window.setInterval(() => {
      progress = Math.min(1, progress + 0.12);
      setResponseProgress(progress);
      if (progress >= 1) window.clearInterval(interval);
    }, 160);
    return () => window.clearInterval(interval);
  }, [responseState]);

  if (session === null) return null;

  function handleRespond(actionId: ResponseActionId) {
    if (!selectedPatient || !patientObserved || !evidenceReady || resolved) return;
    const correct = isCorrect && actionId === correctActionId;
    if (!attemptRecorded) {
      setAnswers((current) => [...current, correct]);
      setAttemptRecorded(true);
    }
    if (!correct) {
      setResponseState("declining");
      return;
    }
    setResponseState("recovering");
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
    setObservedPatientId(null);
    setResponseState("idle");
    setResponseProgress(0);
    setAttemptRecorded(false);
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
              <strong>변화는 숫자보다 먼저 신호를 보냅니다</strong>
              <p>움직이는 모니터를 비교하고 환자를 직접 확인한 뒤 첫 대응까지 실행하세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>라운드</span><strong>{rounds.length}번의 상태 변화</strong></p>
            <p><span>판단</span><strong>환자 확인 + 근거 {requiredSignals}개 + 대응</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>모니터링 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="중환자실 모니터 관찰 활동">
          <div className={styles.roundHeader}>
            <p><span>LIVE ROUND</span><strong>{String(roundIndex + 1).padStart(2, "0")} / {String(rounds.length).padStart(2, "0")}</strong></p>
            <p className={styles.situation}>{round.situation} 추세를 재생해 변화를 찾으세요.</p>
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
            <div className={styles.replayHud} data-active={trendProgress > 0} data-complete={trendReviewed}>
              <p>
                <span>STEP 01 · MONITOR REPLAY</span>
                <strong>{String(Math.round(trendProgress * 10)).padStart(2, "0")}.0s</strong>
              </p>
              <TrendScrubber
                key={round.id}
                progress={trendProgress}
                completed={trendReviewed}
                onProgress={setTrendProgress}
                onComplete={() => setTrendReviewed(true)}
              />
              <small>
                {trendReviewed
                  ? "LIVE FEED CONNECTED"
                  : trendProgress > 0
                    ? "PATIENT CHANGE DETECTING"
                    : "오른쪽으로 밀어 10초 변화를 재생하세요"}
              </small>
            </div>
            <div className={styles.monitorBank}>
              {round.patients.map((patient) => {
                const selected = selectedPatientId === patient.id;
                const urgent = resolved && patient.id === round.urgentPatientId;
                const [systolic, diastolic] = patient.bloodPressure.split("/").map(Number);
                let displayHeartRate = interpolate(
                  baselineFor(patient.heartRate, 82, 55, 110),
                  patient.heartRate,
                  trendProgress,
                );
                let displaySpo2 = interpolate(
                  baselineFor(patient.spo2, 97, 94, 101),
                  patient.spo2,
                  trendProgress,
                );
                let displayResp = interpolate(
                  baselineFor(patient.resp, 16, 10, 26),
                  patient.resp,
                  trendProgress,
                );
                let displaySystolic = interpolate(
                  baselineFor(systolic, 118, 90, 141),
                  systolic,
                  trendProgress,
                );
                let displayDiastolic = interpolate(
                  baselineFor(diastolic, 72, 55, 91),
                  diastolic,
                  trendProgress,
                );
                if (patient.id === selectedPatientId && responseState !== "idle") {
                  const recovering = responseState === "recovering";
                  displayHeartRate = interpolate(displayHeartRate, recovering ? 88 : displayHeartRate + 12, responseProgress);
                  displaySpo2 = interpolate(displaySpo2, recovering ? Math.max(95, displaySpo2) : Math.max(76, displaySpo2 - 4), responseProgress);
                  displayResp = interpolate(displayResp, recovering ? 18 : displayResp + 4, responseProgress);
                  displaySystolic = interpolate(displaySystolic, recovering ? Math.max(108, displaySystolic) : Math.max(72, displaySystolic - 8), responseProgress);
                  displayDiastolic = interpolate(displayDiastolic, recovering ? Math.max(66, displayDiastolic) : Math.max(42, displayDiastolic - 5), responseProgress);
                }
                return (
                  <button
                    key={patient.id}
                    type="button"
                    className={styles.monitor}
                    data-selected={selected}
                    data-urgent={urgent}
                    data-changing={trendProgress > 0 && !trendReviewed}
                    disabled={resolved}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setSelectedSignals([]);
                      setObservedPatientId(null);
                      setResponseState("idle");
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
                    <span className={styles.monitorStatus}>{responseState !== "idle" && patient.id === selectedPatientId
                      ? responseState === "recovering" ? "처치 반응 · 회복 중" : "경고 · 수치 악화"
                      : trendReviewed ? patient.status : trendProgress > 0 ? "실시간 추세 수집 중" : "기준 수치"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className={styles.patientCheck} data-ready={selectedPatient !== undefined} data-observed={patientObserved}>
            <div className={styles.patientCheckCopy}>
              <span>STEP 02 · BEDSIDE CHECK</span>
              <strong>{selectedPatient
                ? `${selectedPatient.bed} ${selectedPatient.label} 환자를 직접 확인하세요.`
                : "변화가 가장 큰 모니터를 먼저 선택하세요."}</strong>
              <small>{patientObserved && selectedPatient
                ? selectedPatient.resp < 10
                  ? "가슴 움직임이 느리고 호흡이 얕습니다."
                  : selectedPatient.resp > 28
                    ? "가슴 움직임이 빠르고 숨이 가쁩니다."
                    : selectedPatient.status
                : "모니터 수치와 환자의 실제 상태를 함께 봐야 합니다."}</small>
            </div>
            <button
              type="button"
              className={styles.bedsideButton}
              disabled={!selectedPatient || resolved}
              data-complete={patientObserved}
              onClick={() => { if (selectedPatient) setObservedPatientId(selectedPatient.id); }}
            >
              <i aria-hidden="true" />
              <span>{patientObserved ? "호흡·의식 확인 완료" : "환자 호흡·의식 확인"}</span>
            </button>
          </section>

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
                  disabled={!selectedPatient || !patientObserved || resolved}
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
                ? "모니터가 변하고 있습니다. 환자와 수치를 함께 관찰하세요."
                : selectedPatient && !patientObserved
                  ? "침상에서 환자의 호흡과 의식을 직접 확인하세요"
                : selectedPatient && !evidenceReady
                  ? `위험 근거를 ${requiredSignals - selectedSignals.length}개 더 선택하세요`
                  : selectedPatient
                    ? `${selectedPatient.bed} ${selectedPatient.label} · 첫 대응을 실행하세요`
                    : "가장 먼저 확인할 모니터를 선택하세요"}</strong>
            </div>
            <div className={styles.responseActions}>
              {RESPONSE_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={!trendReviewed || !patientObserved || !evidenceReady || resolved}
                  data-recommended={resolved && action.id === correctActionId}
                  onClick={() => handleRespond(action.id)}
                >
                  <strong>{action.label}</strong>
                  <small>{action.caption}</small>
                </button>
              ))}
            </div>
          </div>

          {responseState !== "idle" ? (
            <div className={styles.feedback} data-correct={resolved} role="status">
              <div>
                <span>{resolved ? "PATIENT RESPONDING" : "CONDITION DECLINING"}</span>
                <strong>{resolved
                  ? "선택한 행동 뒤 수치와 호흡이 회복되고 있습니다."
                  : "선택하는 동안 환자 상태가 더 나빠졌습니다. 모니터와 침상 관찰을 다시 연결하세요."}</strong>
                <p>{resolved ? round.explanation : "한 가지 수치만 보지 말고 환자·추세·위험 근거를 함께 확인한 뒤 다른 행동을 실행하세요."}</p>
                <small>간호사의 판단 · {resolved ? round.response : "잘못된 행동도 즉시 멈추고 다시 확인하는 것이 환자 안전입니다."}</small>
              </div>
              {resolved ? <PrimaryButton onClick={handleNext}>{roundIndex === rounds.length - 1 ? "판단 결과 확인" : "계속 관찰"}</PrimaryButton> : null}
            </div>
          ) : null}
        </section>
      )}
    </AppScreen>
  );
}
