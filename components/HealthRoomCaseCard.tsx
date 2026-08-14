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

import Image from "next/image";

import type { HealthRoomCase } from "@/data/health-room-cases";
import { isCorrectFollowUp, isCorrectTreatment } from "@/lib/health-room";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./HealthRoomCaseCard.module.css";

const HEALTH_CASE_SCENES: Record<
  string,
  { src: string; alt: string; status: string }
> = {
  "hr-nosebleed": {
    src: "/assets/nurse/health-nosebleed.webp",
    alt: "고개를 앞으로 숙이고 코를 잡는 학생에게 간호사가 거즈를 건네는 훈련 장면",
    status: "코피 자세 확인",
  },
  "hr-burn": {
    src: "/assets/nurse/health-burn.webp",
    alt: "학생이 손등을 흐르는 찬물에 식히도록 간호사가 안내하는 훈련 장면",
    status: "화상 부위 냉각",
  },
  "hr-sprain": {
    src: "/assets/nurse/health-sprain.webp",
    alt: "학생의 발목을 올리고 천으로 감싼 냉찜질 팩을 대는 간호사",
    status: "발목 보호와 냉찜질",
  },
  "hr-beesting": {
    src: "/assets/nurse/health-beesting.webp",
    alt: "학생의 팔에 납작한 카드로 벌침 제거 방법을 보여주는 간호사",
    status: "벌침 제거 방법 확인",
  },
  "hr-hyperventilation": {
    src: "/assets/nurse/health-hyperventilation.webp",
    alt: "긴장한 학생과 눈높이를 맞추고 천천히 호흡하도록 세어주는 간호사",
    status: "호흡 안정 돕기",
  },
};

const FALLBACK_SCENE = {
  src: "/assets/nurse/health-room.webp",
  alt: "보건실에서 학생의 상태를 확인하는 간호사",
  status: "친구 상태 살피기",
};

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
  const scene = HEALTH_CASE_SCENES[healthCase.id] ?? FALLBACK_SCENE;

  return (
    <div className={styles.card}>
      <p className={styles.position}>
        {position}번째 친구 · 전체 {total}명
      </p>
      <h2 className={styles.title}>{healthCase.title}</h2>
      <p className={styles.situation}>{healthCase.situation}</p>

      <section
        className={styles.healthScene}
        data-case={healthCase.id}
        data-phase={!treatmentAnswered ? "observe" : !followUpAnswered ? "treat" : "follow-up"}
        aria-label={
          !treatmentAnswered
            ? "보건실에서 친구 상태를 살피는 단계"
            : !followUpAnswered
              ? "첫 처치를 하고 다음 행동을 판단하는 단계"
              : "처치와 후속 행동을 마친 단계"
        }
      >
        <Image
          className={styles.sceneImage}
          src={scene.src}
          alt={scene.alt}
          fill
          sizes="(max-width: 760px) 100vw, 900px"
        />
        <p className={styles.sceneStatus}>
          <span>CARE SCENE</span>
          <strong>
            {!treatmentAnswered
              ? scene.status
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
                    {state === "correct" ? "✓" : state === "wrong" ? "×" : ""}
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
                      {state === "correct" ? "✓" : state === "wrong" ? "×" : ""}
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
            처치 {isCorrectTreatment(healthCase.id, treatmentId) ? "적절" : "다시 확인"}{" "}
            · 다음 조치{" "}
            {isCorrectFollowUp(healthCase.id, followUpId) ? "적절" : "다시 확인"}
          </p>
          <PrimaryButton fullWidth onClick={onNext}>
            {isLast ? "보건실 정리하기" : "다음 친구 맞이하기"}
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
