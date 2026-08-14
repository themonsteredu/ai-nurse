"use client";

import Image from "next/image";
import { useState } from "react";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./AedOperationSequence.module.css";

const AED_OPERATION_STEPS = [
  {
    id: "power",
    label: "전원 켜기",
    detail: "AED 덮개를 열고 전원을 켭니다.",
    code: "POWER",
  },
  {
    id: "pads",
    label: "패드 연결 확인",
    detail: "그림에 맞게 붙인 두 패드와 케이블을 확인합니다.",
    code: "PADS",
  },
  {
    id: "clear",
    label: "모두 떨어지기",
    detail: "환자에게 손대는 사람이 없는지 큰 소리로 확인합니다.",
    code: "CLEAR",
  },
  {
    id: "analyze",
    label: "심장 리듬 분석",
    detail: "분석 중에는 환자에게 절대 손대지 않습니다.",
    code: "ANALYZE",
  },
  {
    id: "shock",
    label: "충격 버튼 누르기",
    detail: "AED가 충격을 지시한 경우에만 다시 안전을 확인하고 누릅니다.",
    code: "SHOCK",
  },
  {
    id: "resume",
    label: "가슴압박 재개",
    detail: "충격 직후 지체하지 않고 가슴압박을 다시 시작합니다.",
    code: "CPR",
  },
] as const;

const ACTION_ORDER = ["clear", "power", "shock", "pads", "resume", "analyze"];

type Feedback = {
  kind: "correct" | "retry";
  message: string;
} | null;

export function AedOperationSequence({ onFinish }: { onFinish: () => void }) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const currentStep = AED_OPERATION_STEPS[completedIds.length];
  const complete = completedIds.length === AED_OPERATION_STEPS.length;

  function handleSelect(stepId: string) {
    if (!currentStep || completedIds.includes(stepId)) return;

    if (stepId !== currentStep.id) {
      setFeedback({
        kind: "retry",
        message: `지금은 ‘${currentStep.label}’ 단계예요. 안전 순서를 다시 확인하세요.`,
      });
      return;
    }

    setCompletedIds((current) => [...current, stepId]);
    setFeedback({
      kind: "correct",
      message: currentStep.detail,
    });
  }

  return (
    <div className={styles.sequence}>
      <section className={styles.scene} aria-label="AED 훈련 장면">
        <Image
          className={styles.sceneImage}
          src="/assets/nurse/aed-operation-v2.webp"
          alt="패드가 연결된 훈련용 AED와 심폐소생술 마네킹"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 860px"
        />
        <div className={styles.sceneStatus} data-complete={complete}>
          <span>SIMULATION STATUS</span>
          <strong>
            {complete
              ? "AED 처치 완료"
              : `${String(completedIds.length + 1).padStart(2, "0")} / 06`}
          </strong>
        </div>
      </section>

      <section className={styles.control}>
        <div className={styles.progress} aria-label="AED 작동 진행률">
          {AED_OPERATION_STEPS.map((step, index) => {
            const done = completedIds.includes(step.id);
            const active = index === completedIds.length;
            return (
              <span
                key={step.id}
                className={styles.progressStep}
                data-done={done}
                data-active={active}
                aria-label={`${index + 1}단계 ${step.label}${done ? " 완료" : ""}`}
              />
            );
          })}
        </div>

        {complete ? (
          <div className={styles.completePanel} role="status">
            <p className={styles.completeEyebrow}>SEQUENCE COMPLETE</p>
            <h2>충격 후 즉시 가슴압박 재개</h2>
            <p>
              AED의 음성 안내를 따르면서 약 2분간 가슴압박을 계속하고,
              다시 분석할 때만 환자에게서 떨어집니다.
            </p>
            <PrimaryButton fullWidth onClick={onFinish}>
              미션 결과 보기
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className={styles.prompt}>
              <span>NEXT ACTION</span>
              <strong>{currentStep.label}</strong>
              <p>지금 해야 할 행동을 아래에서 선택하세요.</p>
            </div>

            <div className={styles.actions}>
              {ACTION_ORDER.map((stepId) => {
                const step = AED_OPERATION_STEPS.find((item) => item.id === stepId);
                if (!step) return null;
                const done = completedIds.includes(step.id);

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={styles.action}
                    data-done={done}
                    disabled={done}
                    onClick={() => handleSelect(step.id)}
                  >
                    <span className={styles.actionCode}>{step.code}</span>
                    <span className={styles.actionLabel}>{step.label}</span>
                    <span className={styles.actionState}>{done ? "완료" : "선택"}</span>
                  </button>
                );
              })}
            </div>

            <p
              className={styles.feedback}
              data-kind={feedback?.kind ?? "idle"}
              role="status"
              aria-live="polite"
            >
              {feedback?.message ?? "AED 음성 안내와 안전 확인을 함께 기억하세요."}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
