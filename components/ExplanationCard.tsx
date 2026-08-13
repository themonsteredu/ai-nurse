"use client";

/**
 * 환자를 구역에 놓은 직후 바로 뜨는 해설 카드.
 *
 * 무엇을 하나:
 *   맞았는지 틀렸는지 알려주고, 왜 그런지 설명합니다.
 *   틀렸으면 정답이 어느 구역이었는지도 보여줍니다.
 *
 * 왜 바로 띄우나:
 *   기획서에 "틀리면 즉시 해설 카드를 띄운다"고 되어 있습니다.
 *   이 수업의 목적이 "틀리면서 배우는 것"이라서,
 *   틀린 순간에 바로 알려주는 게 가장 잘 남습니다.
 *
 * 어떤 데이터를 받나:
 *   - correct       : 맞았는지
 *   - chosenZone    : 학생이 고른 구역
 *   - correctZone   : 실제 정답 구역
 *   - explanation   : 해설 문구 (data/triage-patients.ts 에서 옴)
 *
 * ⚠️ 이 카드가 떠 있는 동안 제한시간은 멈춥니다.
 *    읽는 시간 때문에 점수가 깎이면 안 되기 때문입니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

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
  /** 마지막 환자였으면 버튼 글자가 달라집니다 */
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
        <p className={styles.verdict}>
          {correct ? "잘했어요!" : "다시 볼까요?"}
        </p>

        <p className={styles.patient}>{patientName}</p>

        {!correct ? (
          <p className={styles.zoneCompare}>
            <span className={styles.chosen} data-level={chosenZone}>
              고른 곳: {TRIAGE_ZONES[chosenZone].label}
            </span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
            <span className={styles.answer} data-level={correctZone}>
              정답: {TRIAGE_ZONES[correctZone].label}
            </span>
          </p>
        ) : (
          <p className={styles.zoneCompare}>
            <span className={styles.answer} data-level={correctZone}>
              {TRIAGE_ZONES[correctZone].label}
            </span>
          </p>
        )}

        <p className={styles.explanation}>{explanation}</p>

        <PrimaryButton fullWidth onClick={onNext} autoFocus>
          {isLast ? "결과 보기" : "다음 환자"}
        </PrimaryButton>
      </div>
    </div>
  );
}
