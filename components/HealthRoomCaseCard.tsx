"use client";

/**
 * 미션 3(보건실)의 상황 카드 한 장.
 *
 * 무엇을 하나:
 *   상황을 보여주고 학생에게 두 번 묻습니다.
 *     ① 바로 할 처치는? (선택지 4개)
 *     ② 그 다음 조치는? (선택지 4개)
 *   ①을 고른 뒤에야 ②가 나타납니다.
 *
 * 왜 팝업이 아니라 그 자리에서 알려주나:
 *   보건실은 "따뜻한 곳"이라는 분위기가 중요합니다.
 *   팝업으로 막아 세우면 혼나는 느낌이 들어서,
 *   고른 선택지 아래에 설명이 조용히 펼쳐지도록 했습니다.
 *   (응급실은 반대로 긴박해야 해서 팝업을 씁니다)
 *
 * 어떤 데이터를 받나:
 *   - healthCase : data/health-room-cases.ts 의 상황 하나
 *
 * ⚠️ 정답은 이 카드가 모릅니다. 판정은 lib/health-room.ts 가 합니다.
 *
 * 감정 톤: 따뜻하고 안심되는 분위기.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import type { HealthRoomCase } from "@/data/health-room-cases";
import { isCorrectFollowUp, isCorrectTreatment } from "@/lib/health-room";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./HealthRoomCaseCard.module.css";

type HealthRoomCaseCardProps = {
  healthCase: HealthRoomCase;
  /** 몇 번째 상황인지 (1부터) */
  position: number;
  total: number;
  /** 학생이 고른 처치. 아직 안 골랐으면 null. */
  treatmentId: string | null;
  /** 학생이 고른 다음 조치. 아직 안 골랐으면 null. */
  followUpId: string | null;
  onPickTreatment: (choiceId: string) => void;
  onPickFollowUp: (choiceId: string) => void;
  onNext: () => void;
  isLast: boolean;
};

export function HealthRoomCaseCard({
  healthCase,
  position,
  total,
  treatmentId,
  followUpId,
  onPickTreatment,
  onPickFollowUp,
  onNext,
  isLast,
}: HealthRoomCaseCardProps) {
  const treatmentAnswered = treatmentId !== null;
  const followUpAnswered = followUpId !== null;

  return (
    <div className={styles.card}>
      <p className={styles.position}>
        {position}번째 친구 · 전체 {total}명
      </p>
      <h2 className={styles.title}>{healthCase.title}</h2>
      <p className={styles.situation}>{healthCase.situation}</p>

      <section
        className={styles.healthScene}
        data-phase={!treatmentAnswered ? "observe" : !followUpAnswered ? "treat" : "follow-up"}
        aria-label={
          !treatmentAnswered
            ? "보건실에서 친구 상태를 살피는 단계"
            : !followUpAnswered
              ? "첫 처치를 하고 다음 행동을 판단하는 단계"
              : "처치와 후속 행동을 마친 단계"
        }
      >
        <div className={styles.sceneFloor} aria-hidden="true" />
        <div className={styles.sceneBed} aria-hidden="true">
          <span className={styles.scenePillow} />
          <span className={styles.sceneStudent} />
        </div>
        <div className={styles.sceneNurse} aria-hidden="true">
          <span className={styles.nurseHead} />
          <span className={styles.nurseBody}>+</span>
        </div>
        <div className={styles.sceneCabinet} aria-hidden="true">+</div>
        <div className={styles.sceneSink} aria-hidden="true" />
        <div className={styles.sceneDesk} aria-hidden="true" />
        <p className={styles.sceneStatus}>
          <span>보건실 현장</span>
          <strong>
            {!treatmentAnswered
              ? "친구 상태 살피기"
              : !followUpAnswered
                ? "첫 처치 완료 · 다음 행동 판단"
                : "관찰 기록 완료"}
          </strong>
        </p>
      </section>

      {/* ① 바로 할 처치 */}
      <section className={styles.question}>
        <h3 className={styles.questionLabel}>① 지금 바로 무엇을 해줄까요?</h3>
        <ul className={styles.choiceList}>
          {healthCase.treatmentChoices.map((choice) => {
            const picked = treatmentId === choice.id;
            const state = !treatmentAnswered
              ? "open"
              : choice.isCorrect
                ? "correct"
                : picked
                  ? "wrong"
                  : "dimmed";

            return (
              <li key={choice.id}>
                <button
                  type="button"
                  className={styles.choice}
                  data-state={state}
                  disabled={treatmentAnswered}
                  onClick={() => onPickTreatment(choice.id)}
                >
                  <span className={styles.choiceMark} aria-hidden="true">
                    {state === "correct" ? "⭕" : state === "wrong" ? "❌" : ""}
                  </span>
                  <span className={styles.choiceLabel}>{choice.label}</span>
                </button>

                {/* 고른 것과 정답에만 설명을 펼칩니다 */}
                {treatmentAnswered && (picked || choice.isCorrect) ? (
                  <p className={styles.explanation} data-correct={choice.isCorrect}>
                    {choice.explanation}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ② 그 다음 조치 — ①을 고른 뒤에 나타납니다 */}
      {treatmentAnswered ? (
        <section className={styles.question}>
          <h3 className={styles.questionLabel}>② 그 다음에는 무엇을 할까요?</h3>
          <ul className={styles.choiceList}>
            {healthCase.followUpChoices.map((choice) => {
              const picked = followUpId === choice.id;
              const state = !followUpAnswered
                ? "open"
                : choice.isCorrect
                  ? "correct"
                  : picked
                    ? "wrong"
                    : "dimmed";

              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    className={styles.choice}
                    data-state={state}
                    disabled={followUpAnswered}
                    onClick={() => onPickFollowUp(choice.id)}
                  >
                    <span className={styles.choiceMark} aria-hidden="true">
                      {state === "correct" ? "⭕" : state === "wrong" ? "❌" : ""}
                    </span>
                    <span className={styles.choiceLabel}>{choice.label}</span>
                  </button>

                  {followUpAnswered && (picked || choice.isCorrect) ? (
                    <p
                      className={styles.explanation}
                      data-correct={choice.isCorrect}
                    >
                      {choice.explanation}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* 둘 다 골랐으면 다음으로 */}
      {treatmentAnswered && followUpAnswered ? (
        <div className={styles.nextArea}>
          <p className={styles.summary}>
            처치 {isCorrectTreatment(healthCase.id, treatmentId) ? "⭕" : "❌"}{" "}
            · 다음 조치{" "}
            {isCorrectFollowUp(healthCase.id, followUpId) ? "⭕" : "❌"}
          </p>
          <PrimaryButton fullWidth onClick={onNext}>
            {isLast ? "보건실 정리하기" : "다음 친구 맞이하기"}
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
