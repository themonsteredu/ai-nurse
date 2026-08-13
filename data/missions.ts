/**
 * 로비에 보이는 부서 카드 3장의 내용이 들어있는 파일.
 *
 * 각 미션의 이름, 한 줄 설명, 감정 톤(코덱스가 디자인할 때 참고할 분위기)을 담습니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 수정하지 않습니다. 읽기만 합니다.
 */

import type { MissionId } from "./types";

export type MissionInfo = {
  id: MissionId;
  /** 로비 카드에 크게 보일 이름 */
  title: string;
  /** 카드 아래 한 줄 설명 */
  subtitle: string;
  /** 미션 시작 화면에서 학생에게 주는 임무 설명 */
  briefing: string;
  /** 이 미션을 통과하면 받는 배지 이름 */
  badgeName: string;
  /**
   * 코덱스가 디자인할 때 참고할 분위기.
   * 화면 로직에는 영향을 주지 않습니다.
   */
  mood: string;
  /** 로비 카드 순서 */
  order: number;
};

export const MISSIONS: Record<MissionId, MissionInfo> = {
  er: {
    id: "er",
    title: "응급실",
    subtitle: "누구부터 살릴까?",
    briefing:
      "환자가 한꺼번에 몰려왔어요. 더 위급한 사람부터 치료해야 합니다. 환자 카드를 알맞은 색깔 구역으로 옮겨주세요.",
    badgeName: "중증도 분류 배지",
    mood: "긴박하고 빠른 분위기. 시간에 쫓기는 느낌.",
    order: 1,
  },
  ambulance: {
    id: "ambulance",
    title: "119 구급차",
    subtitle: "골든타임 4분",
    briefing:
      "길에서 사람이 쓰러졌어요. 신고하고, 가슴을 압박하고, 자동심장충격기를 붙여야 합니다.",
    badgeName: "심폐소생술 배지",
    mood: "집중되고 리듬감 있는 분위기. 손끝에 힘이 들어가는 느낌.",
    order: 2,
  },
  healthRoom: {
    id: "healthRoom",
    title: "보건실",
    subtitle: "괜찮아, 내가 도와줄게",
    briefing:
      "친구들이 다쳐서 보건실에 왔어요. 상황마다 가장 알맞은 처치를 골라주세요.",
    badgeName: "응급처치 배지",
    mood: "따뜻하고 안심되는 분위기. 부드럽고 친절한 느낌.",
    order: 3,
  },
};

/** 로비에 보여줄 순서대로 정렬된 미션 목록. */
export const MISSION_LIST: MissionInfo[] = Object.values(MISSIONS).sort(
  (a, b) => a.order - b.order,
);
