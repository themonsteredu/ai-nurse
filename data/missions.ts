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
  operatingRoom: {
    id: "operatingRoom",
    title: "수술실",
    subtitle: "멸균선을 지켜라",
    briefing:
      "수술 전 준비가 시작됐어요. 기구를 직접 옮겨 멸균 트레이를 완성하고, 오염 위험 물품은 격리 구역으로 분리하세요.",
    badgeName: "수술 안전 배지",
    mood: "정교하고 활기찬 분위기. 손을 움직여 정확한 위치를 완성하는 느낌.",
    order: 4,
  },
  icu: {
    id: "icu",
    title: "중환자실",
    subtitle: "모니터의 변화를 읽어라",
    briefing:
      "여러 환자의 활력징후가 동시에 바뀌고 있어요. 모니터를 비교해 가장 먼저 확인할 환자를 고르고 신속 대응하세요.",
    badgeName: "집중 관찰 배지",
    mood: "차분하지만 긴장감 있는 분위기. 변화를 읽고 즉시 움직이는 느낌.",
    order: 5,
  },
  medication: {
    id: "medication",
    title: "투약실",
    subtitle: "한 번 더 확인",
    briefing:
      "투약 전에는 환자와 처방, 약품이 정확히 일치해야 해요. 팔찌를 스캔하고 알맞은 약품을 확인 트레이로 옮기세요.",
    badgeName: "투약 안전 배지",
    mood: "밝고 정확한 분위기. 스캔하고 대조하며 오류를 찾아내는 느낌.",
    order: 6,
  },
};

/** 로비에 보여줄 순서대로 정렬된 미션 목록. */
export const MISSION_LIST: MissionInfo[] = Object.values(MISSIONS).sort(
  (a, b) => a.order - b.order,
);
