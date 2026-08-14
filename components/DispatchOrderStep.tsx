"use client";

/**
 * 미션 2 ①번 과제 — 쓰러진 사람을 발견했을 때 행동 순서 맞추기.
 *
 * 학생은 섞인 행동을 드래그하지 않고 순서대로 누릅니다.
 * 정답 순서와 채점은 data/ 및 lib/가 담당하며 이 화면은 표현만 담당합니다.
 */

import Image from "next/image";
import { useMemo, useState } from "react";

import type { DispatchStep } from "@/data/dispatch-steps";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./DispatchOrderStep.module.css";

type DispatchOrderStepProps = {
  steps: DispatchStep[];
  onFinish: (arrangedIds: string[]) => void;
};

const SCENE_STATUS = [
  "주변 위험 요소 확인 전",
  "안전 확인 · 반응 평가 대기",
  "반응 확인 · 도움 요청 대기",
  "119 신고 · 호흡 확인 대기",
  "호흡 확인 · 가슴압박 대기",
  "현장 대응 순서 결정 완료",
];

function shuffleSteps(steps: DispatchStep[]): DispatchStep[] {
  if (steps.length < 3) return steps;
  const order = [2, 4, 0, 3, 1];
  return order
    .filter((index) => index < steps.length)
    .map((index) => steps[index])
    .concat(steps.slice(order.length));
}

function DispatchIcon({ stepId }: { stepId: string }) {
  if (stepId.includes("safety")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (stepId.includes("response")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 11V7.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M11 9V6.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M14 9V7.5a1.5 1.5 0 0 1 3 0v5" />
        <path d="M8 10.5 6.6 9.1a1.6 1.6 0 0 0-2.3 2.2l4.9 6.1A4 4 0 0 0 12.3 19H15a4 4 0 0 0 4-4v-3" />
      </svg>
    );
  }

  if (stepId.includes("call")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 3.8 10 7.2 8.4 9.3a14 14 0 0 0 6.3 6.3l2.1-1.6 3.4 2.8-1.2 3a2 2 0 0 1-2.1 1.2C9.5 20 4 14.5 3 7.1a2 2 0 0 1 1.2-2.1l3-1.2Z" />
      </svg>
    );
  }

  if (stepId.includes("breathing")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12s3.4-5 9-5 9 5 9 5-3.4 5-9 5-9-5-9-5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 12h10M12 7v10" />
      <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function DispatchOrderStep({ steps, onFinish }: DispatchOrderStepProps) {
  const shuffled = useMemo(() => shuffleSteps(steps), [steps]);
  const [arranged, setArranged] = useState<string[]>([]);

  const remaining = shuffled.filter((step) => !arranged.includes(step.id));
  const isComplete = arranged.length === steps.length;
  const currentStage = Math.min(arranged.length, steps.length);

  function handlePick(stepId: string) {
    setArranged((current) =>
      current.includes(stepId) ? current : [...current, stepId],
    );
  }

  function handleUndo(stepId: string) {
    setArranged((current) => current.filter((id) => id !== stepId));
  }

  return (
    <div className={styles.layout}>
      <p className={styles.instruction}>
        길에서 사람이 쓰러졌습니다. <strong>가장 먼저 할 행동부터</strong>{" "}
        순서대로 선택하세요.
      </p>

      <section
        className={styles.scene}
        aria-label={`응급 대응 훈련 현장. ${currentStage}단계까지 선택함`}
      >
        <Image
          className={styles.sceneImage}
          src="/assets/nurse/dispatch-scene.webp"
          alt="야외 응급 대응 훈련장에서 주변 안전을 확인하는 훈련생들"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 58vw"
        />
        <div className={styles.sceneCallout}>
          <span>SCENE STATUS</span>
          <strong>{SCENE_STATUS[currentStage]}</strong>
          <small>TRAINING ENVIRONMENT · NON-GRAPHIC</small>
        </div>
      </section>

      <section className={styles.workspace} aria-labelledby="response-sequence-title">
        <div className={styles.decisionHeader}>
          <p>RESPONSE SEQUENCE</p>
          <h2 id="response-sequence-title">
            {isComplete ? "대응 순서를 확인하세요" : `${currentStage + 1}번째 행동을 선택하세요`}
          </h2>
        </div>

        <ol className={styles.progress} aria-label="선택 순서">
          {steps.map((step, index) => {
            const chosenId = arranged[index];
            const state =
              index < currentStage
                ? "done"
                : index === currentStage && !isComplete
                  ? "current"
                  : "waiting";

            return (
              <li key={step.id} data-state={state}>
                {chosenId ? (
                  <button
                    type="button"
                    onClick={() => handleUndo(chosenId)}
                    aria-label={`${index + 1}번째 선택 취소`}
                  >
                    {index + 1}
                  </button>
                ) : (
                  <span>{index + 1}</span>
                )}
              </li>
            );
          })}
        </ol>

        {arranged.length > 0 ? (
          <ol className={styles.chosenTrail} aria-label="지금까지 고른 행동">
            {arranged.map((stepId, index) => {
              const step = steps.find((item) => item.id === stepId);
              if (!step) return null;
              return (
                <li key={stepId}>
                  <button type="button" onClick={() => handleUndo(stepId)}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span>{step.label}</span>
                    <small>취소</small>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}

        {remaining.length > 0 ? (
          <div className={styles.pool}>
            <p className={styles.poolLabel}>ACTION OPTIONS</p>
            <ul className={styles.poolList}>
              {remaining.map((step) => (
                <li key={step.id}>
                  <button
                    type="button"
                    className={styles.poolCard}
                    onClick={() => handlePick(step.id)}
                  >
                    <span className={styles.actionIcon}>
                      <DispatchIcon stepId={step.id} />
                    </span>
                    <span>{step.label}</span>
                    <i aria-hidden="true">→</i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <PrimaryButton
          fullWidth
          disabled={!isComplete}
          onClick={() => onFinish(arranged)}
        >
          {isComplete ? "이 순서로 결정" : `${steps.length - arranged.length}개 행동이 남았습니다`}
        </PrimaryButton>
      </section>
    </div>
  );
}
