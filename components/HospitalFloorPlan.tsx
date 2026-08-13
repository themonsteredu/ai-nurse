"use client";

/**
 * 로비에서 사용하는 1층 병원 조감도입니다.
 * 방 전체가 큰 버튼이라 터치로 들어가기 쉽지만, 카드가 아니라 실제 방처럼 보이게
 * 벽·문·가구·차량을 위에서 내려다본 모양으로 구성합니다.
 */

import type { MissionId } from "@/data/types";

import styles from "./HospitalFloorPlan.module.css";

export type HospitalRoom = {
  missionId: MissionId;
  title: string;
  subtitle: string;
  order: number;
  visited: boolean;
  badgeEarned: boolean;
};

const ROOM_LAYOUT: Record<
  MissionId,
  { left: number; top: number; width: number; height: number; wing: string }
> = {
  er: { left: 2.8, top: 3.5, width: 55, height: 52, wing: "서관" },
  healthRoom: { left: 59.2, top: 3.5, width: 38, height: 52, wing: "동관" },
  ambulance: { left: 2.8, top: 64, width: 94.4, height: 32.5, wing: "출동구역" },
};

type HospitalFloorPlanProps = {
  rooms: HospitalRoom[];
  onEnterRoom: (missionId: MissionId) => void;
};

function RoomFurniture({ missionId }: { missionId: MissionId }) {
  if (missionId === "er") {
    return (
      <span className={styles.furniture} aria-hidden="true">
        <span className={styles.erStation} />
        <span className={styles.erBed} data-bed="1"><i /></span>
        <span className={styles.erBed} data-bed="2"><i /></span>
        <span className={styles.erBed} data-bed="3"><i /></span>
        <span className={styles.monitor} data-monitor="1" />
        <span className={styles.monitor} data-monitor="2" />
        <span className={styles.monitor} data-monitor="3" />
      </span>
    );
  }

  if (missionId === "healthRoom") {
    return (
      <span className={styles.furniture} aria-hidden="true">
        <span className={styles.healthBed}><i /></span>
        <span className={styles.healthDesk} />
        <span className={styles.healthChair} />
        <span className={styles.healthCabinet} />
        <span className={styles.healthSink} />
      </span>
    );
  }

  return (
    <span className={styles.furniture} aria-hidden="true">
      <span className={styles.ambulanceVehicle}>
        <i className={styles.vehicleCab} />
        <i className={styles.vehicleCross}>+</i>
        <i className={styles.vehicleLight} />
      </span>
      <span className={styles.garageRail} data-rail="1" />
      <span className={styles.garageRail} data-rail="2" />
      <span className={styles.dispatchDesk} />
    </span>
  );
}

export function HospitalFloorPlan({
  rooms,
  onEnterRoom,
}: HospitalFloorPlanProps) {
  return (
    <div className={styles.plan}>
      <svg
        className={styles.blueprint}
        viewBox="0 0 1000 640"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="10" y="10" width="980" height="610" rx="24" className={styles.siteGround} />
        <rect x="24" y="22" width="952" height="344" rx="12" className={styles.buildingFloor} />
        <rect x="24" y="366" width="952" height="46" className={styles.corridor} />

        {Array.from({ length: 20 }, (_, index) => (
          <line
            key={index}
            x1={24 + index * 50}
            y1="366"
            x2={24 + index * 50}
            y2="412"
            className={styles.tileLine}
          />
        ))}

        <path d="M 565 22 L 565 340" className={styles.wallLine} />
        <path d="M 498 366 L 498 412" className={styles.corridorGuide} />
        <path d="M 48 500 L 952 500" className={styles.drivewayCenterLine} />
        <path d="M 48 590 L 952 590" className={styles.drivewayCenterLine} />
        <path d="M 120 545 L 880 545" className={styles.laneDash} />

        <g className={styles.waitingArea}>
          <rect x="88" y="377" width="48" height="23" rx="7" />
          <rect x="145" y="377" width="48" height="23" rx="7" />
          <rect x="805" y="377" width="48" height="23" rx="7" />
          <rect x="862" y="377" width="48" height="23" rx="7" />
        </g>

        <g className={styles.planter}>
          <circle cx="240" cy="389" r="14" />
          <circle cx="760" cy="389" r="14" />
        </g>
      </svg>

      <div className={styles.receptionDesk} aria-hidden="true">
        <span>+</span>
        <strong>중앙 안내</strong>
      </div>

      <div className={styles.studentMarker} aria-hidden="true">
        <span />
        <strong>나</strong>
      </div>

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
            aria-label={`${room.title}, ${room.subtitle}. ${
              room.visited ? "이미 방문했어요. 다시 들어갑니다." : "들어갑니다."
            }`}
          >
            <RoomFurniture missionId={room.missionId} />

            <span className={styles.roomHeader}>
              <span className={styles.roomWing}>미션 {room.order} · {layout.wing}</span>
              <span className={styles.roomStatus} data-earned={room.badgeEarned}>
                {room.badgeEarned ? "★ 배지 획득" : room.visited ? "다시 훈련" : "입장"}
              </span>
            </span>

            <span className={styles.roomCopy}>
              <span className={styles.roomTitle}>{room.title}</span>
              <span className={styles.roomSubtitle}>{room.subtitle}</span>
            </span>
            <span className={styles.door} aria-hidden="true" />
          </button>
        );
      })}

      <p className={styles.mapHint}>방을 눌러 직접 이동하세요</p>
    </div>
  );
}
