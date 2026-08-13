/**
 * 미션 3의 추가 과제(중등 모드에서만 나옴): 보건일지 문장 조립.
 *
 * 기획서의 문장 틀 그대로입니다:
 *   [3학년 2반 김OO]이 [쉬는 시간]에 [코피]로 내원, [지혈 처치] 후 [10분 뒤 멈춤]
 *
 * 간호사가 하는 일 중 "기록"이 얼마나 중요한지 알려주는 과제입니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

export type HealthLogOption = {
  id: string;
  /** 드롭다운에 뜰 문구 */
  label: string;
  /** ★ 이게 정답 조각인지 */
  isCorrect: boolean;
};

export type HealthLogSlot = {
  id: string;
  /** 이 칸이 무엇을 적는 칸인지 */
  question: string;
  /**
   * 문장에서 이 칸 뒤에 붙는 글자.
   * "이", "에", "로 내원," 처럼 조사는 앞말에 딱 붙이고,
   * " 후" 처럼 따로 떨어지는 낱말은 앞에 공백을 하나 둡니다.
   */
  suffix: string;
  /** 고를 수 있는 조각들 (정답은 하나) */
  options: HealthLogOption[];
  /** 왜 그 조각이 정답인지 설명 */
  explanation: string;
  /** 문장에서의 순서 */
  order: number;
};

/** 보건일지를 쓰게 되는 상황. 미션 3의 첫 번째 케이스(코피)와 이어집니다. */
export const HEALTH_LOG_SITUATION =
  "방금 코피가 난 학생을 처치했어요. 이제 보건일지에 기록을 남길 차례입니다. 나중에 다른 선생님이 읽어도 무슨 일이 있었는지 알 수 있게 써야 해요.";

export const HEALTH_LOG_SLOTS: HealthLogSlot[] = [
  {
    id: "slot-who",
    question: "누가 왔나요?",
    suffix: "이",
    order: 1,
    options: [
      { id: "who-a", label: "3학년 2반 김OO", isCorrect: true },
      { id: "who-b", label: "어떤 남학생", isCorrect: false },
      { id: "who-c", label: "우리 학교 학생", isCorrect: false },
    ],
    explanation:
      "학년·반·이름을 함께 적어야 나중에 누구였는지 확인할 수 있어요. '어떤 학생'이라고 쓰면 기록의 의미가 없어집니다.",
  },
  {
    id: "slot-when",
    question: "언제 왔나요?",
    suffix: "에",
    order: 2,
    options: [
      { id: "when-a", label: "쉬는 시간", isCorrect: true },
      { id: "when-b", label: "아까쯤", isCorrect: false },
      { id: "when-c", label: "오늘", isCorrect: false },
    ],
    explanation:
      "'아까'처럼 애매한 말 대신 '쉬는 시간'처럼 언제인지 알 수 있게 적습니다.",
  },
  {
    id: "slot-reason",
    question: "왜 왔나요?",
    suffix: "로 내원,",
    order: 3,
    options: [
      { id: "reason-a", label: "코피", isCorrect: true },
      { id: "reason-b", label: "아파서", isCorrect: false },
      { id: "reason-c", label: "다쳐서", isCorrect: false },
    ],
    explanation:
      "어디가 어떻게 아픈지 정확히 적어야 해요. '아파서'라고만 쓰면 아무 정보도 남지 않습니다.",
  },
  {
    id: "slot-care",
    question: "어떤 처치를 했나요?",
    suffix: " 후",
    order: 4,
    options: [
      { id: "care-a", label: "지혈 처치", isCorrect: true },
      { id: "care-b", label: "치료해 줌", isCorrect: false },
      { id: "care-c", label: "돌봐 줌", isCorrect: false },
    ],
    explanation:
      "무엇을 했는지 구체적으로 적어야 다음에 같은 학생이 왔을 때 이어서 돌볼 수 있어요.",
  },
  {
    id: "slot-result",
    question: "결과는 어땠나요?",
    suffix: "",
    order: 5,
    options: [
      { id: "result-a", label: "10분 뒤 멈춤", isCorrect: true },
      { id: "result-b", label: "괜찮아짐", isCorrect: false },
      { id: "result-c", label: "돌아감", isCorrect: false },
    ],
    explanation:
      "얼마 만에 어떻게 되었는지까지 적어야 완성된 기록이에요. '괜찮아짐'은 얼마나 걸렸는지 알 수 없습니다.",
  },
];

/** 문장 순서대로 정렬된 칸 목록. */
export const HEALTH_LOG_SLOT_LIST: HealthLogSlot[] = [...HEALTH_LOG_SLOTS].sort(
  (a, b) => a.order - b.order,
);
