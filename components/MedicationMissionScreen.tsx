"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  getMedicationCases,
  type MedicationOption,
} from "@/data/specialty-missions";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./MedicationMissionScreen.module.css";

type MismatchField = "patient" | "medicine" | "dose" | "route" | "time";

function numericDose(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function similarPatientName(name: string) {
  if (name.length < 2) return `${name}A`;
  const replacements = ["서", "석", "우", "민"];
  const current = name.at(-1);
  const next = replacements.find((candidate) => candidate !== current) ?? "진";
  return `${name.slice(0, -1)}${next}`;
}

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
  const [selectedPatientKey, setSelectedPatientKey] = useState<"correct" | "similar" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [workSeconds, setWorkSeconds] = useState(0);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  const difficulty = session?.difficulty ?? "elementary";
  const cases = getMedicationCases(difficulty);
  const medicationCase = cases[caseIndex];
  const selectedOption = medicationCase.options.find((option) => option.id === selectedOptionId);
  const reviewOption = medicationCase.options.find((option) => option.id === reviewOptionId);
  const orderParts = medicationCase.order.split(" ");
  const expectedDose = orderParts.at(-1) ?? "";
  const expectedMedicine = orderParts.slice(0, -1).join(" ");
  const orderedDose = numericDose(expectedDose);
  const optionDose = reviewOption ? numericDose(reviewOption.dose) : 0;
  const expectedQuantity = optionDose > 0 && orderedDose > 0
    ? Math.max(1, Math.round(orderedDose / optionDose))
    : 1;
  const quantityConfirmed = quantity === expectedQuantity;
  const reviewComplete = reviewedFields.length === 5 && quantityConfirmed;
  const similarBirthDate = medicationCase.birthDate.replace(/\d$/, (digit) => digit === "9" ? "8" : String(Number(digit) + 1));

  useEffect(() => {
    if (!started || resolved) return;
    const interval = window.setInterval(() => setWorkSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [started, resolved, medicationCase.id]);

  if (session === null) return null;

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
    setQuantity(0);
    setFeedback(null);
  }

  function fieldMatches(field: MismatchField) {
    if (!reviewOption) return false;
    if (field === "medicine") return reviewOption.medicine === expectedMedicine;
    if (field === "dose") return reviewOption.dose === expectedDose;
    if (field === "time") return true;
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
        ? "다섯 항목과 준비 수량이 모두 일치합니다. 이 경우에는 투약 준비를 진행할 수 있습니다."
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
    setQuantity(0);
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
    setSelectedPatientKey(null);
    setDrawerOpen(false);
    setQuantity(0);
    setWorkSeconds(0);
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
              <p>팔찌와 처방, 약품을 대조하고 준비 수량과 5 Rights를 직접 확인하세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>대상</span><strong>{cases.length}명의 환자</strong></p>
            <p><span>판단</span><strong>용량 계산 + 5 Rights</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>투약 확인 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="투약 전 환자와 약품 대조 활동">
          <div className={styles.caseHeader}>
            <p><span>VERIFICATION</span><strong>{String(caseIndex + 1).padStart(2, "0")} / {String(cases.length).padStart(2, "0")}</strong></p>
            <p className={styles.liveOrder}><span>ORDER ACTIVE</span><strong>14:00 투약 · {String(Math.floor(workSeconds / 60)).padStart(2, "0")}:{String(workSeconds % 60).padStart(2, "0")} 경과</strong></p>
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
              <p><span>STEP 01 · PATIENT MATCH</span><strong>이름과 생년월일이 모두 같은 팔찌를 찾으세요.</strong></p>
              <div className={styles.patientCandidates}>
                <button
                  type="button"
                  data-selected={selectedPatientKey === "correct"}
                  onClick={() => { setSelectedPatientKey("correct"); setScanned(false); setFeedback(null); }}
                >
                  <span>PATIENT A</span><strong>{medicationCase.patientName}</strong><small>{medicationCase.birthDate}</small>
                </button>
                <button
                  type="button"
                  data-selected={selectedPatientKey === "similar"}
                  data-mismatch={selectedPatientKey === "similar"}
                  onClick={() => { setSelectedPatientKey("similar"); setScanned(false); setFeedback("이름이 비슷하지만 생년월일이 다릅니다. 두 정보를 다시 대조하세요."); }}
                >
                  <span>PATIENT B</span><strong>{similarPatientName(medicationCase.patientName)}</strong><small>{similarBirthDate}</small>
                </button>
              </div>
              {selectedPatientKey === "correct" ? (
                <WristbandScanner
                  key={medicationCase.id}
                  patientName={medicationCase.patientName}
                  birthDate={medicationCase.birthDate}
                  onComplete={() => { setScanned(true); setFeedback(null); }}
                />
              ) : <p className={styles.scanGate}>{selectedPatientKey === "similar" ? "환자 정보가 다릅니다. 다른 팔찌를 확인하세요." : "팔찌를 먼저 선택하세요."}</p>}
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
              <p><span>STEP 03 · MEDICATION DRAWER</span><strong>{drawerOpen ? "라벨을 읽고 약품을 트레이로 옮기세요" : "처방 확인 후 약품 서랍을 여세요"}</strong></p>
              {!drawerOpen ? (
                <button type="button" className={styles.drawerButton} disabled={!scanned} onClick={() => setDrawerOpen(true)}>
                  <span>{scanned ? "DRAWER READY" : "LOCKED DRAWER"}</span><strong>약품 서랍 열기</strong><small>{scanned ? "환자 확인 완료 · 라벨을 대조하세요." : "환자 확인이 완료되면 열 수 있습니다."}</small>
                </button>
              ) : <div className={styles.options}>
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
                    <span className={styles.packageVisual} data-package={option.id} aria-hidden="true"><i>{option.form}</i></span>
                    <span>RX {String(index + 1).padStart(2, "0")}</span>
                    <strong>{option.medicine}</strong>
                    <small>{option.dose} · {option.form}</small>
                  </button>
                ))}
              </div>}
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
            <section className={styles.mismatchLab} aria-label="투약 전 다섯 가지 권리 대조">
              <div className={styles.mismatchHeader}>
                <span>STEP 04 · DOSE + 5 RIGHTS</span>
                <strong>준비 수량을 계산하고 실제 정보 다섯 곳을 대조하세요.</strong>
                <p>체크리스트가 아니라 팔찌·처방·약품·경로·시간을 직접 확인합니다.</p>
                <div className={styles.quantityControl} data-confirmed={quantityConfirmed}>
                  <span>준비 수량</span>
                  <button type="button" aria-label="수량 줄이기" onClick={() => setQuantity((current) => Math.max(0, current - 1))}>−</button>
                  <strong>{quantity}<small>정</small></strong>
                  <button type="button" aria-label="수량 늘리기" onClick={() => setQuantity((current) => Math.min(4, current + 1))}>+</button>
                  <p>처방 {expectedDose} ÷ 보유 {reviewOption.dose}</p>
                </div>
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
                <button type="button" data-reviewed={reviewedFields.includes("time")} data-match={fieldMatches("time")} onClick={() => reviewField("time")}>
                  <span>시간</span><strong>14:00</strong><small>{reviewedFields.includes("time") ? "처방 시간과 일치" : "현재 투약 시간 확인"}</small>
                </button>
              </div>
              <div className={styles.decisionPanel} data-ready={reviewComplete}>
                <p><span>FINAL DECISION</span><strong>{reviewComplete
                  ? "투약을 진행할지 안전하게 결정하세요."
                  : !quantityConfirmed
                    ? `보유 용량에 맞는 수량을 계산하세요. 현재 ${quantity}정`
                    : `${5 - reviewedFields.length}개 정보를 더 확인하세요.`}</strong></p>
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
