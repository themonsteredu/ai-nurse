export type SurgeryStoryScene =
  | "briefing"
  | "prep"
  | "instrumentCheck"
  | "handoff"
  | "surgeryProgress"
  | "incident"
  | "count"
  | "complete";

export type SurgerySpeaker = "집도의" | "수술실 간호사" | "수술팀";

export type SurgeryDialogueLine = {
  speaker: SurgerySpeaker;
  text: string;
};

export const SURGERY_SCENES: Record<
  SurgeryStoryScene,
  { src: string; alt: string; eyebrow: string }
> = {
  briefing: {
    src: "/assets/nurse/surgery/scene-01-briefing.webp",
    alt: "수술 전 브리핑을 하는 집도의와 수술실 간호사, 준비 중인 환자",
    eyebrow: "SCENE 01 · TEAM BRIEFING",
  },
  prep: {
    src: "/assets/nurse/surgery/scene-02-prep.webp",
    alt: "멸균 포장과 수술 물품을 확인하는 수술실 간호사",
    eyebrow: "SCENE 02 · STERILE PREP",
  },
  instrumentCheck: {
    src: "/assets/nurse/surgery/scene-03-instrument-check.webp",
    alt: "수술 기구를 역할에 따라 정리하는 수술실 간호사",
    eyebrow: "SCENE 03 · INSTRUMENT CHECK",
  },
  handoff: {
    src: "/assets/nurse/surgery/scene-04-handoff.webp",
    alt: "집도의의 요청에 맞춰 기구를 전달하는 수술실 간호사",
    eyebrow: "SCENE 04 · FIRST HANDOFF",
  },
  surgeryProgress: {
    src: "/assets/nurse/surgery/scene-05-surgery-progress.webp",
    alt: "수술 진행 중 다음 기구를 준비하는 수술실 간호사",
    eyebrow: "SCENE 05 · SURGERY IN PROGRESS",
  },
  incident: {
    src: "/assets/nurse/surgery/scene-06-incident.webp",
    alt: "멸균 영역 밖으로 떨어진 기구를 발견하고 수술을 멈춘 팀",
    eyebrow: "SCENE 06 · STERILE INCIDENT",
  },
  count: {
    src: "/assets/nurse/surgery/scene-07-count.webp",
    alt: "수술포와 바닥, 폐기통 주변에서 빠진 거즈를 확인하는 수술팀",
    eyebrow: "SCENE 07 · SAFETY COUNT",
  },
  complete: {
    src: "/assets/nurse/surgery/scene-08-complete.webp",
    alt: "기구와 거즈 카운트를 확인하고 수술을 마무리하는 수술팀",
    eyebrow: "SCENE 08 · SAFE CLOSE",
  },
};

export const SURGERY_DIALOGUES: Record<SurgeryStoryScene, SurgeryDialogueLine[]> = {
  briefing: [
    { speaker: "집도의", text: "오늘 수술은 복강경 수술입니다. 수술 준비 상태 확인 부탁합니다." },
    { speaker: "수술실 간호사", text: "네. 환자 확인과 멸균 기구 준비부터 진행하겠습니다." },
  ],
  prep: [
    { speaker: "수술실 간호사", text: "포장 상태를 보고 사용할 물품과 격리할 물품을 나누겠습니다." },
  ],
  instrumentCheck: [
    { speaker: "수술실 간호사", text: "수술 흐름에 맞춰 기구를 역할별로 준비하겠습니다." },
  ],
  handoff: [
    { speaker: "집도의", text: "수술을 시작하겠습니다. 요청하는 기구를 확인해 주세요." },
  ],
  surgeryProgress: [
    { speaker: "집도의", text: "수술이 진행 중입니다. 다음 요청에 바로 대응해 주세요." },
  ],
  incident: [
    { speaker: "집도의", text: "잠깐, 방금 기구가 멸균 영역 밖으로 떨어졌습니다." },
    { speaker: "수술실 간호사", text: "확인했습니다. 환자 안전을 기준으로 처리하겠습니다." },
  ],
  count: [
    { speaker: "수술실 간호사", text: "거즈 카운트 확인하겠습니다. 사용 5개, 회수 4개입니다." },
    { speaker: "집도의", text: "한 개가 부족하네요. 수술 종료 전에 반드시 찾아야 합니다." },
  ],
  complete: [
    { speaker: "집도의", text: "카운트 확인됐나요?" },
    { speaker: "수술실 간호사", text: "네. 기구와 거즈 모두 확인됐습니다." },
    { speaker: "집도의", text: "좋습니다. 수술 마무리하겠습니다." },
  ],
};

export function getPrepResponse(
  label: string,
  destination: "sterile" | "isolate",
  correct: boolean,
): SurgeryDialogueLine[] {
  if (!correct) {
    return destination === "sterile"
      ? [{ speaker: "수술실 간호사", text: `${label}은 멸균 상태를 신뢰할 수 없습니다. 포장 상태를 다시 확인하겠습니다.` }]
      : [{ speaker: "수술실 간호사", text: `${label}은 멸균 포장이 확인된 기구입니다. 사용 가능한 구역을 다시 판단하겠습니다.` }];
  }

  return destination === "sterile"
    ? [{ speaker: "수술실 간호사", text: `${label}, 멸균 포장 상태 확인됐습니다. 이 기구는 사용 가능합니다.` }]
    : [{ speaker: "수술실 간호사", text: `${label}, 멸균 상태를 신뢰할 수 없습니다. 격리하겠습니다.` }];
}

export function getRolePrompt(roleLabel: string): SurgeryDialogueLine[] {
  return [{ speaker: "수술실 간호사", text: `${roleLabel}에 사용할 기구를 먼저 준비하겠습니다.` }];
}

export function getRoleResponse(label: string, correct: boolean): SurgeryDialogueLine[] {
  return correct
    ? [{ speaker: "수술실 간호사", text: `${label}, 역할 확인됐습니다. 준비대에 정리하겠습니다.` }]
    : [{ speaker: "수술실 간호사", text: `${label}의 모양과 쓰임이 요청한 역할과 다릅니다. 다시 확인하겠습니다.` }];
}

export function getHandoffPrompt(label: string): SurgeryDialogueLine[] {
  return [{ speaker: "집도의", text: `${label} 부탁합니다.` }];
}

export function getHandoffResponse(label: string, correct: boolean): SurgeryDialogueLine[] {
  return correct
    ? [
      { speaker: "수술실 간호사", text: `${label} 전달하겠습니다.` },
      { speaker: "집도의", text: "확인했습니다. 계속 진행하겠습니다." },
    ]
    : [
      { speaker: "수술실 간호사", text: "잠깐, 요청한 기구와 다릅니다. 전달 전에 다시 확인하겠습니다." },
      { speaker: "집도의", text: "좋습니다. 이름과 역할을 확인해 주세요." },
    ];
}

export const INCIDENT_RESPONSES = {
  retry: [
    { speaker: "수술실 간호사", text: "멸균 영역 밖으로 나온 기구는 오염 가능성이 있습니다." },
    { speaker: "집도의", text: "환자 감염 위험이 있으니 다시 판단해 주세요." },
  ],
  resolved: [
    { speaker: "수술실 간호사", text: "오염 가능성이 있어 새 멸균 기구로 교체하겠습니다." },
    { speaker: "집도의", text: "좋습니다. 계속 진행하겠습니다." },
  ],
} satisfies Record<string, SurgeryDialogueLine[]>;

export function getCountResponse(locationLabel: string, correct: boolean): SurgeryDialogueLine[] {
  return correct
    ? [
      { speaker: "수술실 간호사", text: "수술포 아래에서 발견했습니다." },
      { speaker: "수술실 간호사", text: "사용 5개, 회수 5개. 카운트 일치합니다." },
    ]
    : [{ speaker: "수술실 간호사", text: `${locationLabel}에는 없습니다. 다른 곳을 확인하겠습니다.` }];
}
