"use client";

/**
 * 위에서 내려다본 3D 병원 캠퍼스에 세 현장 진입 버튼을 얹은 미션 지도입니다.
 * 배경 이미지는 시각적 맥락만 제공하며, 각 노드 전체가 실제 미션 진입 버튼입니다.
 */

import Image from "next/image";
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
  er: { left: 9, top: 59, width: 19, height: 13 },
  ambulance: { left: 76, top: 62, width: 18, height: 13 },
  healthRoom: { left: 70, top: 19, width: 19, height: 13 },
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
    enterTimerRef.current = window.setTimeout(() => {
      onEnterRoom(missionId);
      setEnteringMission(null);
      enterTimerRef.current = null;
    }, 420);
  }

  const enteringRoom = rooms.find((room) => room.missionId === enteringMission);

  return (
    <section className={styles.network} aria-label="3D 병원 미션 지도">
      <div className={styles.networkHeader}>
        <span>LIVE HOSPITAL CAMPUS</span>
        <p><i aria-hidden="true" /> 3개 현장 연결 정상</p>
      </div>

      <div className={styles.campusStage}>
        <Image
          className={styles.campusImage}
          src="/assets/nurse/hospital-campus-3d.webp"
          alt="위에서 내려다본 현대적인 병원 캠퍼스. 응급실 입구와 구급차 출동 구역, 병동 건물이 연결되어 있다."
          fill
          priority
          sizes="(max-width: 640px) 100vw, 1200px"
        />
        <div className={styles.campusShade} aria-hidden="true" />

        <div className={styles.positionMarker} aria-hidden="true">
          <span />
          <small>MISSION CONTROL</small>
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
              <span className={styles.nodeIndex} aria-hidden="true">
                {String(room.order).padStart(2, "0")}
              </span>
              <span className={styles.nodeCopy}>
                <span className={styles.nodeCategory}>{meta.category}</span>
                <strong className={styles.nodeTitle}>{meta.displayTitle}</strong>
              </span>
              <span className={styles.nodeStatus}><i aria-hidden="true" />{status}</span>
            </button>
          );
        })}
      </div>

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
