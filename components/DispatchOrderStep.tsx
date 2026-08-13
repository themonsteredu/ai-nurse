"use client";

/**
 * 미션 2 ①번 과제 — 쓰러진 사람을 발견했을 때 행동 순서 맞추기.
 *
 * 무엇을 하나:
 *   섞여 있는 카드 5장을 학생이 올바른 순서로 눌러서 배열합니다.
 *
 * 왜 드래그가 아니라 "순서대로 누르기" 인가:
 *   태블릿에서 카드를 위아래로 끌어 순서를 바꾸는 건 초등학생에게 어렵습니다.
 *   순서대로 한 장씩 누르는 방식이 훨씬 쉽고, 키보드로도 됩니다.
 *   잘못 누르면 방금 놓은 카드를 눌러서 되돌릴 수 있습니다.
 *
 * 어떤 데이터를 받나:
 *   - steps : data/dispatch-steps.ts 의 카드 목록 (정답 순서로 정렬되어 옴)
 *   → 화면에는 섞어서 보여줍니다.
 *
 * ⚠️ 정답 순서는 이 파일이 모릅니다. 채점은 lib/ambulance.ts 가 합니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import { useMemo, useState } from "react";

import type { DispatchStep } from "@/data/dispatch-steps";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./DispatchOrderStep.module.css";

type DispatchOrderStepProps = {
  steps: DispatchStep[];
  /** 학생이 정한 순서를 넘겨줍니다. 채점은 부모가 합니다. */
  onFinish: (arrangedIds: string[]) => void;
};

/**
 * 카드를 섞습니다.
 * 정답 순서 그대로 나오면 문제가 되지 않으므로, 한 칸씩 밀어서 섞습니다.
 * (매번 같은 순서로 섞여서 강사가 수업 중 헷갈리지 않습니다)
 */
function shuffleSteps(steps: DispatchStep[]): DispatchStep[] {
  if (steps.length < 3) return steps;
  const order = [2, 4, 0, 3, 1];
  return order
    .filter((index) => index < steps.length)
    .map((index) => steps[index])
    .concat(steps.slice(order.length));
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
        길에서 사람이 쓰러졌어요. <strong>가장 먼저 할 일부터</strong> 차례로
        눌러주세요.
      </p>

      <section
        className={styles.scene}
        data-stage={currentStage}
        aria-label={`현장 대응 ${currentStage}단계까지 선택함`}
      >
        <div className={styles.sidewalk} aria-hidden="true" />
        <div className={styles.road} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className={styles.victim} aria-hidden="true">
          <span className={styles.victimHead} />
          <span className={styles.victimBody} />
        </div>
        <div className={styles.responder} aria-hidden="true">
          <span className={styles.responderHead} />
          <span className={styles.responderBody} />
        </div>
        <div className={styles.phone} aria-hidden="true">119</div>
        <div className={styles.sceneCallout}>
          <span>현장 대응판</span>
          <strong>{isComplete ? "출동 준비 완료" : `${currentStage + 1}번째 행동을 판단하세요`}</strong>
          <div className={styles.sceneProgress} aria-hidden="true">
            {steps.map((step, index) => (
              <i
                key={step.id}
                data-state={index < currentStage ? "done" : index === currentStage ? "current" : "waiting"}
              >
                {index + 1}
              </i>
            ))}
          </div>
        </div>
      </section>

      {/* 학생이 정한 순서 */}
      <ol className={styles.arrangedList}>
        {arranged.map((stepId, index) => {
          const step = steps.find((item) => item.id === stepId);
          if (!step) return null;
          return (
            <li key={stepId}>
              <button
                type="button"
                className={styles.arrangedCard}
                onClick={() => handleUndo(stepId)}
                aria-label={`${index + 1}번째: ${step.label}. 누르면 되돌립니다.`}
              >
                <span className={styles.orderBadge}>{index + 1}</span>
                <span className={styles.cardLabel}>{step.label}</span>
                <span className={styles.undoHint}>되돌리기</span>
              </button>
            </li>
          );
        })}

        {/* 아직 안 채운 자리 */}
        {Array.from({ length: steps.length - arranged.length }, (_, index) => (
          <li key={`empty-${index}`}>
            <div className={styles.emptySlot}>
              <span className={styles.orderBadge} data-empty="true">
                {arranged.length + index + 1}
              </span>
              <span className={styles.emptyText}>여기에 들어갈 차례</span>
            </div>
          </li>
        ))}
      </ol>

      {/* 아직 안 고른 카드들 */}
      {remaining.length > 0 ? (
        <div className={styles.pool}>
          <p className={styles.poolLabel}>고를 카드</p>
          <ul className={styles.poolList}>
            {remaining.map((step) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={styles.poolCard}
                  onClick={() => handlePick(step.id)}
                >
                  {step.label}
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
        {isComplete ? "이 순서로 결정" : "카드를 모두 놓아주세요"}
      </PrimaryButton>
    </div>
  );
}
