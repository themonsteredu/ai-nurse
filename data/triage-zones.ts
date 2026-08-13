/**
 * 미션 1(응급실)의 색깔 구역 3개에 대한 설명이 들어있는 파일.
 *
 * 학생은 환자 카드를 이 구역 중 하나로 끌어다 놓습니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 수정하지 않습니다.
 *    구역의 "색깔 이름"은 바꿔도 되지만(디자인), 어떤 환자가 어디로 가는지는
 *    data/triage-patients.ts 에 정해져 있으니 그쪽은 절대 건드리면 안 됩니다.
 */

import type { TriageLevel } from "./types";

export type TriageZoneInfo = {
  level: TriageLevel;
  /** 구역 이름 (예: 즉시 처치) */
  label: string;
  /** 학생이 이해할 수 있는 한 줄 기준 */
  rule: string;
  /** 구역 배치 순서. 왼쪽부터 급한 순. */
  order: number;
};

export const TRIAGE_ZONES: Record<TriageLevel, TriageZoneInfo> = {
  red: {
    level: "red",
    label: "즉시 처치",
    rule: "숨이나 심장에 문제가 있어요. 지금 당장 치료하지 않으면 위험해요.",
    order: 1,
  },
  yellow: {
    level: "yellow",
    label: "응급 처치",
    rule: "치료가 꼭 필요하지만, 조금은 기다릴 수 있어요.",
    order: 2,
  },
  green: {
    level: "green",
    label: "비응급",
    rule: "혼자 걸어 다닐 수 있고, 다친 정도가 가벼워요.",
    order: 3,
  },
};

/** 화면에 왼쪽부터 놓을 순서대로 정렬된 구역 목록. */
export const TRIAGE_ZONE_LIST: TriageZoneInfo[] = Object.values(
  TRIAGE_ZONES,
).sort((a, b) => a.order - b.order);
