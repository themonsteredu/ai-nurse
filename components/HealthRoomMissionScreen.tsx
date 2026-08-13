"use client";

/**
 * 미션 3 — 보건실 : 응급처치.
 *
 * 무엇을 하나:
 *   쉬는 시간마다 친구가 한 명씩 찾아옵니다.
 *   상황마다 두 번 고릅니다. (바로 할 처치 → 그 다음 조치)
 *
 * 화면 순서:
 *   브리핑 → 상황 1~5 → (중등만) 보건일지 → 결과
 *
 * 난이도 차이:
 *   초등 — 상황 5개, 처치 선택만
 *   중등 — 상황 5개 + 보건일지 문장 조립
 *
 * 어떤 데이터를 쓰나:
 *   - data/health-room-cases.ts : 상황 5개와 선택지, 정답
 *   - data/health-log.ts        : 보건일지 문장 조각과 정답
 *   - lib/health-room.ts        : 채점, 중등 여부 판단
 *
 * ⚠️ 이 파일에는 정답도, 기준 숫자도 없습니다. 전부 위에서 가져다 씁니다.
 *
 * 감정 톤: 따뜻하고 안심되는 분위기. "괜찮아, 내가 도와줄게".
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일의 생김새를 마음껏 바꿔도 됩니다.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getHealthRoomCases } from "@/data/health-room-cases";
import { MISSIONS } from "@/data/missions";
import {
  needsHealthLog,
  scoreHealthLog,
  scoreHealthRoomCases,
  scoreHealthRoomMission,
  type FollowUpAnswers,
  type HealthLogAnswers,
  type TreatmentAnswers,
} from "@/lib/health-room";
import { buildMissionResult, passThreshold } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { HealthLogBuilder } from "./HealthLogBuilder";
import { HealthRoomCaseCard } from "./HealthRoomCaseCard";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./HealthRoomMissionScreen.module.css";

type Phase = "briefing" | "cases" | "log" | "finished";

export function HealthRoomMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();

  const difficulty = session?.difficulty ?? "elementary";
  const cases = useMemo(() => getHealthRoomCases(difficulty), [difficulty]);
  const withLog = needsHealthLog(difficulty);

  const [phase, setPhase] = useState<Phase>("briefing");
  const [caseIndex, setCaseIndex] = useState(0);
  const [treatments, setTreatments] = useState<TreatmentAnswers>({});
  const [followUps, setFollowUps] = useState<FollowUpAnswers>({});
  const [logAnswers, setLogAnswers] = useState<HealthLogAnswers>({});
  const [logSubmitted, setLogSubmitted] = useState(false);

  const currentCase = cases[caseIndex];
  const isLastCase = caseIndex >= cases.length - 1;

  /* ---------------- 점수 ---------------- */

  const caseTally = useMemo(
    () => scoreHealthRoomCases(treatments, followUps, cases),
    [treatments, followUps, cases],
  );
  const logTally = useMemo(
    () => (withLog ? scoreHealthLog(logAnswers) : null),
    [withLog, logAnswers],
  );
  const totalTally = useMemo(
    () => scoreHealthRoomMission({ cases: caseTally, log: logTally, difficulty }),
    [caseTally, logTally, difficulty],
  );
  const missionResult = useMemo(
    () => buildMissionResult("healthRoom", totalTally, difficulty),
    [totalTally, difficulty],
  );

  /* ---------------- 진행 ---------------- */

  function handleNextCase() {
    if (isLastCase) setPhase(withLog ? "log" : "finished");
    else setCaseIndex((index) => index + 1);
  }

  function handleFinish() {
    saveMissionResult(missionResult);
    router.push("/unlock/healthRoom");
  }

  if (session === null) return null;

  const mission = MISSIONS.healthRoom;

  /* ================= 브리핑 ================= */

  if (phase === "briefing") {
    return (
      <AppScreen title={mission.title} subtitle={mission.subtitle} tone="warm">
        <div className={styles.briefing}>
          <p className={styles.briefingText}>{mission.briefing}</p>

          <ul className={styles.briefingFacts}>
            <li>
              친구 <strong>{cases.length}명</strong>이 찾아와요
            </li>
            <li>
              상황마다 <strong>두 번</strong> 고릅니다 — 바로 할 처치, 그 다음
              조치
            </li>
            {withLog ? (
              <li>
                마지막에 <strong>보건일지</strong>를 한 줄 씁니다
              </li>
            ) : null}
            <li>
              <strong>{passThreshold(difficulty)}%</strong> 이상 맞히면 배지를
              받아요
            </li>
          </ul>

          <p className={styles.briefingNote}>
            잘 모르겠으면 편하게 골라보세요. 몰랐던 걸 알게 되는 게 오늘의
            목적이에요.
          </p>

          <PrimaryButton fullWidth onClick={() => setPhase("cases")}>
            보건실 문 열기
          </PrimaryButton>
        </div>
      </AppScreen>
    );
  }

  /* ================= 상황 5개 ================= */

  if (phase === "cases" && currentCase) {
    return (
      <AppScreen title={mission.title} tone="warm">
        <HealthRoomCaseCard
          healthCase={currentCase}
          position={caseIndex + 1}
          total={cases.length}
          treatmentId={treatments[currentCase.id] ?? null}
          followUpId={followUps[currentCase.id] ?? null}
          onPickTreatment={(choiceId) =>
            setTreatments((current) => ({
              ...current,
              [currentCase.id]: choiceId,
            }))
          }
          onPickFollowUp={(choiceId) =>
            setFollowUps((current) => ({
              ...current,
              [currentCase.id]: choiceId,
            }))
          }
          onNext={handleNextCase}
          isLast={isLastCase}
        />
      </AppScreen>
    );
  }

  /* ================= 보건일지 (중등 전용) ================= */

  if (phase === "log") {
    return (
      <AppScreen
        title="보건일지 쓰기"
        subtitle="나중에 다른 선생님이 읽어도 알 수 있게"
        tone="warm"
      >
        <HealthLogBuilder
          answers={logAnswers}
          submitted={logSubmitted}
          onPick={(slotId, optionId) =>
            setLogAnswers((current) => ({ ...current, [slotId]: optionId }))
          }
          onSubmit={() => setLogSubmitted(true)}
          onNext={() => setPhase("finished")}
        />
      </AppScreen>
    );
  }

  /* ================= 결과 ================= */

  return (
    <AppScreen
      title="보건실 정리 끝"
      tone="warm"
      footer={
        <PrimaryButton fullWidth onClick={handleFinish}>
          통과 코드 입력하러 가기
        </PrimaryButton>
      }
    >
      <div className={styles.result}>
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
            <span>응급처치 {cases.length}가지</span>
            <strong>
              {caseTally.correct} / {caseTally.total}
            </strong>
          </li>
          {logTally ? (
            <li>
              <span>보건일지</span>
              <strong>
                {logTally.correct} / {logTally.total}
              </strong>
            </li>
          ) : null}
        </ul>

        <p className={styles.closingNote}>
          다친 친구를 돌보는 것도, 다치지 않게 미리 알려주는 것도 모두 보건
          선생님이 하는 일이에요.
        </p>
      </div>
    </AppScreen>
  );
}
