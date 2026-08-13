/**
 * 미션 1(응급실)의 색깔 구역 설명이 들어있는 파일.
 *
 * 학생은 환자 카드를 이 구역 중 하나로 끌어다 놓습니다.
 *
 * 기획서 기준:
 *   초등 모드 = 구역 4개 (빨강·노랑·초록·파랑)
 *   중등 모드 = 구역 5개 (여기에 주황 "몇 분 안에" 추가)
 *
 * 주황은 "지금은 멀쩡해 보이지만 곧 나빠지는 환자"를 위한 구역입니다.
 * 겉모습만 보고 판단하면 안 된다는 걸 가르치는 자리라
 * 중등 모드에서만 나옵니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *    구역의 생김새는 바꿔도 되지만, 어떤 환자가 어디로 가는지는
 *    data/triage-patients.ts 에 정해져 있으니 그쪽은 절대 건드리면 안 됩니다.
 */

import type { Difficulty, TriageLevel } from "./types";

export type TriageZoneInfo = {
  level: TriageLevel;
  /** 구역 이름 (예: 지금 당장) */
  label: string;
  /** 학생이 이해할 수 있는 한 줄 기준 */
  rule: string;
  /** 구역 배치 순서. 왼쪽부터 급한 순. */
  order: number;
  /** 이 구역이 나오는 난이도 */
  levels: Difficulty[];
};

export const TRIAGE_ZONES: Record<TriageLevel, TriageZoneInfo> = {
  red: {
    level: "red",
    label: "지금 당장",
    rule: "숨이나 심장이 지금 멈추려 해요. 다른 무엇보다 먼저 봐야 합니다.",
    order: 1,
    levels: ["elementary", "middle"],
  },
  orange: {
    level: "orange",
    label: "몇 분 안에",
    rule: "지금은 말도 하고 멀쩡해 보이지만, 몇 분 안에 갑자기 나빠질 수 있어요.",
    order: 2,
    // 겉모습과 실제 위험이 다르다는 걸 다루는 구역이라 중등 모드에서만 나옵니다.
    levels: ["middle"],
  },
  yellow: {
    level: "yellow",
    label: "빨리",
    rule: "지금 당장은 아니지만, 기다리면 나빠져요.",
    order: 3,
    levels: ["elementary", "middle"],
  },
  green: {
    level: "green",
    label: "기다려도 됨",
    rule: "치료는 필요하지만 한참 기다려도 괜찮아요.",
    order: 4,
    levels: ["elementary", "middle"],
  },
  blue: {
    level: "blue",
    label: "가벼움",
    rule: "급하지 않아요. 오늘 꼭 치료하지 않아도 괜찮은 정도예요.",
    order: 5,
    levels: ["elementary", "middle"],
  },
};

/** 화면에 왼쪽부터 놓을 순서대로 정렬된 전체 구역 목록. */
export const TRIAGE_ZONE_LIST: TriageZoneInfo[] = Object.values(
  TRIAGE_ZONES,
).sort((a, b) => a.order - b.order);

/** 난이도에 맞는 구역만 골라줍니다. (초등 4개 / 중등 5개) */
export function getTriageZones(difficulty: Difficulty): TriageZoneInfo[] {
  return TRIAGE_ZONE_LIST.filter((zone) => zone.levels.includes(difficulty));
}
