"use client";

/**
 * 병원 공간을 흉내 낸 CSS 평면도가 아니라, 세 현장을 연결한 미션 네트워크입니다.
 * 기능상 각 노드 전체가 기존과 동일한 미션 진입 버튼입니다.
 */

import { useEffect, useRef, useState } from "react";

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
  { left: number; top: number; width: number; height: number }
> = {
  er: { left: 3, top: 7, width: 41, height: 39 },
  ambulance: { left: 56, top: 7, width: 41, height: 39 },
  healthRoom: { left: 29.5, top: 58, width: 41, height: 35 },
};

const MISSION_META: Record<
  MissionId,
  { category: string; displayTitle: string; task: string }
> = {
  er: {
    category: "EMERGENCY",
    displayTitle: "응급실",
    task: "환자 상태 확인",
  },
  ambulance: {
    category: "AMBULANCE",
    displayTitle: "119 출동",
    task: "골든타임 대응",
  },
  healthRoom: {
    category: "WARD",
    displayTitle: "병동",
    task: "상황별 처치 판단",
  },
};

type HospitalFloorPlanProps = {
  rooms: HospitalRoom[];
  onEnterRoom: (missionId: MissionId) => void;
};

export function HospitalFloorPlan({
  rooms,
  onEnterRoom,
}: HospitalFloorPlanProps) {
  const [enteringMission, setEnteringMission] = useState<MissionId | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
    };
  }, []);

  function beginMissionEntry(missionId: MissionId) {
    if (enteringMission !== null) return;
    setEnteringMission(missionId);
    enterTimerRef.current = window.setTimeout(() => onEnterRoom(missionId), 420);
  }

  const enteringRoom = rooms.find((room) => room.missionId === enteringMission);

  return (
    <section className={styles.network} aria-label="병원 미션 네트워크">
      <div className={styles.networkHeader}>
        <span>HOSPITAL MISSION NETWORK</span>
        <p><i aria-hidden="true" /> 현장 연결 정상</p>
      </div>

      <svg
        className={styles.routeLines}
        viewBox="0 0 1000 560"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M 235 158 L 500 158 L 765 158" />
        <path d="M 500 158 L 500 414" />
      </svg>

      <div className={styles.positionMarker} aria-hidden="true">
        <span />
        <small>YOU ARE HERE</small>
      </div>

      {rooms.map((room) => {
        const layout = ROOM_LAYOUT[room.missionId];
        const meta = MISSION_META[room.missionId];
        const status = room.badgeEarned
          ? "COMPLETE"
          : room.visited
            ? "RETRY"
            : "READY";

        return (
          <button
            key={room.missionId}
            type="button"
            className={styles.missionNode}
            data-mission={room.missionId}
            data-status={status.toLowerCase()}
            data-entering={enteringMission === room.missionId}
            style={{
              left: `${layout.left}%`,
              top: `${layout.top}%`,
              width: `${layout.width}%`,
              height: `${layout.height}%`,
            }}
            disabled={enteringMission !== null}
            onClick={() => beginMissionEntry(room.missionId)}
            aria-label={`미션 ${room.order}, ${meta.category}, ${meta.displayTitle}, 상태 ${status}`}
          >
            <span className={styles.nodeNumber} aria-hidden="true">
              {String(room.order).padStart(2, "0")}
            </span>
            <span className={styles.nodeTopline}>
              <span>MISSION {String(room.order).padStart(2, "0")}</span>
              <span className={styles.nodeStatus}>{status}</span>
            </span>
            <span className={styles.nodeCategory}>{meta.category}</span>
            <span className={styles.nodeTitle}>{meta.displayTitle}</span>
            <span className={styles.nodeTask}>{meta.task}</span>
            <span className={styles.nodeAction}>OPEN MISSION <i aria-hidden="true">→</i></span>
          </button>
        );
      })}

      {enteringRoom ? (
        <div className={styles.entryBrief} role="status" aria-live="polite">
          <span>MISSION {String(enteringRoom.order).padStart(2, "0")}</span>
          <strong>{MISSION_META[enteringRoom.missionId].category}</strong>
          <p>{MISSION_META[enteringRoom.missionId].task}</p>
          <i aria-hidden="true" />
        </div>
      ) : null}
    </section>
  );
}
