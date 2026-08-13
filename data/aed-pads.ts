/**
 * 미션 2 ③번 과제: 자동심장충격기(AED) 패드를 어디에 붙일지 정해둔 파일.
 *
 * 몸 그림 위에 붙일 수 있는 자리를 여러 개 만들어 두고,
 * 그중 두 곳이 정답입니다.
 *
 * 위치는 몸 그림의 가로·세로 비율(%)로 적습니다.
 * 예: x 30, y 25 = 그림의 왼쪽에서 30%, 위에서 25% 지점.
 * → 코덱스가 몸 그림을 새로 그려도 비율만 맞으면 그대로 동작합니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 *    (몸 그림은 바꿔도 되지만, 정답 좌표는 이 파일 기준입니다.)
 */

export type AedPadSpot = {
  id: string;
  /** 자리 이름 */
  label: string;
  /** 몸 그림 가로 위치 (0~100%). 보는 사람 기준 왼쪽이 0. */
  x: number;
  /** 몸 그림 세로 위치 (0~100%). 머리 쪽이 0. */
  y: number;
  /** ★ 여기가 정답 자리인지 */
  isCorrect: boolean;
  /** 정답/오답일 때 보여줄 해설 */
  explanation: string;
};

/**
 * 정답은 두 곳입니다.
 *  - 오른쪽 빗장뼈(쇄골) 바로 아래
 *  - 왼쪽 젖꼭지 바깥쪽 겨드랑이 아래
 * 이렇게 대각선으로 붙여야 전기가 심장을 가로질러 흐릅니다.
 */
export const AED_PAD_SPOTS: AedPadSpot[] = [
  {
    id: "pad-right-clavicle",
    label: "오른쪽 빗장뼈 아래",
    x: 34,
    y: 27,
    isCorrect: true,
    explanation:
      "오른쪽 빗장뼈 바로 아래가 첫 번째 정답 자리예요. 여기에 붙여야 전기가 심장을 지나갑니다.",
  },
  {
    id: "pad-left-flank",
    label: "왼쪽 젖꼭지 바깥쪽, 겨드랑이 아래",
    x: 68,
    y: 46,
    isCorrect: true,
    explanation:
      "왼쪽 옆구리 겨드랑이 아래가 두 번째 정답 자리예요. 두 패드를 대각선으로 붙여야 전기가 심장을 가로질러 흐릅니다.",
  },
  {
    id: "pad-left-clavicle",
    label: "왼쪽 빗장뼈 아래",
    x: 66,
    y: 27,
    isCorrect: false,
    explanation:
      "두 패드를 위쪽에 나란히 붙이면 전기가 심장을 지나지 않고 가슴 위쪽으로만 흘러요. 하나는 아래쪽 옆구리에 붙여야 합니다.",
  },
  {
    id: "pad-center-chest",
    label: "가슴 한가운데",
    x: 50,
    y: 38,
    isCorrect: false,
    explanation:
      "가슴 한가운데는 가슴압박을 하는 자리예요. 패드를 여기 붙이면 압박할 곳이 없어집니다.",
  },
  {
    id: "pad-belly",
    label: "배꼽 근처",
    x: 50,
    y: 66,
    isCorrect: false,
    explanation:
      "배는 심장에서 너무 멀어요. 여기 붙이면 전기가 심장까지 닿지 않습니다.",
  },
  {
    id: "pad-right-flank",
    label: "오른쪽 옆구리",
    x: 32,
    y: 46,
    isCorrect: false,
    explanation:
      "심장은 가슴 가운데에서 약간 왼쪽에 있어요. 오른쪽 아래에 붙이면 전기가 심장을 비껴갑니다.",
  },
];

/** 정답 자리 목록 (두 곳). */
export const CORRECT_AED_PAD_SPOTS: AedPadSpot[] = AED_PAD_SPOTS.filter(
  (spot) => spot.isCorrect,
);

/** 학생이 붙여야 하는 패드 개수. */
export const AED_PAD_COUNT = CORRECT_AED_PAD_SPOTS.length;
