"use client";

/**
 * 미션 2 — 119 구급차 : 심폐소생술.
 *
 * 과제가 세 개라서, 세 점수를 합쳐 하나의 성적으로 만듭니다.
 *   ① 신고 순서 맞추기   (DispatchOrderStep)
 *   ② 가슴압박 리듬      (CompressionPad)
 *   ③ AED 패드 위치      (AedBodyDiagram)
 *
 * 화면 순서:
 *   브리핑 → ① → ①결과 → ② → ②결과 → ③ → ③결과 → 전체 결과
 *
 * 어떤 데이터를 쓰나:
 *   - data/dispatch-steps.ts : 행동 순서 카드와 정답 순서
 *   - data/aed-pads.ts       : 패드 붙일 자리와 정답
 *   - lib/cpr.ts             : BPM 계산, 리듬 판정, 압박 시간
 *   - lib/ambulance.ts       : 세 과제 채점과 합산
 *
 * ⚠️ 이 파일에는 정답도, 기준 숫자도 없습니다. 전부 위에서 가져다 씁니다.
 *
 * 감정 톤: 집중되고 리듬감 있는 분위기. 골든타임 4분.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일의 생김새를 마음껏 바꿔도 됩니다.
 */

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { AED_PAD_COUNT } from "@/data/aed-pads";
import { getDispatchSteps } from "@/data/dispatch-steps";
import { MISSIONS } from "@/data/missions";
import {
  CPR_CYCLE_BREATHS,
  CPR_CYCLE_COMPRESSIONS,
} from "@/data/rules";
import type { ScoreTally } from "@/data/types";
import {
  isStepInCorrectPosition,
  padExplanationFor,
  scoreAedPads,
  scoreAmbulanceMission,
  scoreDispatchOrder,
} from "@/lib/ambulance";
import {
  compressionDurationMs,
  scoreCompressions,
  targetBpmRange,
} from "@/lib/cpr";
import { accuracyPercent, buildMissionResult, passThreshold } from "@/lib/scoring";

import { AedBodyDiagram } from "./AedBodyDiagram";
import { AppScreen } from "./AppScreen";
import { CompressionPad } from "./CompressionPad";
import { DispatchOrderStep } from "./DispatchOrderStep";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./AmbulanceMissionScreen.module.css";

type Phase =
  | "briefing"
  | "dispatch"
  | "dispatchResult"
  | "compression"
  | "compressionResult"
  | "aed"
  | "aedResult"
  | "finished";

export function AmbulanceMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();

  const difficulty = session?.difficulty ?? "elementary";
  const steps = useMemo(() => getDispatchSteps(difficulty), [difficulty]);

  const [phase, setPhase] = useState<Phase>("briefing");
  const [arrangedIds, setArrangedIds] = useState<string[]>([]);
  const [dispatchTally, setDispatchTally] = useState<ScoreTally | null>(null);
  const [compressionTally, setCompressionTally] = useState<ScoreTally | null>(
    null,
  );
  const [tapCount, setTapCount] = useState(0);
  const [selectedPadIds, setSelectedPadIds] = useState<string[]>([]);
  const [aedTally, setAedTally] = useState<ScoreTally | null>(null);

  /* ---------------- ① 신고 순서 ---------------- */

  function handleDispatchFinish(ids: string[]) {
    setArrangedIds(ids);
    setDispatchTally(scoreDispatchOrder(ids, steps));
    setPhase("dispatchResult");
  }

  /* ---------------- ② 가슴압박 ---------------- */

  const handleCompressionFinish = useCallback((tapTimestamps: number[]) => {
    setTapCount(tapTimestamps.length);
    setCompressionTally(scoreCompressions(tapTimestamps));
    setPhase("compressionResult");
  }, []);

  /* ---------------- ③ AED ---------------- */

  function handleSelectPad(spotId: string) {
    if (phase !== "aed") return;

    // 이미 고른 자리를 다시 누르면 취소합니다.
    const alreadyPicked = selectedPadIds.includes(spotId);
    const next = alreadyPicked
      ? selectedPadIds.filter((id) => id !== spotId)
      : selectedPadIds.length >= AED_PAD_COUNT
        ? selectedPadIds
        : [...selectedPadIds, spotId];

    setSelectedPadIds(next);

    // 패드를 다 붙였으면 바로 정답을 알려줍니다.
    if (next.length === AED_PAD_COUNT) {
      setAedTally(scoreAedPads(next));
      setPhase("aedResult");
    }
  }

  /* ---------------- 전체 점수 ---------------- */

  const totalTally = useMemo(
    () =>
      scoreAmbulanceMission({
        dispatch: dispatchTally ?? { correct: 0, total: 0 },
        compressions: compressionTally ?? { correct: 0, total: 0 },
        aed: aedTally ?? { correct: 0, total: 0 },
      }),
    [dispatchTally, compressionTally, aedTally],
  );

  const missionResult = useMemo(
    () => buildMissionResult("ambulance", totalTally, difficulty),
    [totalTally, difficulty],
  );

  function handleFinish() {
    saveMissionResult(missionResult);
    router.push("/unlock/ambulance");
  }

  if (session === null) return null;

  const mission = MISSIONS.ambulance;
  const bpm = targetBpmRange();
  const durationSeconds = Math.round(compressionDurationMs(difficulty) / 1000);

  /* ================= 브리핑 ================= */

  if (phase === "briefing") {
    return (
      <AppScreen title={mission.title} subtitle={mission.subtitle} tone="focused">
        <div className={styles.briefing}>
          <p className={styles.briefingText}>{mission.briefing}</p>

          <ol className={styles.taskList}>
            <li>
              <strong>신고하기</strong> — 무엇부터 해야 할지 순서 맞추기
            </li>
            <li>
              <strong>가슴 압박</strong> — 분당 {bpm.min}~{bpm.max}회 리듬으로{" "}
              {durationSeconds}초
            </li>
            <li>
              <strong>자동심장충격기</strong> — 패드 붙일 자리 찾기
            </li>
          </ol>

          <p className={styles.briefingNote}>
            분당 {Math.round((bpm.min + bpm.max) / 2)}회는 신나는 노래 박자와
            비슷해요. 몸으로 리듬을 타보세요.
          </p>

          <PrimaryButton fullWidth onClick={() => setPhase("dispatch")}>
            출동하기
          </PrimaryButton>
        </div>
      </AppScreen>
    );
  }

  /* ================= ① 신고 순서 ================= */

  if (phase === "dispatch") {
    return (
      <AppScreen title="① 신고하기" subtitle="무엇부터 해야 할까요?" tone="focused">
        <DispatchOrderStep steps={steps} onFinish={handleDispatchFinish} />
      </AppScreen>
    );
  }

  if (phase === "dispatchResult" && dispatchTally) {
    return (
      <AppScreen
        title="① 신고하기 결과"
        tone="focused"
        footer={
          <PrimaryButton fullWidth onClick={() => setPhase("compression")}>
            가슴 압박 시작하기
          </PrimaryButton>
        }
      >
        <div className={styles.stepResult}>
          <p className={styles.stepScore}>
            {steps.length}개 중 <strong>{dispatchTally.correct}개</strong>를 제자리에
            놓았어요
          </p>

          <ol className={styles.answerList}>
            {steps.map((step, index) => {
              const chosenId = arrangedIds[index];
              const correct = isStepInCorrectPosition(chosenId, index, steps);
              const chosen = steps.find((item) => item.id === chosenId);
              return (
                <li key={step.id} className={styles.answerItem} data-correct={correct}>
                  <p className={styles.answerHeader}>
                    <span className={styles.answerNumber}>{index + 1}</span>
                    <span className={styles.answerLabel}>{step.label}</span>
                    <span className={styles.answerMark}>
                      {correct ? "✓" : "✗"}
                    </span>
                  </p>
                  {!correct && chosen ? (
                    <p className={styles.answerChosen}>
                      학생이 놓은 것: {chosen.label}
                    </p>
                  ) : null}
                  <p className={styles.answerWhy}>{step.explanation}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </AppScreen>
    );
  }

  /* ================= ② 가슴압박 ================= */

  if (phase === "compression") {
    return (
      <AppScreen
        title="② 가슴 압박"
        subtitle={`원이 가장 작아질 때 눌러주세요 · ${durationSeconds}초`}
        tone="focused"
      >
        <CompressionPad
          difficulty={difficulty}
          onFinish={handleCompressionFinish}
        />
      </AppScreen>
    );
  }

  if (phase === "compressionResult" && compressionTally) {
    return (
      <AppScreen
        title="② 가슴 압박 결과"
        tone="focused"
        footer={
          <PrimaryButton fullWidth onClick={() => setPhase("aed")}>
            자동심장충격기 사용하기
          </PrimaryButton>
        }
      >
        <div className={styles.stepResult}>
          <p className={styles.bigScore}>
            {accuracyPercent(compressionTally)}%
          </p>
          <p className={styles.stepScore}>
            {tapCount}번 눌렀고, 그중{" "}
            <strong>{compressionTally.correct}번</strong>이 알맞은 속도였어요
          </p>
          <p className={styles.stepNote}>
            권장 속도는 분당 {bpm.min}~{bpm.max}회입니다. 실제 구급대원은 이걸
            10분씩 이어서 합니다.
          </p>

          {difficulty === "middle" ? (
            <p className={styles.cycleNote}>
              실제로는 가슴압박 {CPR_CYCLE_COMPRESSIONS}번마다 인공호흡{" "}
              {CPR_CYCLE_BREATHS}번을 함께 합니다. 다만 훈련받지 않았다면
              가슴압박만 계속하는 것이 더 좋습니다.
            </p>
          ) : null}
        </div>
      </AppScreen>
    );
  }

  /* ================= ③ AED ================= */

  if (phase === "aed" || phase === "aedResult") {
    const revealed = phase === "aedResult";
    return (
      <AppScreen
        title="③ 자동심장충격기"
        subtitle={
          revealed
            ? undefined
            : `패드 ${AED_PAD_COUNT}개를 붙일 자리를 골라주세요`
        }
        tone="focused"
        footer={
          revealed ? (
            <PrimaryButton fullWidth onClick={() => setPhase("finished")}>
              미션 결과 보기
            </PrimaryButton>
          ) : null
        }
      >
        <div className={styles.aedLayout}>
          <AedBodyDiagram
            selectedIds={selectedPadIds}
            revealed={revealed}
            onSelectSpot={handleSelectPad}
          />

          {revealed && aedTally ? (
            <div className={styles.aedResult}>
              <p className={styles.stepScore}>
                정답 자리 {aedTally.total}곳 중{" "}
                <strong>{aedTally.correct}곳</strong>을 맞혔어요
              </p>
              <ul className={styles.aedExplanations}>
                {selectedPadIds.map((spotId) => (
                  <li key={spotId}>{padExplanationFor(spotId)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={styles.aedHint}>
              고른 자리를 다시 누르면 취소돼요.
            </p>
          )}
        </div>
      </AppScreen>
    );
  }

  /* ================= 전체 결과 ================= */

  return (
    <AppScreen
      title="출동을 마쳤어요"
      tone="focused"
      footer={
        <PrimaryButton fullWidth onClick={handleFinish}>
          통과 코드 입력하러 가기
        </PrimaryButton>
      }
    >
      <div className={styles.finalResult}>
        <section className={styles.scoreCard} data-passed={missionResult.passed}>
          <p className={styles.scoreValue}>{missionResult.accuracyPercent}%</p>
          <p className={styles.scoreDetail}>
            {totalTally.total}점 중 {totalTally.correct}점
          </p>
          <p className={styles.scoreBadge}>
            {missionResult.passed
              ? `★ ${mission.badgeName} 획득!`
              : `${passThreshold(difficulty)}% 이상이면 배지를 받아요`}
          </p>
        </section>

        <ul className={styles.breakdown}>
          <li>
            <span>① 신고 순서</span>
            <strong>
              {dispatchTally?.correct ?? 0} / {dispatchTally?.total ?? 0}
            </strong>
          </li>
          <li>
            <span>② 가슴 압박</span>
            <strong>
              {compressionTally?.correct ?? 0} / {compressionTally?.total ?? 0}
            </strong>
          </li>
          <li>
            <span>③ AED 패드</span>
            <strong>
              {aedTally?.correct ?? 0} / {aedTally?.total ?? 0}
            </strong>
          </li>
        </ul>
      </div>
    </AppScreen>
  );
}
