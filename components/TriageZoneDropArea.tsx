"use client";

/** 기존 중증도 분류 로직을 전문적인 PRIORITY ACTION 타일로 표현합니다. */

import type { TriageZoneInfo } from "@/data/triage-zones";
import type { TriageLevel } from "@/data/types";

import styles from "./TriageZoneDropArea.module.css";

const ACTION_META: Record<TriageLevel, { code: string; action: string }> = {
  red: { code: "P1", action: "즉시 처치" },
  orange: { code: "P2", action: "긴급 관찰" },
  yellow: { code: "P3", action: "우선 진료" },
  green: { code: "P4", action: "대기 관찰" },
  blue: { code: "P5", action: "비응급 안내" },
};

function PriorityGlyph({ level }: { level: TriageLevel }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      {level === "red" ? <path d="M12 3 3 20h18L12 3Zm0 5v6m0 3v.5" /> : null}
      {level === "orange" ? <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v5l3 2" /> : null}
      {level === "yellow" ? <path d="M4 12h13m-5-5 5 5-5 5M4 5v14" /> : null}
      {level === "green" ? <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Zm9-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" /> : null}
      {level === "blue" ? <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-10v.5" /> : null}
    </svg>
  );
}

type TriageZoneDropAreaProps = {
  zone: TriageZoneInfo;
  placedCount: number;
  isDropTarget: boolean;
  disabled: boolean;
  onSelect: (level: TriageLevel) => void;
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
  const meta = ACTION_META[zone.level];

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
      <span className={styles.zoneTopline}>
        <span className={styles.code}>{meta.code}</span>
        <PriorityGlyph level={zone.level} />
      </span>
      <span className={styles.label}>{zone.label}</span>
      <span className={styles.action}>{meta.action}</span>
      <span className={styles.rule}>{zone.rule}</span>
      <span className={styles.zoneFooter}>
        <span className={styles.count}>{placedCount > 0 ? `${placedCount}명 배정` : "미배정"}</span>
        <span className={styles.select}>SELECT</span>
      </span>
    </button>
  );
}
