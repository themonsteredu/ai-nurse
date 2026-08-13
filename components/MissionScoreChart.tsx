"use client";

/**
 * 최종 리포트의 미션별 점수 그래프.
 *
 * 무엇을 보여주나:
 *   세 미션의 정확도를 가로 막대로 나란히 보여줍니다.
 *   가장 잘한 미션에 표시가 붙습니다. (그게 나의 간호 유형이 된 이유)
 *
 * 어떤 데이터를 받나:
 *   - results : 미션별 성적표 (lib/session.ts 에서 옴)
 *
 * ⚠️ 색맹 학생을 위해 막대 길이만이 아니라 숫자(%)도 함께 적습니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import { MISSIONS } from "@/data/missions";
import type { MissionResult } from "@/data/types";
import { bestMission } from "@/lib/nurse-type";

import styles from "./MissionScoreChart.module.css";

export function MissionScoreChart({ results }: { results: MissionResult[] }) {
  const best = bestMission(results);

  return (
    <ul className={styles.chart}>
      {results.map((result) => {
        const mission = MISSIONS[result.missionId];
        const isBest = result.missionId === best;

        return (
          <li key={result.missionId} className={styles.row}>
            <div className={styles.header}>
              <span className={styles.name}>
                {mission.title}
                {isBest ? (
                  <span className={styles.bestTag}>가장 잘한 곳</span>
                ) : null}
              </span>
              <span className={styles.percent}>{result.accuracyPercent}%</span>
            </div>

            <div className={styles.track}>
              <div
                className={styles.bar}
                data-mission={result.missionId}
                style={{ width: `${result.accuracyPercent}%` }}
              />
            </div>

            <p className={styles.detail}>
              {result.tally.total}점 중 {result.tally.correct}점 ·{" "}
              {result.passed ? `★ ${mission.badgeName}` : "배지 미획득"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
