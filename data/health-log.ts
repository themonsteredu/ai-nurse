/**
 * 미션 3의 추가 과제(중등 모드에서만 나옴): 보건일지 문장 조립.
 *
 * 학생은 칸마다 알맞은 조각을 골라 한 문장짜리 보건일지를 완성합니다.
 * 간호사가 하는 일 중 "기록"이 얼마나 중요한지 알려주는 과제입니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

export type HealthLogOption = {
  id: string;
  /** 조각에 적힐 문구 */
  label: string;
  /** ★ 이게 정답 조각인지 */
  isCorrect: boolean;
};

export type HealthLogSlot = {
  id: string;
  /** 이 칸이 무엇을 적는 칸인지 (예: 언제) */
  question: string;
  /** 고를 수 있는 조각들 (정답은 하나) */
  options: HealthLogOption[];
  /** 왜 그 조각이 정답인지 설명 */
  explanation: string;
  /** 문장에서의 순서 */
  order: number;
};

/** 보건일지를 쓰게 되는 상황 설명. */
export const HEALTH_LOG_SITUATION =
  "3교시 체육 시간에 2학년 김OO 학생이 축구를 하다 넘어져 오른쪽 무릎이 까진 채로 보건실에 왔습니다. 흐르는 물로 상처를 씻고 소독한 뒤 밴드를 붙였고, 담임 선생님께 알렸습니다.";

export const HEALTH_LOG_SLOTS: HealthLogSlot[] = [
  {
    id: "slot-when",
    question: "언제 있었던 일인가요?",
    order: 1,
    options: [
      { id: "when-a", label: "3교시 체육 시간에", isCorrect: true },
      { id: "when-b", label: "아까쯤에", isCorrect: false },
      { id: "when-c", label: "오늘 학교에서", isCorrect: false },
    ],
    explanation:
      "보건일지는 나중에 다른 사람이 읽어도 알 수 있게 써야 해요. '아까'처럼 애매한 말 대신 '3교시 체육 시간'처럼 정확히 적습니다.",
  },
  {
    id: "slot-who",
    question: "누구에게 있었던 일인가요?",
    order: 2,
    options: [
      { id: "who-a", label: "2학년 김OO 학생이", isCorrect: true },
      { id: "who-b", label: "어떤 남자아이가", isCorrect: false },
      { id: "who-c", label: "우리 반 친구가", isCorrect: false },
    ],
    explanation:
      "학년과 이름을 함께 적어야 나중에 누구였는지 확인할 수 있어요. '어떤 아이'라고 쓰면 기록의 의미가 없어집니다.",
  },
  {
    id: "slot-what",
    question: "무슨 일이 있었나요?",
    order: 3,
    options: [
      {
        id: "what-a",
        label: "축구를 하다 넘어져 오른쪽 무릎이 까져",
        isCorrect: true,
      },
      { id: "what-b", label: "다쳐서", isCorrect: false },
      { id: "what-c", label: "많이 아파해서", isCorrect: false },
    ],
    explanation:
      "어쩌다가, 어디를, 어떻게 다쳤는지 모두 적어야 해요. 특히 '오른쪽'처럼 어느 쪽인지 쓰는 게 중요합니다.",
  },
  {
    id: "slot-care",
    question: "어떻게 처치했나요?",
    order: 4,
    options: [
      {
        id: "care-a",
        label: "흐르는 물로 씻고 소독한 뒤 밴드를 붙였음",
        isCorrect: true,
      },
      { id: "care-b", label: "치료해 줌", isCorrect: false },
      { id: "care-c", label: "약을 발라줌", isCorrect: false },
    ],
    explanation:
      "무엇을 어떤 순서로 했는지 구체적으로 적어야 해요. 다음에 같은 학생이 오면 이 기록을 보고 이어서 돌볼 수 있습니다.",
  },
  {
    id: "slot-followup",
    question: "그 다음에 무엇을 했나요?",
    order: 5,
    options: [
      { id: "followup-a", label: "담임 선생님께 알림", isCorrect: true },
      { id: "followup-b", label: "교실로 돌려보냄", isCorrect: false },
      { id: "followup-c", label: "따로 없음", isCorrect: false },
    ],
    explanation:
      "다친 사실을 담임 선생님이나 보호자에게 알리는 것까지가 보건 선생님의 일이에요. 알린 기록을 남겨야 나중에 문제가 생기지 않습니다.",
  },
];

/** 문장 순서대로 정렬된 칸 목록. */
export const HEALTH_LOG_SLOT_LIST: HealthLogSlot[] = [...HEALTH_LOG_SLOTS].sort(
  (a, b) => a.order - b.order,
);
