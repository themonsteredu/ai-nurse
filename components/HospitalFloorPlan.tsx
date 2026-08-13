"use client";

/**
 * 병원 조감도 — 위에서 내려다본 병원 평면도.
 *
 * 무엇을 하나:
 *   부서 세 곳을 병원 건물 안의 "구역"으로 그리고,
 *   학생이 구역을 누르면 그 미션으로 들어갑니다.
 *   이미 다녀온 구역은 불이 켜집니다.
 *
 * 어떤 데이터를 받나:
 *   - rooms : 부서별 이름·설명·완료 여부 (LobbyScreen 이 만들어서 넘겨줍니다)
 *   - onEnterRoom : 구역을 눌렀을 때 실행할 일
 *
 * 어떻게 만들었나 (코덱스가 알아야 할 구조):
 *   1) 뒤쪽 SVG = 건물 껍데기, 복도, 안내데스크, 구급차 진입로 (그림만, 누를 수 없음)
 *   2) 앞쪽 버튼 = 부서 세 곳 (진짜 버튼이라 키보드로도 눌리고 확대해도 안 깨짐)
 *   두 층이 같은 좌표표(ROOM_LAYOUT)를 보고 그려지므로,
 *   방 위치를 옮기고 싶으면 ROOM_LAYOUT 숫자만 바꾸면 그림과 버튼이 같이 움직입니다.
 *
 * 감정 톤: 병원에 막 도착해서 어디로 갈지 고르는 설렘.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    조감도를 더 실감나게(복도, 대기의자, 화단 등) 그려도 좋습니다.
 *    ⚠️ 단, 부서가 세 곳이라는 것과 누르면 들어간다는 동작은 유지해주세요.
 */

import type { MissionId } from "@/data/types";

import styles from "./HospitalFloorPlan.module.css";

/** 조감도에 표시할 부서 한 곳의 정보. */
export type HospitalRoom = {
  missionId: MissionId;
  /** 부서 이름 (예: 응급실) */
  title: string;
  /** 한 줄 설명 */
  subtitle: string;
  /** 미션 순서 (1~3) */
  order: number;
  /** 이 부서를 다녀왔는지 */
  visited: boolean;
  /** 배지를 받았는지 (통과했는지) */
  badgeEarned: boolean;
};

/**
 * 각 부서가 병원 평면도에서 차지하는 자리.
 * 숫자는 조감도 전체 크기 대비 퍼센트(%)입니다.
 * 예: left 4, width 45 → 왼쪽에서 4% 지점부터 가로 45%만큼.
 *
 * 방 위치를 바꾸고 싶으면 이 숫자만 고치면 됩니다.
 */
const ROOM_LAYOUT: Record<
  MissionId,
  { left: number; top: number; width: number; height: number; icon: string; wing: string }
> = {
  // 응급실 — 구급차가 바로 들어오는 서쪽 구역
  er: { left: 4, top: 5, width: 45, height: 44, icon: "🚨", wing: "서관" },
  // 보건실 — 조용한 동쪽 구역
  healthRoom: { left: 51, top: 5, width: 45, height: 44, icon: "🩹", wing: "동관" },
  // 119 구급차 — 건물 아래쪽 출동 구역
  ambulance: { left: 4, top: 60, width: 92, height: 35, icon: "🚑", wing: "출동구역" },
};

type HospitalFloorPlanProps = {
  rooms: HospitalRoom[];
  onEnterRoom: (missionId: MissionId) => void;
};

export function HospitalFloorPlan({
  rooms,
  onEnterRoom,
}: HospitalFloorPlanProps) {
  return (
    <div className={styles.plan}>
      {/* ---------- 뒤쪽: 건물 그림 (누를 수 없는 배경) ---------- */}
      <svg
        className={styles.blueprint}
        viewBox="0 0 1000 640"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* 건물 바닥 */}
        <rect
          x="8"
          y="8"
          width="984"
          height="624"
          rx="20"
          className={styles.buildingFloor}
        />

        {/* 가운데 복도 (응급실·보건실과 출동구역 사이) */}
        <rect x="24" y="320" width="952" height="64" className={styles.corridor} />

        {/* 복도 바닥 타일 무늬 */}
        {Array.from({ length: 19 }, (_, index) => (
          <line
            key={index}
            x1={24 + index * 50}
            y1="320"
            x2={24 + index * 50}
            y2="384"
            className={styles.tileLine}
          />
        ))}

        {/* 구급차 진입로 — 출동구역에서 건물 밖으로 나가는 길 */}
        <path d="M 430 608 L 430 640" className={styles.drivewayEdge} />
        <path d="M 570 608 L 570 640" className={styles.drivewayEdge} />
        <path
          d="M 500 608 L 500 640"
          className={styles.drivewayCenterLine}
          strokeDasharray="12 10"
        />
      </svg>

      {/* 안내데스크 — 복도 한가운데. 글자가 있어야 해서 그림이 아닌 실제 요소입니다. */}
      <div className={styles.receptionDesk} aria-hidden="true">
        🛎️ 안내데스크
      </div>

      {/* ---------- 앞쪽: 누를 수 있는 부서 버튼 ---------- */}
      {rooms.map((room) => {
        const layout = ROOM_LAYOUT[room.missionId];
        return (
          <button
            key={room.missionId}
            type="button"
            className={styles.room}
            data-mission={room.missionId}
            data-visited={room.visited}
            style={{
              left: `${layout.left}%`,
              top: `${layout.top}%`,
              width: `${layout.width}%`,
              height: `${layout.height}%`,
            }}
            onClick={() => onEnterRoom(room.missionId)}
            aria-label={`${room.title} — ${room.subtitle}. ${
              room.visited ? "이미 다녀왔어요. 다시 들어갑니다." : "들어갑니다."
            }`}
          >
            <span className={styles.roomWing}>
              미션 {room.order} · {layout.wing}
            </span>

            <span className={styles.roomIcon} aria-hidden="true">
              {layout.icon}
            </span>

            <span className={styles.roomTitle}>{room.title}</span>
            <span className={styles.roomSubtitle}>{room.subtitle}</span>

            {/* 다녀온 구역에 켜지는 불 */}
            <span className={styles.roomStatus} data-earned={room.badgeEarned}>
              {room.visited
                ? room.badgeEarned
                  ? "★ 배지 획득"
                  : "다녀왔어요"
                : "들어가기"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
