"use client";

/**
 * 미션 1(응급실)에서 학생이 옮기는 환자 카드.
 *
 * 무엇을 보여주나:
 *   환자 이름(40대 남성 등)과 증상.
 *   중등 모드에서는 활력징후(체온·맥박·호흡수·산소포화도)도 함께 보여줍니다.
 *
 * 어떤 데이터를 받나:
 *   - patient    : data/triage-patients.ts 의 환자 한 명
 *   - showVitals : 활력징후를 보여줄지 (중등 모드에서만 true)
 *   - draggable  : 지금 끌 수 있는 상태인지
 *
 * 조작 방법 (둘 다 됩니다):
 *   1) 카드를 구역으로 끌어다 놓기
 *   2) 구역을 그냥 누르기 — 드래그가 어려운 학생을 위한 방법
 *
 * ⚠️ 정답(어느 구역이 맞는지)은 이 카드가 모릅니다.
 *    채점은 lib/triage.ts 가 합니다.
 *
 * 감정 톤: 긴박함. 지금 이 사람을 어디로 보낼지 결정해야 하는 순간.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import type { PointerEvent as ReactPointerEvent } from "react";

import type { TriagePatient } from "@/data/triage-patients";

import styles from "./TriagePatientCard.module.css";

type TriagePatientCardProps = {
  patient: TriagePatient;
  showVitals: boolean;
  draggable: boolean;
  /** 지금 끌려가는 중인지 */
  dragging?: boolean;
  /** 끌려가는 중일 때 화면에서의 위치 */
  dragStyle?: { left: number; top: number; width: number };
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

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
      <span className={styles.stretcher} aria-hidden="true">
        <span className={styles.patientHead} />
        <span className={styles.patientBody} />
        <span className={styles.stretcherRail} />
      </span>
      <p className={styles.patientNumber}>{patient.order}번 환자 · 이동 침대</p>
      <p className={styles.name}>{patient.name}</p>
      <p className={styles.symptom}>{patient.symptom}</p>

      {showVitals ? (
        <dl className={styles.vitals}>
          <div className={styles.vitalItem}>
            <dt>체온</dt>
            <dd>{patient.vitals.temperature}</dd>
          </div>
          <div className={styles.vitalItem}>
            <dt>맥박</dt>
            <dd>{patient.vitals.pulse}</dd>
          </div>
          <div className={styles.vitalItem}>
            <dt>호흡</dt>
            <dd>{patient.vitals.respiration}</dd>
          </div>
          <div className={styles.vitalItem}>
            <dt>산소</dt>
            <dd>{patient.vitals.oxygen}</dd>
          </div>
        </dl>
      ) : null}

      {draggable ? (
        <p className={styles.hint}>
          카드를 아래 구역으로 끌거나, 구역을 눌러주세요
        </p>
      ) : null}
    </div>
  );
}
