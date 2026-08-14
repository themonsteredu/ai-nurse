/**
 * 앱 전체가 공유하는 "용어 사전" 파일.
 *
 * 여기 있는 건 값이 아니라 "이름의 정의"입니다.
 * 예: 난이도는 초등/중등 둘 뿐이고, 미션 ID는 아래 목록만 쓴다는 약속.
 *
 * ⚠️ 코덱스(디자인 담당 AI)는 이 파일을 수정하지 않습니다.
 */

/** 난이도. 시작 화면에서 학생이 고릅니다. */
export type Difficulty = "elementary" | "middle";

/** 미션(부서) 종류. 로비의 현장 표지와 1:1로 대응합니다. */
export type MissionId =
  | "er"
  | "ambulance"
  | "healthRoom"
  | "operatingRoom"
  | "icu"
  | "medication";

/**
 * 중증도 분류 구역 색깔. 미션 1에서 사용합니다.
 *
 * 초등 모드는 빨강·노랑·초록·파랑 4개 구역만 씁니다.
 * 중등 모드는 여기에 주황("몇 분 안에")이 하나 더 붙어 5개가 됩니다.
 *
 * 진로체험 수업이라 사망(검정) 구역은 두지 않습니다.
 */
export type TriageLevel = "red" | "orange" | "yellow" | "green" | "blue";

/**
 * 채점 결과의 기본 단위.
 * correct = 맞은 개수, total = 전체 개수.
 * 정확도(%)는 lib/scoring.ts 에서 이 둘로 계산합니다.
 */
export type ScoreTally = {
  correct: number;
  total: number;
};

/** 한 미션을 끝냈을 때 남는 성적표. */
export type MissionResult = {
  missionId: MissionId;
  tally: ScoreTally;
  /** 0~100 정수. lib/scoring.ts 가 계산해서 채웁니다. */
  accuracyPercent: number;
  /** 난이도별 통과 기준을 넘었는지. */
  passed: boolean;
};
