"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  getMedicationCases,
  type MedicationOption,
} from "@/data/specialty-missions";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./MedicationMissionScreen.module.css";

function WristbandScanner({ patientName, birthDate, onComplete }: {
  patientName: string;
  birthDate: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const draggingRef = useRef(false);
  const progressRef = useRef(0);

  function update(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0, Math.min(1, (event.clientX - rect.left - 32) / (rect.width - 64)));
    progressRef.current = next;
    setProgress(next);
  }

  function finish() {
    if (progressRef.current < 0.76 || complete) {
      progressRef.current = 0;
      setProgress(0);
      return;
    }
    progressRef.current = 1;
    setProgress(1);
    setComplete(true);
    onComplete();
  }

  return (
    <button
      type="button"
      className={styles.scanner}
      data-complete={complete}
      aria-label={complete ? "환자 팔찌 스캔 완료" : "스캐너를 오른쪽으로 밀어 환자 팔찌 확인"}
      onPointerDown={(event) => {
        if (complete) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        draggingRef.current = true;
        update(event);
      }}
      onPointerMove={(event) => { if (draggingRef.current) update(event); }}
      onPointerUp={() => { draggingRef.current = false; finish(); }}
      onPointerCancel={() => { draggingRef.current = false; progressRef.current = 0; setProgress(0); }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !complete) {
          event.preventDefault();
          progressRef.current = 1;
          setProgress(1);
          setComplete(true);
          onComplete();
        }
      }}
    >
      <span className={styles.bandData}>
        <small>PATIENT ID</small>
        <strong>{patientName}</strong>
        <i>{birthDate}</i>
      </span>
      <span className={styles.scanBeam} style={{ left: `calc(${progress * 100}% - ${progress * 64}px + 8px)` }} />
      <span className={styles.scanDevice} style={{ left: `calc(${progress * 100}% - ${progress * 64}px + 4px)` }} aria-hidden="true">
        <i />
      </span>
      <span className={styles.scanInstruction}>{complete ? "두 가지 환자 정보 확인 완료" : "스캐너를 끝까지 미세요"}</span>
    </button>
  );
}

export function MedicationMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();
  const [started, setStarted] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [draggingOptionId, setDraggingOptionId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  if (session === null) return null;

  const difficulty = session.difficulty;
  const cases = getMedicationCases(difficulty);
  const medicationCase = cases[caseIndex];
  const selectedOption = medicationCase.options.find((option) => option.id === selectedOptionId);

  function verifyOption(option: MedicationOption) {
    if (!scanned || resolved) return;
    const correct = option.id === medicationCase.correctOptionId;
    if (!attempted) {
      setAttempted(true);
      setAnswers((current) => [...current, correct]);
    }
    setSelectedOptionId(null);

    if (!correct) {
      setFeedback(`${option.medicine} ${option.dose}은 처방과 일치하지 않습니다. 약 이름과 용량을 다시 대조하세요.`);
      return;
    }

    setResolved(true);
    setFeedback(medicationCase.explanation);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, option: MedicationOption) {
    if (!scanned || resolved) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY };
    setDraggingOptionId(option.id);
    setDragPoint({ x: event.clientX, y: event.clientY });
  }

  function finishMedicationDrag(clientX: number, clientY: number, option: MedicationOption) {
    const origin = dragOriginRef.current;
    const moved = origin !== null && Math.hypot(clientX - origin.x, clientY - origin.y) > 10;
    const overTray = Boolean(document.elementFromPoint(clientX, clientY)?.closest("[data-medication-tray]"));
    setDraggingOptionId(null);
    setDragPoint(null);
    dragOriginRef.current = null;

    if (moved && overTray) verifyOption(option);
    else if (!moved) setSelectedOptionId((current) => current === option.id ? null : option.id);
  }

  function handleNext() {
    if (caseIndex === cases.length - 1) {
      saveMissionResult(buildMissionResult(
        "medication",
        { correct: answers.filter(Boolean).length, total: cases.length },
        difficulty,
      ));
      router.push("/unlock/medication");
      return;
    }
    setCaseIndex((current) => current + 1);
    setScanned(false);
    setSelectedOptionId(null);
    setAttempted(false);
    setResolved(false);
    setFeedback(null);
  }

  return (
    <AppScreen title="투약실" subtitle="한 번 더 확인" tone="medication">
      {!started ? (
        <section className={styles.briefing}>
          <div className={styles.hero}>
            <Image
              className={styles.heroImage}
              src="/assets/nurse/medication-room-v1.webp"
              alt="간호사가 투약 전에 환자 팔찌를 스캔하는 장면"
              fill
              priority
              sizes="(max-width:760px) 100vw, 1180px"
            />
            <div className={styles.heroShade} />
            <div className={styles.heroCopy}>
              <span>MISSION 06 · MEDICATION SAFETY</span>
              <strong>스캔하고,<br />대조하고, 확인하세요</strong>
              <p>환자 정보와 처방이 모두 일치할 때만 투약 준비가 끝납니다.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>대상</span><strong>{cases.length}명의 환자</strong></p>
            <p><span>조작</span><strong>스캔 + 약품 끌기</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>투약 확인 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="투약 전 환자와 약품 대조 활동">
          <div className={styles.caseHeader}>
            <p><span>VERIFICATION</span><strong>{String(caseIndex + 1).padStart(2, "0")} / {String(cases.length).padStart(2, "0")}</strong></p>
            <p>팔찌 확인 → 처방 대조 → 약품 배치</p>
          </div>

          <div className={styles.scanScene}>
            <Image
              className={styles.sceneImage}
              src="/assets/nurse/medication-room-v1.webp"
              alt="환자 팔찌와 약품을 확인하는 투약 안전 장면"
              fill
              priority
              sizes="(max-width:760px) 100vw, 1180px"
            />
            <div className={styles.sceneShade} />
            <div className={styles.scannerWrap}>
              <p><span>STEP 01</span><strong>두 가지 환자 정보 확인</strong></p>
              <WristbandScanner
                key={medicationCase.id}
                patientName={medicationCase.patientName}
                birthDate={medicationCase.birthDate}
                onComplete={() => setScanned(true)}
              />
            </div>
          </div>

          <div
            className={styles.verificationArea}
            data-ready={scanned}
            onPointerUpCapture={(event) => {
              const option = medicationCase.options.find((candidate) => candidate.id === draggingOptionId);
              if (option) finishMedicationDrag(event.clientX, event.clientY, option);
            }}
            onPointerCancelCapture={() => {
              setDraggingOptionId(null);
              setDragPoint(null);
              dragOriginRef.current = null;
            }}
          >
            <section className={styles.orderPanel}>
              <span>STEP 02 · PRESCRIPTION</span>
              <strong>{scanned ? medicationCase.order : "팔찌를 먼저 스캔하세요"}</strong>
              <dl>
                <div><dt>환자</dt><dd>{scanned ? medicationCase.patientName : "—"}</dd></div>
                <div><dt>경로</dt><dd>{scanned ? medicationCase.route : "—"}</dd></div>
              </dl>
            </section>

            <section className={styles.medicationRack} aria-label="준비된 약품">
              <p><span>STEP 03 · MEDICATION RACK</span><strong>약품을 확인 트레이로 옮기세요</strong></p>
              <div className={styles.options}>
                {medicationCase.options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    className={styles.medication}
                    data-selected={selectedOptionId === option.id}
                    data-dragging={draggingOptionId === option.id}
                    disabled={!scanned || resolved}
                    onPointerDown={(event) => handlePointerDown(event, option)}
                    onPointerMove={(event) => {
                      if (draggingOptionId) setDragPoint({ x: event.clientX, y: event.clientY });
                    }}
                  >
                    <span>RX {String(index + 1).padStart(2, "0")}</span>
                    <strong>{option.medicine}</strong>
                    <small>{option.dose} · {option.form}</small>
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              className={styles.verificationTray}
              data-medication-tray
              data-active={selectedOption !== undefined}
              aria-disabled={selectedOption === undefined && draggingOptionId === null}
              disabled={resolved}
              onClick={() => { if (selectedOption) verifyOption(selectedOption); }}
            >
              <span>FINAL CHECK</span>
              <strong>{resolved ? "일치 확인 완료" : "확인 트레이"}</strong>
              <small>{resolved
                ? "처방과 일치하는 약품입니다"
                : selectedOption
                  ? `${selectedOption.medicine} ${selectedOption.dose} 놓기`
                  : "약품을 이곳으로 끌어오세요"}</small>
            </button>
          </div>

          {feedback ? (
            <div className={styles.feedback} data-correct={resolved} role="status">
              <div>
                <span>{resolved ? "5 RIGHTS CHECKED" : "MISMATCH DETECTED"}</span>
                <strong>{resolved ? "환자·약·용량·시간·경로를 확인했습니다." : "이 약품은 잠시 보류합니다."}</strong>
                <p>{feedback}</p>
              </div>
              {resolved ? <PrimaryButton onClick={handleNext}>{caseIndex === cases.length - 1 ? "결과 확인" : "다음 환자"}</PrimaryButton> : null}
            </div>
          ) : null}

          {draggingOptionId && dragPoint ? (
            <div className={styles.dragGhost} style={{ left: dragPoint.x, top: dragPoint.y }} aria-hidden="true">
              {medicationCase.options.find((option) => option.id === draggingOptionId)?.medicine}
            </div>
          ) : null}
        </section>
      )}
    </AppScreen>
  );
}
