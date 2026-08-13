"use client";

/**
 * 가슴압박 속도(BPM)를 실시간으로 보여주는 계기판.
 *
 * 무엇을 보여주나:
 *   지금 분당 몇 번 누르고 있는지, 그리고 그게 알맞은 속도인지.
 *   느림 / 알맞음 / 빠름 세 가지로 알려줍니다.
 *
 * 어떤 데이터를 받나:
 *   - bpm : 지금 속도. 아직 두 번도 안 눌렀으면 null.
 *
 * ⚠️ "분당 100~120회"라는 기준은 이 파일에 없습니다.
 *    lib/cpr.ts 의 rhythmZone() 과 targetBpmRange() 가 판단합니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    ⚠️ 다만 색만으로 알려주지 말고 글자(느려요/좋아요/빨라요)도 남겨주세요.
 */

import { rhythmZone, targetBpmRange, type RhythmZone } from "@/lib/cpr";

import styles from "./BpmMeter.module.css";

/** 상태별로 학생에게 보여줄 말. */
const ZONE_MESSAGE: Record<RhythmZone, string> = {
  slow: "더 빠르게!",
  good: "좋아요! 이 속도 유지",
  fast: "조금 천천히 — 너무 빠르면 깊이가 얕아져요",
};

const ZONE_LABEL: Record<RhythmZone, string> = {
  slow: "느려요",
  good: "좋아요",
  fast: "빨라요",
};

export function BpmMeter({ bpm }: { bpm: number | null }) {
  const target = targetBpmRange();
  const zone = bpm === null ? null : rhythmZone(bpm);

  return (
    <div className={styles.meter} data-zone={zone ?? "none"}>
      <div className={styles.readout}>
        <span className={styles.value}>{bpm === null ? "--" : bpm}</span>
        <span className={styles.unit}>회 / 분</span>
      </div>

      <p className={styles.target}>
        목표 {target.min}~{target.max}회
      </p>

      {zone ? (
        <>
          <p className={styles.zoneLabel}>{ZONE_LABEL[zone]}</p>
          <p className={styles.zoneMessage} role="status">
            {ZONE_MESSAGE[zone]}
          </p>
        </>
      ) : (
        <p className={styles.zoneMessage}>눌러서 시작하세요</p>
      )}
    </div>
  );
}
