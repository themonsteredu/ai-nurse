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

type MismatchField = "patient" | "medicine" | "dose" | "route";

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
  const [reviewOptionId, setReviewOptionId] = useState<string | null>(null);
  const [reviewedFields, setReviewedFields] = useState<MismatchField[]>([]);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  if (session === null) return null;

  const difficulty = session.difficulty;
  const cases = getMedicationCases(difficulty);
  const medicationCase = cases[caseIndex];
  const selectedOption = medicationCase.options.find((option) => option.id === selectedOptionId);
  const reviewOption = medicationCase.options.find((option) => option.id === reviewOptionId);
  const orderParts = medicationCase.order.split(" ");
  const expectedDose = orderParts.at(-1) ?? "";
  const expectedMedicine = orderParts.slice(0, -1).join(" ");
  const reviewComplete = reviewedFields.length === 4;

  function verifyOption(option: MedicationOption) {
    if (!scanned || resolved) return;
    const correct = option.id === medicationCase.correctOptionId;
    if (!attempted) {
      setAttempted(true);
      setAnswers((current) => [...current, correct]);
    }
    setSelectedOptionId(null);
    setReviewOptionId(option.id);
    setReviewedFields([]);
    setFeedback(null);
  }

  function fieldMatches(field: MismatchField) {
    if (!reviewOption) return false;
    if (field === "medicine") return reviewOption.medicine === expectedMedicine;
    if (field === "dose") return reviewOption.dose === expectedDose;
    return true;
  }

  function reviewField(field: MismatchField) {
    setReviewedFields((current) => current.includes(field) ? current : [...current, field]);
  }

  function handleDecision(decision: "administer" | "hold") {
    if (!reviewOption || !reviewComplete) return;
    const optionCorrect = reviewOption.id === medicationCase.correctOptionId;
    const decisionCorrect = optionCorrect ? decision === "administer" : decision === "hold";

    if (!decisionCorrect) {
      setFeedback(optionCorrect
        ? "네 항목이 모두 일치합니다. 이 경우에는 투약 준비를 진행할 수 있습니다."
        : "불일치 항목이 있습니다. 투약하지 말고 보류 후 다시 확인해야 합니다.");
      return;
    }

    if (optionCorrect) {
      setResolved(true);
      setFeedback(medicationCase.explanation);
      return;
    }

    const mismatches = (["medicine", "dose"] as MismatchField[])
      .filter((field) => !fieldMatches(field))
      .map((field) => field === "medicine" ? "약 이름" : "용량");
    setFeedback(`오류 발견: ${mismatches.join("·")}이 처방과 다릅니다. 약품을 보류하고 다시 선택하세요.`);
    setReviewOptionId(null);
    setSelectedOptionId(null);
    setReviewedFields([]);
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
    setReviewOptionId(null);
    setReviewedFields([]);
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
              <p>약을 고른 뒤 네 가지 권리를 직접 대조하고 투약 여부까지 결정하세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>대상</span><strong>{cases.length}명의 환자</strong></p>
            <p><span>판단</span><strong>4항목 대조 + 투약 결정</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>투약 확인 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="투약 전 환자와 약품 대조 활동">
          <div className={styles.caseHeader}>
            <p><span>VERIFICATION</span><strong>{String(caseIndex + 1).padStart(2, "0")} / {String(cases.length).padStart(2, "0")}</strong></p>
            <p>팔찌 확인 → 약품 배치 → 4항목 감사 → 투약 결정</p>
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
                    data-review={reviewOptionId === option.id}
                    disabled={!scanned || resolved || reviewOptionId !== null}
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

          {reviewOption ? (
            <section className={styles.mismatchLab} aria-label="투약 전 네 가지 권리 대조">
              <div className={styles.mismatchHeader}>
                <span>STEP 04 · FOUR RIGHTS AUDIT</span>
                <strong>네 항목을 하나씩 열어 처방과 대조하세요.</strong>
                <p>모두 확인한 다음에만 투약 또는 보류를 결정할 수 있습니다.</p>
              </div>
              <div className={styles.mismatchGrid}>
                <button type="button" data-reviewed={reviewedFields.includes("patient")} data-match={fieldMatches("patient")} onClick={() => reviewField("patient")}>
                  <span>환자</span><strong>{medicationCase.patientName}</strong><small>{reviewedFields.includes("patient") ? "팔찌와 일치" : "눌러서 대조"}</small>
                </button>
                <button type="button" data-reviewed={reviewedFields.includes("medicine")} data-match={fieldMatches("medicine")} onClick={() => reviewField("medicine")}>
                  <span>약 이름</span><strong>{reviewOption.medicine}</strong><small>{reviewedFields.includes("medicine") ? `처방 ${expectedMedicine}와 ${fieldMatches("medicine") ? "일치" : "불일치"}` : "눌러서 대조"}</small>
                </button>
                <button type="button" data-reviewed={reviewedFields.includes("dose")} data-match={fieldMatches("dose")} onClick={() => reviewField("dose")}>
                  <span>용량</span><strong>{reviewOption.dose}</strong><small>{reviewedFields.includes("dose") ? `처방 ${expectedDose}와 ${fieldMatches("dose") ? "일치" : "불일치"}` : "눌러서 대조"}</small>
                </button>
                <button type="button" data-reviewed={reviewedFields.includes("route")} data-match={fieldMatches("route")} onClick={() => reviewField("route")}>
                  <span>경로</span><strong>{medicationCase.route}</strong><small>{reviewedFields.includes("route") ? `${reviewOption.form} · 경로 일치` : "눌러서 대조"}</small>
                </button>
              </div>
              <div className={styles.decisionPanel} data-ready={reviewComplete}>
                <p><span>FINAL DECISION</span><strong>{reviewComplete ? "이 약을 어떻게 할까요?" : `${4 - reviewedFields.length}개 항목을 더 확인하세요.`}</strong></p>
                <button type="button" disabled={!reviewComplete} onClick={() => handleDecision("hold")}>보류하고 다시 확인</button>
                <button type="button" disabled={!reviewComplete} onClick={() => handleDecision("administer")}>투약 준비 진행</button>
              </div>
            </section>
          ) : null}

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
