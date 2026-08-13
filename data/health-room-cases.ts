/**
 * 미션 3(보건실)의 응급처치 상황 5개가 들어있는 파일.
 *
 * ★ 선생님이 상황이나 정답을 바꾸려면 여기를 고치면 됩니다.
 *   - 정답은 각 선택지의 isCorrect 가 true 인 것 하나입니다.
 *   - 오답 선택지에도 왜 틀렸는지 설명(explanation)이 붙어 있습니다.
 *     학생이 잘못 고르면 그 설명이 뜹니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *
 * 📌 기획서가 도착하면 이 5개를 기획서의 보건실 케이스로 교체합니다.
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

export type HealthRoomCase = {
  id: string;
  /** 상황 제목 */
  title: string;
  /** 상황 설명 */
  situation: string;
  /** 선택지들 (정답은 하나) */
  choices: HealthRoomChoice[];
  /** 코덱스가 일러스트 고를 때 참고할 힌트 */
  illustrationHint: string;
  /** 이 상황이 나오는 난이도 */
  levels: Difficulty[];
  /** 문제 순서 */
  order: number;
};

export const HEALTH_ROOM_CASES: HealthRoomCase[] = [
  {
    id: "hr-nosebleed",
    title: "코피가 났어요",
    situation:
      "쉬는 시간에 부딪혀서 코피가 났어요. 피가 계속 흐르고 있어요. 어떻게 해줄까요?",
    choices: [
      {
        id: "hr-nosebleed-a",
        label: "고개를 앞으로 살짝 숙이고 콧볼을 손가락으로 꾹 눌러준다",
        isCorrect: true,
        explanation:
          "맞아요! 고개를 앞으로 숙여야 피가 목으로 넘어가지 않아요. 콧볼(코의 말랑한 부분)을 10분 정도 꾹 눌러주면 피가 멎습니다.",
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
          "휴지를 깊이 넣으면 뺄 때 상처가 다시 터져요. 콧볼을 눌러주는 게 더 좋습니다.",
      },
    ],
    illustrationHint: "고개를 살짝 숙이고 코를 잡은 어린이 일러스트, 피 표현 없이",
    levels: ["elementary", "middle"],
    order: 1,
  },
  {
    id: "hr-burn",
    title: "뜨거운 물에 데었어요",
    situation:
      "급식 국물을 쏟아서 손등이 빨갛게 되었어요. 따갑다고 해요. 어떻게 해줄까요?",
    choices: [
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
          "얼음을 직접 대면 피부가 얼어서 더 다칠 수 있어요. 얼음이 아니라 흐르는 찬물이 맞습니다.",
      },
      {
        id: "hr-burn-c",
        label: "연고나 치약을 발라준다",
        isCorrect: false,
        explanation:
          "치약이나 된장을 바르는 건 옛날부터 내려오는 잘못된 방법이에요. 세균이 들어가서 더 위험해집니다. 먼저 찬물로 식혀주세요.",
      },
    ],
    illustrationHint: "수도꼭지 아래 손을 대고 있는 일러스트, 물줄기 강조",
    levels: ["elementary", "middle"],
    order: 2,
  },
  {
    id: "hr-sprain",
    title: "발목을 삐었어요",
    situation:
      "체육 시간에 발목을 접질렸어요. 부어오르고 아파해요. 어떻게 해줄까요?",
    choices: [
      {
        id: "hr-sprain-a",
        label: "움직이지 않게 하고 차가운 걸 대준 뒤 다리를 높이 올려준다",
        isCorrect: true,
        explanation:
          "맞아요! 쉬게 하고(안정), 차갑게 하고(냉찜질), 높이 올려주면(거상) 붓기가 줄어들어요. 앞글자를 따서 'RICE'라고 부릅니다.",
      },
      {
        id: "hr-sprain-b",
        label: "따뜻한 물수건을 대고 주물러준다",
        isCorrect: false,
        explanation:
          "다친 직후에 따뜻하게 하거나 주무르면 더 붓고 아파요. 처음 하루 이틀은 차갑게 해주는 게 맞습니다.",
      },
      {
        id: "hr-sprain-c",
        label: "괜찮은지 보려고 계속 걸어보게 한다",
        isCorrect: false,
        explanation:
          "아픈 발로 계속 걸으면 더 심하게 다칠 수 있어요. 먼저 쉬게 하고 부기를 살펴야 합니다.",
      },
    ],
    illustrationHint: "발목에 얼음주머니를 대고 다리를 올린 일러스트",
    levels: ["elementary", "middle"],
    order: 3,
  },
  {
    id: "hr-scrape",
    title: "무릎이 까졌어요",
    situation:
      "운동장에서 넘어져 무릎이 까지고 흙이 묻었어요. 어떻게 해줄까요?",
    choices: [
      {
        id: "hr-scrape-a",
        label: "흐르는 물로 흙을 씻어내고 소독한 뒤 밴드를 붙인다",
        isCorrect: true,
        explanation:
          "맞아요! 흙이나 모래가 남아 있으면 덧나요. 흐르는 물로 깨끗이 씻고 소독한 다음 덮어줍니다.",
      },
      {
        id: "hr-scrape-b",
        label: "흙이 묻은 채로 바로 밴드를 붙인다",
        isCorrect: false,
        explanation:
          "흙 속 세균을 상처 안에 가두는 셈이에요. 반드시 먼저 씻어내야 합니다.",
      },
      {
        id: "hr-scrape-c",
        label: "입으로 불거나 침을 발라준다",
        isCorrect: false,
        explanation:
          "입 안에는 세균이 아주 많아요. 침을 바르면 상처가 덧납니다. 흐르는 물이 정답이에요.",
      },
    ],
    illustrationHint: "무릎을 물로 씻어주는 장면, 밴드 아이콘, 피 표현 없이",
    levels: ["elementary", "middle"],
    order: 4,
  },
  {
    id: "hr-beesting",
    title: "벌에 쏘였어요",
    situation:
      "화단에서 놀다가 팔을 벌에 쏘였어요. 쏘인 자리에 침이 박혀 있어요. 어떻게 해줄까요?",
    choices: [
      {
        id: "hr-beesting-a",
        label: "카드처럼 납작한 걸로 살살 밀어서 침을 빼고 차갑게 해준다",
        isCorrect: true,
        explanation:
          "맞아요! 납작한 카드로 옆으로 밀어내면 독주머니를 안 누르고 침만 빠져요. 그 뒤에 차갑게 해주면 붓기가 가라앉습니다.",
      },
      {
        id: "hr-beesting-b",
        label: "손가락으로 집어서 뽑아낸다",
        isCorrect: false,
        explanation:
          "손가락으로 집으면 침 끝의 독주머니를 눌러서 독이 더 들어가요. 납작한 걸로 밀어내는 게 맞습니다.",
      },
      {
        id: "hr-beesting-c",
        label: "입으로 빨아서 독을 뽑아낸다",
        isCorrect: false,
        explanation:
          "입으로 빨아내는 건 효과가 없고 오히려 위험해요. 만약 숨쉬기 힘들어하거나 온몸이 부으면 바로 119에 신고해야 합니다.",
      },
    ],
    illustrationHint: "팔에 카드를 대고 밀어내는 손 일러스트, 벌 아이콘",
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
