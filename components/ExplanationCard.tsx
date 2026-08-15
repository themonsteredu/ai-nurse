"use client";

import { TRIAGE_ZONES } from "@/data/triage-zones";
import type { TriageLevel } from "@/data/types";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./ExplanationCard.module.css";

type ActionId = "airway" | "bleeding" | "monitor" | "guidance";

type ActionOption = {
  id: ActionId;
  label: string;
  caption: string;
};

type ExplanationCardProps = {
  correct: boolean;
  chosenZone: TriageLevel;
  correctZone: TriageLevel;
  patientName: string;
  explanation: string;
  isLast: boolean;
  actions: ActionOption[];
  actionCompleted: boolean;
  actionMessage: string | null;
  onAction: (actionId: ActionId) => void;
  onNext: () => void;
};

export function ExplanationCard({
  correct,
  chosenZone,
  correctZone,
  patientName,
  explanation,
  isLast,
  actions,
  actionCompleted,
  actionMessage,
  onAction,
  onNext,
}: ExplanationCardProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.card} data-correct={correct}>
        <p className={styles.eyebrow}>
          {correct ? "PRIORITY CONFIRMED" : "CLINICAL REVIEW"}
        </p>
        <p className={styles.verdict}>{TRIAGE_ZONES[correctZone].label}</p>
        <p className={styles.patient}>{patientName}</p>

        {!correct ? (
          <div className={styles.zoneCompare}>
            <p className={styles.chosen} data-level={chosenZone}>
              <span>SELECTED</span>
              <strong>{TRIAGE_ZONES[chosenZone].label}</strong>
            </p>
            <span className={styles.arrow} aria-hidden="true">→</span>
            <p className={styles.answer} data-level={correctZone}>
              <span>RECOMMENDED</span>
              <strong>{TRIAGE_ZONES[correctZone].label}</strong>
            </p>
          </div>
        ) : null}

        <section className={styles.judgment}>
          <h2>간호사의 판단</h2>
          <p>{explanation}</p>
        </section>

        <section className={styles.firstAction} aria-labelledby="first-action-title">
          <p className={styles.actionEyebrow}>STEP 03 · FIRST ACTION</p>
          <h2 id="first-action-title">분류 직후 가장 먼저 할 행동은?</h2>
          <div className={styles.actionGrid}>
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={styles.actionButton}
                disabled={actionCompleted}
                onClick={() => onAction(action.id)}
              >
                <strong>{action.label}</strong>
                <span>{action.caption}</span>
              </button>
            ))}
          </div>
          {actionMessage ? (
            <p className={styles.actionStatus} data-complete={actionCompleted} aria-live="polite">
              {actionMessage}
            </p>
          ) : null}
        </section>

        <PrimaryButton fullWidth onClick={onNext} disabled={!actionCompleted}>
          {actionCompleted
            ? isLast ? "결과 확인" : "다음 환자 확인"
            : "처치를 완료하세요"}
        </PrimaryButton>
      </div>
    </div>
  );
}
