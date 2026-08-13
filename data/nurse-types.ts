/**
 * 최종 리포트에 나오는 "나의 간호 유형" 4가지와 진로 정보가 들어있는 파일.
 *
 * 어떤 유형이 나올지는 lib/nurse-type.ts 가 미션 성적으로 계산합니다.
 * 이 파일은 "그래서 그 유형이 뭔데?"에 해당하는 설명만 담습니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import type { MissionId } from "./types";

export type NurseTypeId =
  | "emergency"
  | "fieldResponse"
  | "schoolCare"
  | "allRounder";

export type NurseType = {
  id: NurseTypeId;
  /** 유형 이름 */
  title: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 이 유형의 성격 설명 */
  description: string;
  /** 이 유형이 잘하는 것 3가지 */
  strengths: string[];
  /** 실제로 이어지는 직업들 */
  careers: string[];
  /** 이 직업이 되려면 무엇을 하는지 */
  pathway: string;
  /** 어느 미션을 잘했을 때 나오는 유형인지 (allRounder 는 해당 없음) */
  sourceMission: MissionId | null;
  /** 코덱스가 일러스트 고를 때 참고할 힌트 */
  illustrationHint: string;
};

export const NURSE_TYPES: Record<NurseTypeId, NurseType> = {
  emergency: {
    id: "emergency",
    title: "판단이 빠른 응급실형",
    tagline: "누구부터 도와야 할지 아는 사람",
    description:
      "정신없는 상황에서도 무엇이 가장 급한지 빠르게 가려내는 힘이 있어요. 여러 일이 한꺼번에 닥쳐도 순서를 정할 줄 아는 사람입니다.",
    strengths: [
      "급한 것과 안 급한 것을 빨리 구분해요",
      "당황스러운 상황에서도 침착해요",
      "결정을 미루지 않고 바로 움직여요",
    ],
    careers: ["응급실 간호사", "중환자실 간호사", "응급전문간호사"],
    pathway:
      "간호대학(4년)을 졸업하고 간호사 국가시험에 합격하면 간호사가 됩니다. 병원 응급실에서 경력을 쌓은 뒤 응급전문간호사 자격에 도전할 수 있어요.",
    sourceMission: "er",
    illustrationHint: "청진기를 들고 서 있는 간호사 일러스트, 붉은 계열",
    },
  fieldResponse: {
    id: "fieldResponse",
    title: "손이 야무진 현장대응형",
    tagline: "몸이 먼저 움직이는 사람",
    description:
      "배운 것을 실제 손으로 해내는 힘이 있어요. 리듬을 지키고 정확한 자리를 찾아내는, 현장에 강한 사람입니다.",
    strengths: [
      "배운 걸 몸으로 정확히 해내요",
      "긴 시간도 집중력을 유지해요",
      "위급한 순간에 겁내지 않아요",
    ],
    careers: ["119 구급대원", "응급구조사", "항공이송 간호사"],
    pathway:
      "응급구조학과나 간호대학을 졸업하면 도전할 수 있어요. 119 구급대원은 소방공무원 시험을 함께 준비합니다.",
    sourceMission: "ambulance",
    illustrationHint: "구급대원 복장 일러스트, 주황 계열, 구급차 아이콘",
  },
  schoolCare: {
    id: "schoolCare",
    title: "마음이 따뜻한 돌봄교육형",
    tagline: "아프기 전에 먼저 챙기는 사람",
    description:
      "다친 사람을 돌보는 것뿐 아니라, 다치지 않게 미리 가르치는 데 관심이 있어요. 곁에 있으면 안심되는 사람입니다.",
    strengths: [
      "상대의 마음을 먼저 살펴요",
      "어려운 걸 쉽게 설명해줘요",
      "꾸준히 챙기고 기억해줘요",
    ],
    careers: ["학교 보건교사", "지역사회 간호사", "보건소 간호사"],
    pathway:
      "간호대학에서 교직 과정을 함께 이수하고 임용시험에 합격하면 학교 보건 선생님이 됩니다.",
    sourceMission: "healthRoom",
    illustrationHint: "보건실에서 아이와 눈을 맞추는 간호사 일러스트, 초록 계열",
  },
  allRounder: {
    id: "allRounder",
    title: "빈틈없는 올라운드형",
    tagline: "어느 자리에 놓아도 해내는 사람",
    description:
      "세 현장 모두에서 고르게 잘했어요. 어떤 자리에 가도 제 몫을 해내는, 어디서나 찾는 사람입니다.",
    strengths: [
      "무엇이든 빠르게 배워요",
      "한쪽에 치우치지 않고 고르게 잘해요",
      "맡은 일을 끝까지 해내요",
    ],
    careers: ["간호관리자(수간호사)", "간호교육자", "감염관리 간호사"],
    pathway:
      "간호사로 여러 부서를 경험한 뒤 대학원에 진학하거나 전문 자격을 따서 관리자·교육자로 성장합니다.",
    sourceMission: null,
    illustrationHint: "여러 부서 아이콘에 둘러싸인 간호사 일러스트, 보라 계열",
  },
};

/** 미션별로 어떤 유형과 이어지는지 정리한 표. */
export const MISSION_TO_NURSE_TYPE: Record<MissionId, NurseTypeId> = {
  er: "emergency",
  ambulance: "fieldResponse",
  healthRoom: "schoolCare",
};

/** 최종 리포트 맨 아래에 공통으로 들어가는 진로 안내 문구. */
export const CAREER_CLOSING_NOTE =
  "간호사가 일하는 곳은 병원만이 아니에요. 학교, 소방서, 보건소, 연구소, 회사까지 아주 다양합니다. 오늘 해본 세 가지는 그중 딱 세 곳이었어요.";
