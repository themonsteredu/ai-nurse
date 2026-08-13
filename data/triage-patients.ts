/**
 * 미션 1(응급실) 환자 카드가 들어있는 파일.
 *
 * ★ 선생님이 수업 내용을 바꾸고 싶으면 여기를 고치면 됩니다.
 *   - 환자를 추가하려면 아래 배열에 항목을 하나 더 붙이세요.
 *   - 정답을 바꾸려면 그 환자의 correctZone 을 red / yellow / green 중 하나로 바꾸세요.
 *   - 오답 해설을 바꾸려면 explanation 문장을 고치세요.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *    정답 배치가 여기 들어있기 때문입니다.
 *
 * 📌 아래 카드들은 기획서가 도착하기 전에 쓰는 기본값입니다.
 *    기획서의 환자 카드로 통째로 교체할 수 있게 만들어 두었습니다.
 */

import type { Difficulty, TriageLevel } from "./types";

export type TriagePatient = {
  id: string;
  /** 카드에 크게 보일 이름 (실제 사람 이름 대신 상황으로 표현) */
  name: string;
  /** 나이대. 학생이 상황을 그려보게 돕는 정보. */
  ageGroup: string;
  /** 학생이 읽고 판단할 증상 설명 */
  symptom: string;
  /**
   * 중등 모드에서만 추가로 보여주는 관찰 정보.
   * 초등 모드에서는 화면에 나오지 않습니다.
   */
  vitals?: string;
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
};

export const TRIAGE_PATIENTS: TriagePatient[] = [
  {
    id: "er-01",
    name: "숨을 몰아쉬는 친구",
    ageGroup: "초등학생",
    symptom:
      "숨을 쌕쌕거리며 힘들게 쉬어요. 말을 한 마디도 이어서 못 하고 입술이 파래졌어요.",
    vitals: "호흡 아주 빠름 · 입술 색 창백함 · 말하기 어려움",
    correctZone: "red",
    explanation:
      "숨을 제대로 못 쉬면 몇 분 안에 위험해져요. 입술이 파래지는 건 몸에 산소가 부족하다는 신호라서 가장 먼저 도와야 합니다.",
    illustrationHint: "가슴에 손을 얹고 숨차하는 어린이 일러스트, 파란 톤",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-02",
    name: "가슴을 움켜쥔 어른",
    ageGroup: "어른",
    symptom:
      "가슴이 쥐어짜듯 아프다고 하며 식은땀을 흘려요. 얼굴이 하얗게 질렸어요.",
    vitals: "식은땀 · 얼굴 창백 · 가슴 통증 20분째",
    correctZone: "red",
    explanation:
      "가슴을 쥐어짜는 통증과 식은땀은 심장에 문제가 생겼다는 신호일 수 있어요. 심장은 잠깐만 멈춰도 위험해서 즉시 처치 구역으로 보내야 합니다.",
    illustrationHint: "가슴에 두 손을 모으고 찡그린 어른 일러스트",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-03",
    name: "머리를 부딪히고 토하는 사람",
    ageGroup: "중학생",
    symptom:
      "넘어지면서 머리를 세게 부딪혔어요. 그 뒤로 계속 토하고 자꾸 졸려 해요.",
    vitals: "구토 3회 · 불러도 반응이 느림 · 눈을 잘 못 뜸",
    correctZone: "red",
    explanation:
      "머리를 다친 뒤에 반복해서 토하거나 자꾸 졸려 하는 건 머릿속에 문제가 생겼다는 위험 신호예요. 겉으로 멀쩡해 보여도 즉시 처치가 필요합니다.",
    illustrationHint: "머리에 손을 얹고 어지러워하는 학생 일러스트, 피 표현 없이",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-04",
    name: "팔이 이상하게 꺾인 학생",
    ageGroup: "초등학생",
    symptom:
      "팔이 평소와 다른 모양으로 꺾였고 많이 부었어요. 아프다고 울지만 말은 또박또박 해요.",
    vitals: "의식 뚜렷 · 숨쉬기 정상 · 팔만 아파함",
    correctZone: "yellow",
    explanation:
      "뼈가 부러진 건 꼭 치료해야 하지만, 숨을 잘 쉬고 정신이 또렷하면 목숨이 바로 위험하지는 않아요. 그래서 즉시 처치보다는 한 단계 뒤인 응급 처치 구역이에요.",
    illustrationHint: "팔을 감싸 쥐고 있는 어린이 일러스트, 부목 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-05",
    name: "무릎이 까진 아이",
    ageGroup: "초등학생",
    symptom: "운동장에서 넘어져 무릎이 까졌어요. 혼자 걸어서 들어왔어요.",
    vitals: "의식 뚜렷 · 혼자 걸어 다님 · 상처 작음",
    correctZone: "green",
    explanation:
      "혼자 걸어 들어올 수 있고 상처가 작으면 비응급이에요. 더 위급한 사람을 먼저 돕고 나서 치료해도 괜찮습니다.",
    illustrationHint: "무릎에 밴드를 붙인 어린이 일러스트, 밝은 톤",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-06",
    name: "손가락을 살짝 벤 사람",
    ageGroup: "어른",
    symptom: "종이에 손가락을 살짝 베었어요. 피는 거의 멎었어요.",
    vitals: "의식 뚜렷 · 출혈 멎음 · 통증 약함",
    correctZone: "green",
    explanation:
      "피가 이미 멎었고 상처가 아주 작으면 급하지 않아요. 이런 환자를 먼저 치료하면 정말 위급한 사람이 기다리게 됩니다.",
    illustrationHint: "손가락에 작은 밴드를 붙인 손 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "er-07",
    name: "발목이 퉁퉁 부은 사람",
    ageGroup: "중학생",
    symptom:
      "계단에서 발을 헛디뎠어요. 발목이 부어올라 절뚝이지만 부축하면 걸을 수 있어요.",
    vitals: "의식 뚜렷 · 숨쉬기 정상 · 발목만 부어오름",
    correctZone: "yellow",
    explanation:
      "부어오르고 잘 못 걸으면 뼈나 인대를 다쳤을 수 있어서 진료가 필요해요. 하지만 숨과 의식이 멀쩡하니 즉시 처치까지는 아닙니다.",
    illustrationHint: "발목을 붙잡고 앉아 있는 학생 일러스트, 냉찜질 아이콘",
    levels: ["middle"],
  },
  {
    id: "er-08",
    name: "뜨거운 물에 팔을 덴 사람",
    ageGroup: "어른",
    symptom:
      "끓는 물을 쏟아 팔이 넓게 빨개지고 물집이 잡혔어요. 정신은 또렷하고 많이 아파해요.",
    vitals: "의식 뚜렷 · 숨쉬기 정상 · 화상 부위 넓음",
    correctZone: "yellow",
    explanation:
      "넓은 화상은 반드시 치료해야 하지만, 숨과 의식이 멀쩡하면 즉시 처치 구역은 아니에요. 다만 비응급으로 두기엔 위험해서 가운데인 응급 처치 구역이 맞습니다.",
    illustrationHint: "팔에 붕대를 감은 어른 일러스트, 흐르는 물 아이콘",
    levels: ["middle"],
  },
];

/** 난이도에 맞는 환자 카드만 골라줍니다. */
export function getTriagePatients(difficulty: Difficulty): TriagePatient[] {
  return TRIAGE_PATIENTS.filter((patient) =>
    patient.levels.includes(difficulty),
  );
}
