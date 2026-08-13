"use client";

/**
 * 📌 임시 화면입니다. 3~5단계에서 진짜 미션 화면으로 교체됩니다.
 *
 * 왜 만들었나:
 *   선생님이 지금 당장 전체 흐름을 눌러볼 수 있게 하기 위해서입니다.
 *   "시작 → 로비 → 미션 → 통과 코드 → 로비(배지 켜짐) → 리포트"
 *   이 길이 제대로 이어지는지 확인하는 용도입니다.
 *
 * 여기 있는 "통과한 셈 치기 / 못 넘긴 셈 치기" 버튼은
 * 진짜 미션이 만들어지면 사라집니다. 학생에게 보여줄 화면이 아닙니다.
 *
 * ✅ 코덱스(디자인 담당 AI)에게: 이 파일은 디자인할 필요가 없습니다.
 *    어차피 3~5단계에서 없어집니다.
 */

import { useRouter } from "next/navigation";

import { MISSIONS } from "@/data/missions";
import type { MissionId } from "@/data/types";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./MissionPlaceholder.module.css";

/** 각 미션을 몇 단계에서 만드는지. 화면에 안내로 보여줍니다. */
const BUILD_STEP: Record<MissionId, string> = {
  er: "3단계",
  ambulance: "4단계",
  healthRoom: "5단계",
};

export function MissionPlaceholder({ missionId }: { missionId: MissionId }) {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();

  if (session === null) return null;

  const mission = MISSIONS[missionId];

  /**
   * 임시로 성적을 만들어 넣고 통과 코드 화면으로 보냅니다.
   * 통과 기준 판정은 lib/scoring.ts 가 난이도에 맞게 알아서 합니다.
   */
  function finishWith(correct: number, total: number) {
    saveMissionResult(
      buildMissionResult(missionId, { correct, total }, session!.difficulty),
    );
    router.push(`/unlock/${missionId}`);
  }

  return (
    <AppScreen
      title={mission.title}
      subtitle={`${BUILD_STEP[missionId]}에서 만들 예정입니다`}
      tone="calm"
    >
      <div className={styles.layout}>
        <section className={styles.briefing}>
          <p className={styles.briefingLabel}>이 미션에서 할 일</p>
          <p className={styles.briefingText}>{mission.briefing}</p>
        </section>

        <section className={styles.testPanel}>
          <p className={styles.testTitle}>
            ⚙️ 흐름 확인용 버튼 (학생에게는 안 보일 화면입니다)
          </p>
          <p className={styles.testHint}>
            아래 버튼을 누르면 점수를 임시로 넣고 통과 코드 화면으로 갑니다.
            로비로 돌아왔을 때 배지가 제대로 켜지는지 확인해보세요.
          </p>

          <div className={styles.testButtons}>
            <PrimaryButton onClick={() => finishWith(10, 10)}>
              통과한 셈 치기 (100%)
            </PrimaryButton>
            <PrimaryButton
              variant="secondary"
              onClick={() => finishWith(1, 10)}
            >
              못 넘긴 셈 치기 (10%)
            </PrimaryButton>
          </div>
        </section>

        <PrimaryButton variant="ghost" onClick={() => router.push("/lobby")}>
          ← 로비로 돌아가기
        </PrimaryButton>
      </div>
    </AppScreen>
  );
}
