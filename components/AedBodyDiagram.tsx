"use client";

/**
 * 미션 2 ③번 과제 — 자동심장충격기(AED) 패드 붙일 자리 고르기.
 *
 * 무엇을 하나:
 *   위에서 본 상반신 그림 위에 붙일 수 있는 자리가 여러 개 있고,
 *   학생이 그중 두 곳을 골라 패드를 붙입니다.
 *
 * 어떻게 만들었나 (코덱스가 알아야 할 구조):
 *   1) 뒤쪽 SVG = 사람 몸 그림 (그림만, 누를 수 없음)
 *   2) 앞쪽 버튼 = 붙일 수 있는 자리들 (진짜 버튼이라 키보드로도 됨)
 *   자리의 위치는 data/aed-pads.ts 에 그림 대비 퍼센트(%)로 적혀 있어서,
 *   몸 그림을 새로 그려도 비율만 맞으면 그대로 동작합니다.
 *
 * ⚠️ 정답 자리는 이 파일이 모릅니다.
 *    data/aed-pads.ts 에 있고, 판정은 lib/ambulance.ts 가 합니다.
 *
 * ⚠️ 사실적인 몸 그림을 쓰지 않습니다. 단순한 실루엣만 씁니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import { AED_PAD_SPOTS, AED_PAD_COUNT } from "@/data/aed-pads";

import styles from "./AedBodyDiagram.module.css";

type AedBodyDiagramProps = {
  /** 학생이 지금까지 고른 자리 id 목록 */
  selectedIds: string[];
  /** 답을 확인한 뒤인지 (맞고 틀림을 표시할지) */
  revealed: boolean;
  onSelectSpot: (spotId: string) => void;
};

export function AedBodyDiagram({
  selectedIds,
  revealed,
  onSelectSpot,
}: AedBodyDiagramProps) {
  const full = selectedIds.length >= AED_PAD_COUNT;

  return (
    <div className={styles.diagram}>
      {/* ---------- 뒤쪽: 사람 몸 그림 (누를 수 없는 배경) ---------- */}
      <svg
        className={styles.body}
        viewBox="0 0 200 260"
        aria-hidden="true"
        focusable="false"
      >
        {/* 머리 */}
        <circle cx="100" cy="34" r="26" className={styles.bodyShape} />
        {/* 목 */}
        <rect x="88" y="56" width="24" height="16" className={styles.bodyShape} />
        {/* 몸통 */}
        <path
          d="M62 72 Q100 62 138 72 L146 168 Q100 180 54 168 Z"
          className={styles.bodyShape}
        />
        {/* 팔 */}
        <path d="M62 76 L38 96 L32 160 L48 162 L58 104 Z" className={styles.bodyShape} />
        <path d="M138 76 L162 96 L168 160 L152 162 L142 104 Z" className={styles.bodyShape} />
        {/* 다리 */}
        <path d="M78 176 L72 250 L92 250 L98 180 Z" className={styles.bodyShape} />
        <path d="M122 176 L128 250 L108 250 L102 180 Z" className={styles.bodyShape} />
        {/* 가슴 한가운데 기준선 */}
        <line x1="100" y1="80" x2="100" y2="160" className={styles.centerLine} />
      </svg>

      {/* ---------- 앞쪽: 붙일 수 있는 자리 ---------- */}
      {AED_PAD_SPOTS.map((spot) => {
        const selected = selectedIds.includes(spot.id);
        const state = revealed
          ? spot.isCorrect
            ? "correct"
            : selected
              ? "wrong"
              : "idle"
          : selected
            ? "selected"
            : "idle";

        return (
          <button
            key={spot.id}
            type="button"
            className={styles.spot}
            data-state={state}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            disabled={revealed || (full && !selected)}
            onClick={() => onSelectSpot(spot.id)}
            aria-label={`${spot.label}에 패드 붙이기`}
            aria-pressed={selected}
          >
            <span className={styles.spotMark} aria-hidden="true">
              {revealed && spot.isCorrect
                ? "✓"
                : revealed && selected
                  ? "✕"
                  : selected
                    ? "＋"
                    : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
