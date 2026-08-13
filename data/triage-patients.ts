/**
 * 미션 1(응급실) 환자 카드가 들어있는 파일.
 *
 * 기획서 기준:
 *   초등 모드 = 환자 6명, 증상 문장만 보고 판단
 *   중등 모드 = 환자 10명, 활력징후 수치까지 함께 제시
 *
 * ★ 선생님이 수업 내용을 바꾸고 싶으면 여기를 고치면 됩니다.
 *   - 정답을 바꾸려면 correctZone 을 red / yellow / green / blue / black 중 하나로.
 *   - 오답 해설을 바꾸려면 explanation 문장을 고치세요.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *
 * 📌 1~6번은 기획서에 적힌 환자 그대로입니다.
 *    7~10번은 "중등 10명"을 채우기 위해 추가한 환자입니다. (기획서 미기재분)
 */

import type { Difficulty, TriageLevel } from "./types";

export type TriagePatient = {
  id: string;
  /** 카드에 크게 보일 이름 (실제 사람 이름 대신 나이·성별로 표현) */
  name: string;
  /** 학생이 읽고 판단할 증상 설명 */
  symptom: string;
  /**
   * 중등 모드에서만 함께 보여주는 활력징후.
   * 초등 모드 화면에는 나오지 않습니다.
   */
  vitals: {
    /** 체온 (℃) */
    temperature: string;
    /** 맥박 (분당 횟수) */
    pulse: string;
    /** 호흡수 (분당 횟수) */
    respiration: string;
    /** 산소포화도 (%) */
    oxygen: string;
  };
  /** ★ 정답 구역 */
  correctZone: TriageLevel;
  /** 오답일 때 띄우는 해설 카드 문구 */
  explanation: string;
  /**
   * 코덱스가 일러스트를 고를 때 참고할 힌트.
   * 사실적인 피·상처 그림은 쓰지 않고 아이콘/일러스트로만 표현합니다.
   */
  illustrationHint: string;
  /** 이 카드가 나오는 난이도 */
  levels: Difficulty[];
  /** 카드 순서 (강사가 "2번 환자" 라고 부를 때의 번호) */
  order: number;
};

export const TRIAGE_PATIENTS: TriagePatient[] = [
  /* ---------- 기획서에 적힌 환자 6명 ---------- */
  {
    id: "er-01",
    name: "40대 남성",
    symptom: "숨을 헐떡이고 입술이 파랗다.",
    vitals: {
      temperature: "36.8℃",
      pulse: "124회",
      respiration: "32회",
      oxygen: "85%",
    },
    correctZone: "red",
    explanation:
      "입술이 파랗다 = 산소가 부족하다는 신호예요. 피는 눌러서 멈출 수 있지만, 숨은 멈추면 4분 안에 뇌가 손상됩니다.",
    illustrationHint: "가슴을 붙잡고 숨차하는 어른 일러스트, 입술만 푸른 톤으로",
    levels: ["elementary", "middle"],
    order: 1,
  },
  {
    id: "er-02",
    name: "중학생",
    symptom: "팔에서 피가 많이 나지만 말은 또렷하다.",
    vitals: {
      temperature: "36.5℃",
      pulse: "104회",
      respiration: "20회",
      oxygen: "98%",
    },
    correctZone: "yellow",
    explanation:
      "피가 많이 나면 제일 급해 보이지만, 말이 또렷하다는 건 숨과 정신이 멀쩡하다는 뜻이에요. 출혈은 눌러서 멈출 수 있습니다. 눈에 띄는 것과 위급한 것은 다릅니다.",
    illustrationHint: "팔에 붕대를 감고 서 있는 학생 일러스트, 피 표현 없이 붕대만",
    levels: ["elementary", "middle"],
    order: 2,
  },
  {
    id: "er-03",
    name: "60대 여성",
    symptom: "가슴을 움켜쥐고 식은땀을 흘린다.",
    vitals: {
      temperature: "36.4℃",
      pulse: "112회",
      respiration: "24회",
      oxygen: "94%",
    },
    correctZone: "red",
    explanation:
      "가슴을 쥐어짜는 통증과 식은땀은 심장이 보내는 위험 신호예요. 심장은 멈추면 되돌리기 어려워서 가장 먼저 봐야 합니다.",
    illustrationHint: "가슴에 두 손을 모으고 찡그린 어른 일러스트",
    levels: ["elementary", "middle"],
    order: 3,
  },
  {
    id: "er-04",
    name: "초등학생",
    symptom: "축구하다 발목을 삐어 절뚝인다.",
    vitals: {
      temperature: "36.6℃",
      pulse: "92회",
      respiration: "18회",
      oxygen: "99%",
    },
    correctZone: "green",
    explanation:
      "아프고 잘 못 걷지만 목숨이 위험하지는 않아요. 치료는 필요하니 한참 기다렸다가 봐도 되는 '기다려도 됨' 구역입니다.",
    illustrationHint: "발목을 붙잡고 앉은 어린이 일러스트, 축구공 아이콘",
    levels: ["elementary", "middle"],
    order: 4,
  },
  {
    id: "er-05",
    name: "20대 남성",
    symptom: "3일째 기침이 나온다. 열은 없다.",
    vitals: {
      temperature: "36.7℃",
      pulse: "78회",
      respiration: "16회",
      oxygen: "99%",
    },
    correctZone: "blue",
    explanation:
      "3일이나 참고 온 걸 보면 급하지 않다는 뜻이에요. 열도 없고 숨도 편하니 가장 가벼운 구역입니다. 이런 환자를 먼저 보면 정말 위급한 사람이 기다리게 됩니다.",
    illustrationHint: "마스크를 쓰고 앉아 있는 청년 일러스트",
    levels: ["elementary", "middle"],
    order: 5,
  },
  {
    id: "er-06",
    name: "70대 남성",
    symptom: "불러도 반응이 없다.",
    vitals: {
      temperature: "35.9℃",
      pulse: "42회",
      respiration: "6회",
      oxygen: "79%",
    },
    correctZone: "red",
    explanation:
      "조용히 누워 있어서 놓치기 쉬운 환자예요. 하지만 불러도 반응이 없다는 건 가장 위험한 신호입니다. 소리치는 사람보다 조용한 사람이 더 위급할 수 있어요.",
    illustrationHint: "눈을 감고 누워 있는 어르신 일러스트, 차분한 톤",
    levels: ["elementary", "middle"],
    order: 6,
  },

  /* ---------- 중등 10명을 채우기 위해 추가한 환자 4명 ---------- */
  {
    id: "er-07",
    name: "50대 여성",
    symptom:
      "계단에서 굴러 허벅지가 크게 부어올랐다. 얼굴이 창백하고 식은땀을 흘린다.",
    vitals: {
      temperature: "36.1℃",
      pulse: "128회",
      respiration: "26회",
      oxygen: "93%",
    },
    correctZone: "red",
    explanation:
      "겉으로 피가 안 보여도 몸 안에서 피가 새고 있을 수 있어요. 창백한 얼굴 + 식은땀 + 빠른 맥박은 그 신호입니다. 보이지 않는 출혈이 더 위험할 때가 있어요.",
    illustrationHint: "다리를 붙잡고 앉은 어른 일러스트, 창백한 톤",
    levels: ["middle"],
    order: 7,
  },
  {
    id: "er-08",
    name: "10대 남학생",
    symptom: "뜨거운 국물을 쏟아 팔이 넓게 빨개지고 물집이 잡혔다.",
    vitals: {
      temperature: "36.9℃",
      pulse: "100회",
      respiration: "20회",
      oxygen: "98%",
    },
    correctZone: "yellow",
    explanation:
      "넓은 화상은 시간이 지날수록 나빠져서 빨리 치료해야 해요. 하지만 숨과 정신이 멀쩡하니 '지금 당장' 구역은 아닙니다.",
    illustrationHint: "팔에 흐르는 물을 대고 있는 학생 일러스트",
    levels: ["middle"],
    order: 8,
  },
  {
    id: "er-09",
    name: "30대 여성",
    symptom: "요리하다 손가락을 살짝 베었다. 피는 이미 멎었다.",
    vitals: {
      temperature: "36.5℃",
      pulse: "76회",
      respiration: "16회",
      oxygen: "99%",
    },
    correctZone: "blue",
    explanation:
      "피가 이미 멎었고 상처가 아주 작아요. 밴드만 붙이면 되는 정도라 가장 가벼운 구역입니다.",
    illustrationHint: "손가락에 작은 밴드를 붙인 손 아이콘",
    levels: ["middle"],
    order: 9,
  },
  {
    id: "er-10",
    name: "80대 남성",
    symptom:
      "쓰러진 지 오래되어 발견되었다. 숨과 맥박이 없고 몸이 이미 차갑게 식었다.",
    vitals: {
      temperature: "측정 안 됨",
      pulse: "없음",
      respiration: "없음",
      oxygen: "측정 안 됨",
    },
    correctZone: "black",
    explanation:
      "간호사가 가장 마음 아파하는 판단이에요. 안타깝지만 이미 도울 수 없는 상태입니다. 이럴 때는 살릴 수 있는 다른 환자에게 힘을 써야 해요. 이것도 간호사가 해야 하는 어려운 결정입니다.",
    illustrationHint: "흰 천이 덮인 침대 실루엣, 어둡지 않고 차분하고 존중하는 톤",
    levels: ["middle"],
    order: 10,
  },
];

/** 난이도에 맞는 환자 카드만 순서대로 골라줍니다. */
export function getTriagePatients(difficulty: Difficulty): TriagePatient[] {
  return TRIAGE_PATIENTS.filter((patient) =>
    patient.levels.includes(difficulty),
  ).sort((a, b) => a.order - b.order);
}
