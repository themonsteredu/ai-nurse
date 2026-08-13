/**
 * 미션 2 ①번 과제: "쓰러진 사람을 발견했을 때 행동 순서" 카드가 들어있는 파일.
 *
 * 학생은 섞여 있는 카드를 올바른 순서로 배열합니다.
 *
 * ★ 선생님이 순서를 바꾸고 싶으면 correctOrder 숫자를 고치세요. (1번이 가장 먼저)
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *
 * 📌 기획서가 도착하면 이 순서를 기획서 내용으로 교체합니다.
 */

import type { Difficulty } from "./types";

export type DispatchStep = {
  id: string;
  /** 카드에 보일 문구 */
  label: string;
  /** 왜 이 순서인지 설명 (오답 시 해설) */
  explanation: string;
  /** ★ 정답 순서. 1이 가장 먼저. */
  correctOrder: number;
  /** 코덱스가 아이콘 고를 때 참고할 힌트 */
  illustrationHint: string;
  /** 이 카드가 나오는 난이도 */
  levels: Difficulty[];
};

export const DISPATCH_STEPS: DispatchStep[] = [
  {
    id: "step-safety",
    label: "주변이 안전한지 먼저 확인한다",
    explanation:
      "돕는 사람이 다치면 환자도 못 구해요. 차가 오는지, 위험한 게 없는지 먼저 봅니다.",
    correctOrder: 1,
    illustrationHint: "주변을 둘러보는 사람 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "step-response",
    label: "어깨를 두드리며 반응을 확인한다",
    explanation:
      "\"괜찮으세요?\" 하고 어깨를 두드려 봅니다. 반응이 없으면 심정지를 의심해요.",
    correctOrder: 2,
    illustrationHint: "어깨를 두드리는 손 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "step-call",
    label: "한 사람을 콕 집어 119에 신고해 달라고 부탁한다",
    explanation:
      "\"거기 파란 옷 입으신 분, 119에 신고해 주세요!\"처럼 한 사람을 정확히 지목해야 해요. 그냥 \"누가 신고 좀\"이라고 하면 아무도 안 합니다.",
    correctOrder: 3,
    illustrationHint: "손가락으로 사람을 가리키는 아이콘 + 전화 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "step-aed-request",
    label: "다른 사람에게 자동심장충격기를 가져와 달라고 부탁한다",
    explanation:
      "가슴압박과 자동심장충격기를 같이 쓰면 살아날 확률이 훨씬 높아져요. 신고와 동시에 부탁합니다.",
    correctOrder: 4,
    illustrationHint: "AED 기계 아이콘 + 달려가는 사람",
    levels: ["middle"],
  },
  {
    id: "step-breathing",
    label: "숨을 쉬는지 확인한다",
    explanation:
      "가슴이 오르내리는지 10초 안에 봅니다. 숨을 안 쉬거나 이상하게 쉬면 바로 가슴압박을 시작해요.",
    correctOrder: 5,
    illustrationHint: "가슴을 바라보는 눈 아이콘",
    levels: ["elementary", "middle"],
  },
  {
    id: "step-compression",
    label: "가슴 압박을 시작한다",
    explanation:
      "가슴 한가운데를 분당 100~120회 속도로 깊고 빠르게 누릅니다. 구급대원이 올 때까지 멈추지 않아요.",
    correctOrder: 6,
    illustrationHint: "두 손을 포갠 가슴압박 자세 아이콘",
    levels: ["elementary", "middle"],
  },
];

/** 난이도에 맞는 카드만 골라서, 정답 순서대로 돌려줍니다. */
export function getDispatchSteps(difficulty: Difficulty): DispatchStep[] {
  return DISPATCH_STEPS.filter((step) => step.levels.includes(difficulty)).sort(
    (a, b) => a.correctOrder - b.correctOrder,
  );
}
