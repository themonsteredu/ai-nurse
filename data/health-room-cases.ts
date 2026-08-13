/**
 * 미션 3(보건실)의 응급처치 상황 5개가 들어있는 파일.
 *
 * 기획서 기준으로 상황마다 두 번 고릅니다.
 *   ① 바로 할 처치 (선택지 4개)
 *   ② 그 다음 조치 (계속 관찰 / 부모 연락 / 119 / 병원 이송)
 *
 * ★ 선생님이 상황이나 정답을 바꾸려면 여기를 고치면 됩니다.
 *   - 정답은 isCorrect 가 true 인 것 하나입니다.
 *   - 오답 선택지에도 왜 틀렸는지 설명이 붙어 있어 학생이 바로 배웁니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

import type { Difficulty } from "./types";

export type HealthRoomChoice = {
  id: string;
  /** 학생이 고를 선택지 문구 */
  label: string;
  /** ★ 이게 정답인지 */
  isCorrect: boolean;
  /** 고른 뒤 보여줄 설명 */
  explanation: string;
};

/** 두 번째 단계에서 고르는 "그 다음 조치"의 종류. */
export type FollowUpAction =
  | "observe"
  | "callParent"
  | "call119"
  | "toHospital";

export type HealthRoomFollowUp = {
  id: string;
  action: FollowUpAction;
  label: string;
  isCorrect: boolean;
  explanation: string;
};

export type HealthRoomCase = {
  id: string;
  /** 상황 제목 */
  title: string;
  /** 상황 설명 */
  situation: string;
  /** ① 바로 할 처치 (선택지 4개) */
  treatmentChoices: HealthRoomChoice[];
  /** ② 그 다음 조치 (선택지 4개) */
  followUpChoices: HealthRoomFollowUp[];
  /** 학생들이 흔히 하는 오해. 강사 토론용 참고 문구입니다. */
  commonMistake: string;
  /** 코덱스가 일러스트 고를 때 참고할 힌트 */
  illustrationHint: string;
  /** 이 상황이 나오는 난이도 */
  levels: Difficulty[];
  /** 문제 순서 */
  order: number;
};

/** "그 다음 조치" 선택지는 네 가지로 고정입니다. 문구만 상황마다 다듬습니다. */
export const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  observe: "보건실에서 계속 지켜본다",
  callParent: "부모님께 연락한다",
  call119: "119에 신고한다",
  toHospital: "병원으로 데려간다",
};

export const HEALTH_ROOM_CASES: HealthRoomCase[] = [
  {
    id: "hr-nosebleed",
    title: "코피가 났어요",
    situation:
      "쉬는 시간에 부딪혀서 코피가 났어요. 피가 계속 흐르고 있어요. 어떻게 해줄까요?",
    treatmentChoices: [
      {
        id: "hr-nosebleed-a",
        label: "고개를 앞으로 숙이고 콧볼을 손가락으로 꾹 눌러준다",
        isCorrect: true,
        explanation:
          "맞아요! 고개를 앞으로 숙여야 피가 목으로 넘어가지 않아요. 콧볼(코의 말랑한 부분)을 10분 정도 쉬지 않고 눌러주면 멎습니다.",
      },
      {
        id: "hr-nosebleed-b",
        label: "고개를 뒤로 젖히고 이마를 눌러준다",
        isCorrect: false,
        explanation:
          "고개를 뒤로 젖히면 피가 목으로 넘어가서 토할 수 있어요. 반대로 앞으로 숙여야 합니다. 아주 흔한 오해예요!",
      },
      {
        id: "hr-nosebleed-c",
        label: "휴지를 코에 깊숙이 밀어 넣는다",
        isCorrect: false,
        explanation:
          "휴지를 깊이 넣으면 뺄 때 굳은 피가 뜯겨서 다시 터져요. 콧볼을 눌러주는 게 더 좋습니다.",
      },
      {
        id: "hr-nosebleed-d",
        label: "누워서 쉬게 한다",
        isCorrect: false,
        explanation:
          "누우면 피가 목으로 넘어가요. 앉은 자세에서 고개를 앞으로 숙이는 게 맞습니다.",
      },
    ],
    followUpChoices: [
      {
        id: "hr-nosebleed-f1",
        action: "observe",
        label: "보건실에서 10분 더 지켜본다",
        isCorrect: true,
        explanation:
          "맞아요. 대부분 10분 안에 멎어요. 멎으면 교실로 보내되, 20분이 지나도 안 멎으면 그때 병원에 가야 합니다.",
      },
      {
        id: "hr-nosebleed-f2",
        action: "call119",
        label: "119에 신고한다",
        isCorrect: false,
        explanation:
          "코피로 119를 부르지는 않아요. 119는 숨을 못 쉬거나 의식이 없을 때 부릅니다.",
      },
      {
        id: "hr-nosebleed-f3",
        action: "toHospital",
        label: "바로 병원으로 데려간다",
        isCorrect: false,
        explanation:
          "먼저 눌러서 멎는지 봐야 해요. 20분 넘게 안 멎을 때 병원에 갑니다.",
      },
      {
        id: "hr-nosebleed-f4",
        action: "callParent",
        label: "바로 부모님께 연락한다",
        isCorrect: false,
        explanation:
          "먼저 지혈이 되는지 보는 게 순서예요. 멎지 않거나 자주 반복되면 그때 연락합니다.",
      },
    ],
    commonMistake: "고개를 뒤로 젖히기 — 학생 대부분이 이걸 고릅니다.",
    illustrationHint: "고개를 살짝 숙이고 코를 잡은 어린이 일러스트, 피 표현 없이",
    levels: ["elementary", "middle"],
    order: 1,
  },
  {
    id: "hr-burn",
    title: "뜨거운 국물에 데었어요",
    situation:
      "급식 국물을 쏟아서 손등이 빨갛게 되고 작은 물집이 생겼어요. 따갑다고 해요. 어떻게 해줄까요?",
    treatmentChoices: [
      {
        id: "hr-burn-a",
        label: "흐르는 찬물에 15분 넘게 대준다",
        isCorrect: true,
        explanation:
          "맞아요! 흐르는 찬물에 충분히 식혀주는 게 가장 좋아요. 열이 안쪽까지 퍼지는 걸 막아서 상처가 덜 깊어집니다.",
      },
      {
        id: "hr-burn-b",
        label: "얼음을 직접 올려놓는다",
        isCorrect: false,
        explanation:
          "얼음을 직접 대면 피부가 얼어서 더 다쳐요. 얼음이 아니라 흐르는 찬물이 맞습니다.",
      },
      {
        id: "hr-burn-c",
        label: "연고나 치약을 발라준다",
        isCorrect: false,
        explanation:
          "치약이나 된장을 바르는 건 옛날부터 내려오는 잘못된 방법이에요. 세균이 들어가고 나중에 의사가 상처를 보기도 어려워집니다.",
      },
      {
        id: "hr-burn-d",
        label: "물집을 터뜨리고 소독한다",
        isCorrect: false,
        explanation:
          "물집은 상처를 덮어주는 자연 붕대예요. 터뜨리면 세균이 들어갑니다. 그대로 두세요.",
      },
    ],
    followUpChoices: [
      {
        id: "hr-burn-f1",
        action: "toHospital",
        label: "병원으로 데려간다",
        isCorrect: true,
        explanation:
          "맞아요. 물집이 생겼다는 건 2도 화상이라는 뜻이라 의사가 봐야 해요. 찬물로 식힌 뒤 병원에 갑니다.",
      },
      {
        id: "hr-burn-f2",
        action: "observe",
        label: "보건실에서 계속 지켜본다",
        isCorrect: false,
        explanation:
          "물집이 잡힌 화상은 지켜보는 것만으로는 부족해요. 흉이 남거나 덧날 수 있어 병원 진료가 필요합니다.",
      },
      {
        id: "hr-burn-f3",
        action: "call119",
        label: "119에 신고한다",
        isCorrect: false,
        explanation:
          "손등 정도의 화상은 119까지는 아니에요. 다만 몸의 넓은 부위가 데었거나 숨쉬기 힘들어하면 바로 119입니다.",
      },
      {
        id: "hr-burn-f4",
        action: "callParent",
        label: "부모님께 연락만 하고 교실로 보낸다",
        isCorrect: false,
        explanation:
          "연락은 당연히 해야 하지만, 교실로 그냥 보내면 안 돼요. 물집 화상은 병원에 가야 합니다.",
      },
    ],
    commonMistake: "얼음을 직접 대기 / 연고·치약 바르기",
    illustrationHint: "수도꼭지 아래 손을 대고 있는 일러스트, 물줄기 강조",
    levels: ["elementary", "middle"],
    order: 2,
  },
  {
    id: "hr-sprain",
    title: "발목을 삐었어요",
    situation:
      "체육 시간에 발목을 접질렸어요. 부어오르고 아파해요. 어떻게 해줄까요?",
    treatmentChoices: [
      {
        id: "hr-sprain-a",
        label: "움직이지 않게 하고 차가운 걸 대준 뒤 다리를 높이 올려준다",
        isCorrect: true,
        explanation:
          "맞아요! 쉬게 하고(안정), 차갑게 하고(냉찜질), 높이 올려주면(거상) 붓기가 줄어들어요.",
      },
      {
        id: "hr-sprain-b",
        label: "파스를 붙이고 주물러준다",
        isCorrect: false,
        explanation:
          "다친 직후에 주무르면 속에서 피가 더 나서 더 붓고 아파요. 처음 하루 이틀은 차갑게 해주고 건드리지 않는 게 맞습니다.",
      },
      {
        id: "hr-sprain-c",
        label: "따뜻한 물수건을 대준다",
        isCorrect: false,
        explanation:
          "따뜻하게 하면 피가 더 몰려서 부기가 심해져요. 다친 직후에는 차갑게 하는 게 맞습니다.",
      },
      {
        id: "hr-sprain-d",
        label: "괜찮은지 보려고 계속 걸어보게 한다",
        isCorrect: false,
        explanation:
          "아픈 발로 계속 걸으면 더 심하게 다칠 수 있어요. 먼저 쉬게 해야 합니다.",
      },
    ],
    followUpChoices: [
      {
        id: "hr-sprain-f1",
        action: "callParent",
        label: "부모님께 연락해 병원 진료를 권한다",
        isCorrect: true,
        explanation:
          "맞아요. 뼈에 금이 갔는지는 사진을 찍어봐야 알아요. 냉찜질로 응급처치를 하고 부모님께 알려 병원에 가도록 합니다.",
      },
      {
        id: "hr-sprain-f2",
        action: "observe",
        label: "보건실에서 지켜보다 교실로 보낸다",
        isCorrect: false,
        explanation:
          "많이 부었다면 그냥 보내면 안 돼요. 골절일 수도 있어서 보호자에게 알려야 합니다.",
      },
      {
        id: "hr-sprain-f3",
        action: "call119",
        label: "119에 신고한다",
        isCorrect: false,
        explanation:
          "발목 염좌로 119를 부르지는 않아요. 다만 뼈가 밖으로 튀어나왔거나 다리가 이상하게 꺾였다면 119입니다.",
      },
      {
        id: "hr-sprain-f4",
        action: "toHospital",
        label: "선생님이 바로 병원에 데려간다",
        isCorrect: false,
        explanation:
          "급하지 않은 부상은 보호자에게 먼저 알리는 게 순서예요. 학교가 마음대로 병원에 데려가지 않습니다.",
      },
    ],
    commonMistake: "주무르기 / 파스 붙이기 / 따뜻하게 하기",
    illustrationHint: "발목에 얼음주머니를 대고 다리를 올린 일러스트",
    levels: ["elementary", "middle"],
    order: 3,
  },
  {
    id: "hr-beesting",
    title: "벌에 쏘였어요",
    situation:
      "화단에서 놀다가 팔을 벌에 쏘였어요. 쏘인 자리에 침이 박혀 있어요. 어떻게 해줄까요?",
    treatmentChoices: [
      {
        id: "hr-beesting-a",
        label: "카드처럼 납작한 것으로 옆으로 밀어내 침을 빼고 차갑게 해준다",
        isCorrect: true,
        explanation:
          "맞아요! 납작한 카드로 밀어내면 독주머니를 안 누르고 침만 빠져요. 그 뒤에 차갑게 해주면 붓기가 가라앉습니다.",
      },
      {
        id: "hr-beesting-b",
        label: "손가락으로 집어서 뽑아낸다",
        isCorrect: false,
        explanation:
          "손가락으로 집으면 침 끝의 독주머니를 눌러서 독이 더 들어가요. 납작한 것으로 밀어내는 게 맞습니다.",
      },
      {
        id: "hr-beesting-c",
        label: "입으로 빨아서 독을 뽑아낸다",
        isCorrect: false,
        explanation:
          "입으로 빨아내는 건 효과가 없고 입 안에 상처가 있으면 오히려 위험해요.",
      },
      {
        id: "hr-beesting-d",
        label: "된장이나 침을 발라준다",
        isCorrect: false,
        explanation:
          "된장을 바르는 건 잘못 알려진 방법이에요. 세균이 들어가 덧납니다.",
      },
    ],
    followUpChoices: [
      {
        id: "hr-beesting-f1",
        action: "observe",
        label: "30분 정도 보건실에서 지켜본다",
        isCorrect: true,
        explanation:
          "맞아요. 벌에 쏘인 뒤 30분 안에 온몸에 두드러기가 나거나 숨쉬기 힘들어질 수 있어요. 그 시간 동안 곁에서 지켜보는 게 중요합니다.",
      },
      {
        id: "hr-beesting-f2",
        action: "call119",
        label: "바로 119에 신고한다",
        isCorrect: false,
        explanation:
          "지금은 쏘인 자리만 부은 상태라 괜찮아요. 하지만 숨이 가빠지거나 온몸이 부으면 그때는 1초도 지체 말고 119입니다.",
      },
      {
        id: "hr-beesting-f3",
        action: "toHospital",
        label: "바로 병원으로 데려간다",
        isCorrect: false,
        explanation:
          "대부분은 병원까지 안 가도 돼요. 먼저 지켜보고, 몸에 이상이 생기면 그때 움직입니다.",
      },
      {
        id: "hr-beesting-f4",
        action: "callParent",
        label: "부모님께 연락하고 바로 교실로 보낸다",
        isCorrect: false,
        explanation:
          "연락은 해야 하지만 바로 교실로 보내면 안 돼요. 알레르기 반응이 늦게 올 수 있어 곁에서 지켜봐야 합니다.",
      },
    ],
    commonMistake: "손가락으로 침 뽑기",
    illustrationHint: "팔에 카드를 대고 밀어내는 손 일러스트, 벌 아이콘",
    levels: ["elementary", "middle"],
    order: 4,
  },
  {
    id: "hr-hyperventilation",
    title: "숨을 너무 빨리 쉬어요",
    situation:
      "시험을 앞두고 긴장한 학생이 숨을 아주 빠르고 얕게 몰아쉬어요. 손발이 저리고 어지럽다고 해요. 어떻게 해줄까요?",
    treatmentChoices: [
      {
        id: "hr-hyper-a",
        label: "안심시키면서 천천히 숨 쉬도록 함께 세어준다",
        isCorrect: true,
        explanation:
          "맞아요! 과호흡은 마음이 급해져서 숨을 너무 많이 쉬는 상태예요. 곁에서 \"괜찮아, 천천히\" 하며 함께 숫자를 세어주면 가라앉습니다.",
      },
      {
        id: "hr-hyper-b",
        label: "비닐봉지를 입에 대고 숨 쉬게 한다",
        isCorrect: false,
        explanation:
          "예전에는 그렇게 가르쳤지만 지금은 위험한 방법으로 봅니다. 산소가 부족해질 수 있어요. 안심시키는 게 가장 좋은 처치입니다.",
      },
      {
        id: "hr-hyper-c",
        label: "찬물을 마시게 하고 눕힌다",
        isCorrect: false,
        explanation:
          "숨이 가쁠 때 물을 마시면 사레들릴 수 있어요. 먼저 호흡을 가라앉히는 게 순서입니다.",
      },
      {
        id: "hr-hyper-d",
        label: "정신 차리라고 크게 소리쳐 깨운다",
        isCorrect: false,
        explanation:
          "놀라게 하면 더 급해져요. 과호흡은 마음이 편해져야 멎습니다. 조용하고 차분한 목소리가 약이에요.",
      },
    ],
    followUpChoices: [
      {
        id: "hr-hyper-f1",
        action: "callParent",
        label: "가라앉은 뒤 부모님께 알린다",
        isCorrect: true,
        explanation:
          "맞아요. 호흡이 돌아오면 쉬게 하고 부모님께 알립니다. 자주 반복되면 진료가 필요할 수 있어요.",
      },
      {
        id: "hr-hyper-f2",
        action: "call119",
        label: "바로 119에 신고한다",
        isCorrect: false,
        explanation:
          "과호흡은 대부분 안정시키면 가라앉아요. 다만 입술이 파래지거나 의식이 흐려지면 그때는 바로 119입니다.",
      },
      {
        id: "hr-hyper-f3",
        action: "observe",
        label: "아무 말 없이 혼자 있게 둔다",
        isCorrect: false,
        explanation:
          "혼자 두면 더 불안해져요. 과호흡은 곁에 있어 주는 것 자체가 처치입니다.",
      },
      {
        id: "hr-hyper-f4",
        action: "toHospital",
        label: "바로 병원으로 데려간다",
        isCorrect: false,
        explanation:
          "먼저 안정시켜 보는 게 순서예요. 가라앉지 않거나 반복되면 그때 진료를 받습니다.",
      },
    ],
    commonMistake: "비닐봉지 씌우기 — 예전 방식이라 어른들도 많이 압니다.",
    illustrationHint:
      "학생 곁에 앉아 손을 잡고 함께 숨 쉬는 보건 선생님 일러스트, 따뜻한 톤",
    levels: ["elementary", "middle"],
    order: 5,
  },
];

/** 난이도에 맞는 상황만 순서대로 골라줍니다. */
export function getHealthRoomCases(difficulty: Difficulty): HealthRoomCase[] {
  return HEALTH_ROOM_CASES.filter((item) =>
    item.levels.includes(difficulty),
  ).sort((a, b) => a.order - b.order);
}
