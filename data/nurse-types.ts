/**
 * 최종 리포트에 나오는 "나의 간호 유형" 3가지와 진로 정보가 들어있는 파일.
 *
 * 전체 미션 중 최고점을 받은 미션 계열로 유형이 정해집니다.
 *   응급실·중환자실 → 빠른 판단형
 *   119 출동·수술실 → 침착한 실행형
 *   병동·투약실 → 세심한 돌봄형
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import type { MissionId } from "./types";

export type NurseTypeId = "fastJudgment" | "calmAction" | "carefulCare";

export type NurseType = {
  id: NurseTypeId;
  /** 유형 이름 */
  title: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 이 유형의 성격 설명 */
  description: string;
  /** 이 유형이 잘하는 것 */
  strengths: string[];
  /** 실제로 이어지는 직업들 */
  careers: string[];
  /** 어느 미션을 잘했을 때 나오는 유형인지 */
  sourceMission: MissionId;
  /** 코덱스가 일러스트 고를 때 참고할 힌트 */
  illustrationHint: string;
};

export const NURSE_TYPES: Record<NurseTypeId, NurseType> = {
  fastJudgment: {
    id: "fastJudgment",
    title: "빠른 판단형",
    tagline: "누구부터 도와야 할지 아는 사람",
    description:
      "정신없는 상황에서도 무엇이 가장 급한지 빠르게 가려내는 힘이 있어요. 눈에 띄는 것과 진짜 위급한 것을 구분할 줄 아는 사람입니다.",
    strengths: [
      "급한 것과 안 급한 것을 빨리 구분해요",
      "당황스러운 상황에서도 침착해요",
      "결정을 미루지 않고 바로 움직여요",
    ],
    careers: ["응급전문간호사", "응급실 간호사", "중환자실 간호사"],
    sourceMission: "er",
    illustrationHint: "청진기를 들고 서 있는 간호사 일러스트, 붉은 계열",
  },
  calmAction: {
    id: "calmAction",
    title: "침착한 실행형",
    tagline: "몸이 먼저 움직이는 사람",
    description:
      "배운 것을 실제 손으로 해내는 힘이 있어요. 리듬을 지키고 정확한 자리를 찾아내는, 현장에 강한 사람입니다.",
    strengths: [
      "배운 걸 몸으로 정확히 해내요",
      "긴 시간도 집중력을 유지해요",
      "위급한 순간에 겁내지 않아요",
    ],
    careers: ["응급구조사", "수술간호사", "119 구급대원"],
    sourceMission: "ambulance",
    illustrationHint: "구급대원 복장 일러스트, 주황 계열, 구급차 아이콘",
  },
  carefulCare: {
    id: "carefulCare",
    title: "세심한 돌봄형",
    tagline: "아프기 전에 먼저 챙기는 사람",
    description:
      "다친 사람을 돌보는 것뿐 아니라, 다치지 않게 미리 가르치는 데 관심이 있어요. 곁에 있으면 안심되는 사람입니다.",
    strengths: [
      "상대의 마음을 먼저 살펴요",
      "어려운 걸 쉽게 설명해줘요",
      "꾸준히 챙기고 기억해줘요",
    ],
    careers: ["보건교사", "아동전문간호사", "노인전문간호사"],
    sourceMission: "healthRoom",
    illustrationHint: "보건실에서 아이와 눈을 맞추는 간호사 일러스트, 초록 계열",
  },
};

/** 미션별로 어떤 유형과 이어지는지 정리한 표. */
export const MISSION_TO_NURSE_TYPE: Record<MissionId, NurseTypeId> = {
  er: "fastJudgment",
  ambulance: "calmAction",
  healthRoom: "carefulCare",
  operatingRoom: "calmAction",
  icu: "fastJudgment",
  medication: "carefulCare",
};

/* ------------------------------------------------------------------ */
/* 최종 리포트에 함께 실리는 실제 진로 정보                            */
/* ------------------------------------------------------------------ */

/** 간호사가 되는 길. */
export const NURSE_CAREER_PATH = [
  "간호학과 4년을 졸업하고",
  "간호사 국가시험에 합격하면",
  "간호사 면허를 받습니다",
];

/** 전문간호사 13개 분야. */
export const ADVANCED_NURSE_FIELDS = [
  "감염관리",
  "중환자",
  "응급",
  "마취",
  "호스피스",
  "정신",
  "아동",
  "노인",
  "산업",
  "가정",
  "종양",
  "임상",
  "보건",
];

/** 간호사 면허 말고도 갈 수 있는 길. */
export const RELATED_CAREERS = [
  "응급구조사",
  "보건교사",
  "간호장교",
  "임상연구",
  "보건직 공무원",
];

/** 최종 리포트 맨 아래에 공통으로 들어가는 문구. */
export const CAREER_CLOSING_NOTE =
  "오늘 여섯 가지 현장을 경험했어요. 환자의 위급함을 판단하고, 몸으로 응급처치를 하고, 안전한 수술과 투약을 준비하는 일까지 서로 완전히 다르죠? 간호사는 한 가지 모습으로만 설명할 수 없는 직업이에요.";
