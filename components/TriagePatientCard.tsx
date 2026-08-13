"use client";

/**
 * 미션 1의 TRIAGE PATIENT PANEL.
 * 환자 정보와 활력징후를 보여줄 뿐, 분류 정답과 채점에는 관여하지 않습니다.
 */

import type { PointerEvent as ReactPointerEvent } from "react";

import type { TriagePatient } from "@/data/triage-patients";

import styles from "./TriagePatientCard.module.css";

type TriagePatientCardProps = {
  patient: TriagePatient;
  showVitals: boolean;
  draggable: boolean;
  dragging?: boolean;
  dragStyle?: { left: number; top: number; width: number };
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

type VitalKind = "temperature" | "pulse" | "respiration" | "oxygen";
type VitalTone = "normal" | "warning" | "critical";

/** 시각적 강조만 정합니다. 점수·정답 판정에는 사용되지 않습니다. */
function vitalTone(kind: VitalKind, rawValue: string): VitalTone {
  const value = Number.parseFloat(rawValue.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(value)) return "normal";

  if (kind === "oxygen") {
    if (value < 90) return "critical";
    if (value < 95) return "warning";
  }
  if (kind === "pulse") {
    if (value < 50 || value > 120) return "critical";
    if (value < 60 || value > 100) return "warning";
  }
  if (kind === "respiration") {
    if (value < 8 || value > 30) return "critical";
    if (value < 12 || value > 24) return "warning";
  }
  if (kind === "temperature") {
    if (value < 36 || value >= 39) return "critical";
    if (value >= 38) return "warning";
  }
  return "normal";
}

export function TriagePatientCard({
  patient,
  showVitals,
  draggable,
  dragging = false,
  dragStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: TriagePatientCardProps) {
  return (
    <div
      className={styles.card}
      data-dragging={dragging}
      data-draggable={draggable}
      data-vitals={showVitals}
      style={
        dragging && dragStyle
          ? {
              position: "fixed",
              left: dragStyle.left,
              top: dragStyle.top,
              width: dragStyle.width,
              margin: 0,
            }
          : undefined
      }
      onPointerDown={draggable ? onPointerDown : undefined}
      onPointerMove={draggable ? onPointerMove : undefined}
      onPointerUp={draggable ? onPointerUp : undefined}
      onPointerCancel={draggable ? onPointerUp : undefined}
    >
      <section className={styles.profile}>
        <div
          className={styles.patientVisual}
          role="img"
          aria-label={patient.illustrationHint}
        >
          <span>{String(patient.order).padStart(2, "0")}</span>
          <small>CLINICAL<br />PROFILE</small>
        </div>

        <div className={styles.patientCopy}>
          <p className={styles.patientNumber}>
            PATIENT {String(patient.order).padStart(2, "0")}
          </p>
          <p className={styles.name}>{patient.name}</p>
          <p className={styles.symptom}>{patient.symptom}</p>
          {draggable ? (
            <p className={styles.hint}>패널을 끌거나 아래 우선순위를 누르세요</p>
          ) : null}
        </div>
      </section>

      {showVitals ? (
        <section className={styles.vitalsPanel} aria-label="활력징후">
          <p className={styles.vitalsLabel}>VITALS <span>LIVE</span></p>
          <dl className={styles.vitals}>
            <div className={styles.vitalItem} data-tone={vitalTone("pulse", patient.vitals.pulse)}>
              <dt><b aria-hidden="true">♡</b><span>HEART RATE<small>맥박</small></span></dt>
              <dd>{patient.vitals.pulse}</dd>
            </div>
            <div className={styles.vitalItem} data-tone={vitalTone("oxygen", patient.vitals.oxygen)}>
              <dt><b aria-hidden="true">◌</b><span>SpO₂<small>산소포화도</small></span></dt>
              <dd>{patient.vitals.oxygen}</dd>
            </div>
            <div className={styles.vitalItem} data-tone={vitalTone("respiration", patient.vitals.respiration)}>
              <dt><b aria-hidden="true">≈</b><span>RESP<small>호흡</small></span></dt>
              <dd>{patient.vitals.respiration}</dd>
            </div>
            <div className={styles.vitalItem} data-tone={vitalTone("temperature", patient.vitals.temperature)}>
              <dt><b aria-hidden="true">°</b><span>TEMP<small>체온</small></span></dt>
              <dd>{patient.vitals.temperature}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
