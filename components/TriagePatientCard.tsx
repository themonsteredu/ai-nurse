"use client";

/**
 * 미션 1의 TRIAGE PATIENT PANEL.
 * 환자 정보와 활력징후를 보여줄 뿐, 분류 정답과 채점에는 관여하지 않습니다.
 */

import Image from "next/image";
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

const PATIENT_SCENES: Record<string, string> = {
  "er-01": "/assets/nurse/triage-er-01.webp",
  "er-02": "/assets/nurse/triage-er-02.webp",
  "er-03": "/assets/nurse/triage-er-03.webp",
  "er-04": "/assets/nurse/health-sprain.webp",
  "er-05": "/assets/nurse/triage-er-05.webp",
  "er-06": "/assets/nurse/triage-er-06.webp",
  "er-07": "/assets/nurse/triage-er-07.webp",
  "er-08": "/assets/nurse/health-burn.webp",
  "er-09": "/assets/nurse/triage-er-09.webp",
  "er-10": "/assets/nurse/triage-er-10.webp",
};

function VitalGlyph({ kind }: { kind: VitalKind }) {
  return (
    <svg className={styles.vitalGlyph} viewBox="0 0 24 24" aria-hidden="true">
      {kind === "pulse" ? (
        <path d="M12 20.2S4 15.2 4 9.1A4.2 4.2 0 0 1 11.3 6L12 7l.7-1A4.2 4.2 0 0 1 20 9.1c0 6.1-8 11.1-8 11.1Z" />
      ) : null}
      {kind === "oxygen" ? (
        <><circle cx="12" cy="12" r="7.5" /><path d="M12 2.5v3m0 13v3M2.5 12h3m13 0h3" /></>
      ) : null}
      {kind === "respiration" ? (
        <path d="M3 9c2.2-2.4 4.5-2.4 6.7 0s4.5 2.4 6.6 0S20.7 6.6 22 8m-19 7c2.2-2.4 4.5-2.4 6.7 0s4.5 2.4 6.6 0 4.4-2.4 5.7-1" />
      ) : null}
      {kind === "temperature" ? (
        <><path d="M10 14.3V5.5a2 2 0 0 1 4 0v8.8a4 4 0 1 1-4 0Z" /><path d="M12 8v8" /></>
      ) : null}
    </svg>
  );
}

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
  const patientNumber = String(patient.order).padStart(2, "0");
  const sceneSrc = PATIENT_SCENES[patient.id] ?? "/assets/nurse/triage-briefing-v2.webp";

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
      <section className={styles.patientScene} aria-label={patient.illustrationHint}>
        <Image
          className={styles.sceneImage}
          src={sceneSrc}
          alt=""
          fill
          priority={patient.order === 1}
          sizes="(max-width: 760px) 100vw, 55vw"
          draggable={false}
        />
        <div className={styles.sceneShade} aria-hidden="true" />
        <p className={styles.sceneCaption}>
          <span>PATIENT {patientNumber}</span>
          <strong>{patient.name}</strong>
        </p>
      </section>

      <section className={styles.assessment}>
        <div className={styles.patientCopy}>
          <p className={styles.patientNumber}>증상</p>
          <p className={styles.symptom}>{patient.symptom}</p>
          {draggable ? <p className={styles.hint}>패널을 끌거나 아래 우선순위를 누르세요</p> : null}
        </div>

        {showVitals ? (
          <div className={styles.vitalsPanel} aria-label="활력징후">
            <p className={styles.vitalsLabel}>VITALS <span>LIVE</span></p>
            <dl className={styles.vitals}>
              <div className={styles.vitalItem} data-tone={vitalTone("pulse", patient.vitals.pulse)}>
                <dt><VitalGlyph kind="pulse" /><span>HEART RATE<small>맥박</small></span></dt>
                <dd>{patient.vitals.pulse}</dd>
              </div>
              <div className={styles.vitalItem} data-tone={vitalTone("oxygen", patient.vitals.oxygen)}>
                <dt><VitalGlyph kind="oxygen" /><span>SpO₂<small>산소포화도</small></span></dt>
                <dd>{patient.vitals.oxygen}</dd>
              </div>
              <div className={styles.vitalItem} data-tone={vitalTone("respiration", patient.vitals.respiration)}>
                <dt><VitalGlyph kind="respiration" /><span>RESP<small>호흡</small></span></dt>
                <dd>{patient.vitals.respiration}</dd>
              </div>
              <div className={styles.vitalItem} data-tone={vitalTone("temperature", patient.vitals.temperature)}>
                <dt><VitalGlyph kind="temperature" /><span>TEMP<small>체온</small></span></dt>
                <dd>{patient.vitals.temperature}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>
    </div>
  );
}
