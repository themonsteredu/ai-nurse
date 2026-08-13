"use client";

/**
 * 미션 1(응급실)에서 환자 카드를 놓는 색깔 구역.
 *
 * 무엇을 보여주나:
 *   구역 이름(지금 당장 / 몇 분 안에 / 빨리 / 기다려도 됨 / 가벼움)과
 *   그 구역의 판단 기준, 지금까지 이 구역에 놓인 환자 수.
 *
 * 어떤 데이터를 받나:
 *   - zone        : data/triage-zones.ts 의 구역 하나
 *   - placedCount : 이 구역에 지금까지 놓인 환자 수
 *   - isDropTarget: 지금 카드를 이 구역 위로 끌고 있는지
 *
 * 조작 방법:
 *   카드를 여기로 끌어다 놓거나, 이 구역을 그냥 눌러도 놓입니다.
 *   (진짜 button 이라 키보드 탭 + 엔터로도 됩니다)
 *
 * ⚠️ 어떤 환자가 어느 구역에 맞는지는 이 구역이 모릅니다.
 *    정답은 data/triage-patients.ts, 채점은 lib/triage.ts 가 합니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    ⚠️ 다만 구역 색이 급한 순서를 뜻하므로 색 의미는 지켜주세요.
 *       (빨강 → 주황 → 노랑 → 초록 → 파랑)
 */

import type { TriageZoneInfo } from "@/data/triage-zones";
import type { TriageLevel } from "@/data/types";

import styles from "./TriageZoneDropArea.module.css";

type TriageZoneDropAreaProps = {
  zone: TriageZoneInfo;
  placedCount: number;
  isDropTarget: boolean;
  disabled: boolean;
  onSelect: (level: TriageLevel) => void;
  /** 끌어다 놓기를 판정하려면 이 구역의 화면 위치를 알아야 합니다 */
  registerElement: (level: TriageLevel, element: HTMLElement | null) => void;
};

export function TriageZoneDropArea({
  zone,
  placedCount,
  isDropTarget,
  disabled,
  onSelect,
  registerElement,
}: TriageZoneDropAreaProps) {
  return (
    <button
      type="button"
      ref={(element) => registerElement(zone.level, element)}
      className={styles.zone}
      data-level={zone.level}
      data-drop-target={isDropTarget}
      disabled={disabled}
      onClick={() => onSelect(zone.level)}
      aria-label={`${zone.label} 구역에 놓기. ${zone.rule}`}
    >
      <span className={styles.label}>{zone.label}</span>
      <span className={styles.rule}>{zone.rule}</span>
      <span className={styles.count}>
        {placedCount > 0 ? `${placedCount}명` : ""}
      </span>
    </button>
  );
}
