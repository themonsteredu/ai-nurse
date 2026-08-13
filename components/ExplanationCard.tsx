"use client";

import { TRIAGE_ZONES } from "@/data/triage-zones";
import type { TriageLevel } from "@/data/types";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./ExplanationCard.module.css";

type ExplanationCardProps = {
  correct: boolean;
  chosenZone: TriageLevel;
  correctZone: TriageLevel;
  patientName: string;
  explanation: string;
  isLast: boolean;
  onNext: () => void;
};

export function ExplanationCard({
  correct,
  chosenZone,
  correctZone,
  patientName,
  explanation,
  isLast,
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

        <PrimaryButton fullWidth onClick={onNext} autoFocus>
          {isLast ? "결과 확인" : "다음 환자 확인"}
        </PrimaryButton>
      </div>
    </div>
  );
}
