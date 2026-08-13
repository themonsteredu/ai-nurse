"use client";

/**
 * 📌 임시 화면입니다. 6단계에서 진짜 최종 리포트로 교체됩니다.
 *
 * 6단계에서 만들 것:
 *   배지 3개, 총점, 나의 간호 유형, 진로 정보,
 *   이름과 날짜가 들어간 수료증
 *
 * 지금은 점수와 유형 계산이 제대로 도는지 확인할 수 있을 정도만
 * 보여줍니다. 생김새는 6단계에서 제대로 만듭니다.
 */

import { useRouter } from "next/navigation";

import { MISSIONS } from "@/data/missions";
import { earnedBadgeCount, TOTAL_BADGE_COUNT } from "@/lib/badges";
import { decideNurseType } from "@/lib/nurse-type";
import { overallAccuracyPercent } from "@/lib/scoring";
import { resultList } from "@/lib/session";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./ReportPlaceholder.module.css";

export function ReportPlaceholder() {
  const router = useRouter();
  const session = useRequireSession();
  const { resetSession } = useSession();

  if (session === null) return null;

  const results = resultList(session);
  const nurseType = decideNurseType(results);

  function handleRestart() {
    resetSession();
    router.push("/");
  }

  return (
    <AppScreen
      title="체험을 모두 마쳤어요"
      subtitle="6단계에서 수료증 모양으로 예쁘게 만들 예정입니다"
      tone="celebrate"
    >
      <div className={styles.layout}>
        <section className={styles.summary}>
          <p className={styles.name}>{session.studentName} 간호사</p>
          <p className={styles.score}>
            총점 {overallAccuracyPercent(results)}점 · 배지{" "}
            {earnedBadgeCount(results)} / {TOTAL_BADGE_COUNT}개
          </p>
        </section>

        <section className={styles.typeCard}>
          <p className={styles.typeLabel}>나의 간호 유형</p>
          <p className={styles.typeTitle}>{nurseType.title}</p>
          <p className={styles.typeTagline}>{nurseType.tagline}</p>
          <p className={styles.typeDescription}>{nurseType.description}</p>
          <p className={styles.typeCareers}>
            어울리는 직업: {nurseType.careers.join(" · ")}
          </p>
        </section>

        <section className={styles.missionScores}>
          <p className={styles.sectionLabel}>미션별 점수</p>
          <ul className={styles.missionList}>
            {results.map((result) => (
              <li key={result.missionId} className={styles.missionRow}>
                <span>{MISSIONS[result.missionId].title}</span>
                <span>
                  {result.accuracyPercent}% {result.passed ? "★" : "☆"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <PrimaryButton variant="secondary" onClick={handleRestart}>
          처음부터 다시 하기
        </PrimaryButton>
      </div>
    </AppScreen>
  );
}
