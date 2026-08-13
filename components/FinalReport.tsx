"use client";

/**
 * 최종 리포트 — 세 미션을 모두 통과한 학생이 마지막에 보는 화면.
 *
 * 무엇을 보여주나 (기획서 6번 구성 그대로):
 *   1. 수료증 (이름·날짜·배지 3개) — 인쇄 가능
 *   2. 미션별 점수 그래프
 *   3. 나의 간호 유형
 *   4. 실제 진로 정보 (간호사 되는 길, 전문간호사 13개 분야, 간호사 외 진로)
 *   5. 의료 면책 문구
 *
 * 들어오는 조건:
 *   배지 3개를 다 모아야 열립니다. (기획서 명시)
 *   아직 못 모았는데 주소로 들어오면 로비로 되돌립니다.
 *
 * 어떤 데이터를 쓰나:
 *   - data/nurse-types.ts : 간호 유형 3가지, 진로 정보
 *   - data/disclaimer.ts  : 면책 문구
 *   - lib/nurse-type.ts   : 어떤 유형인지 판정
 *   - lib/badges.ts       : 배지 상태
 *   - lib/timer.ts        : 수료증에 찍을 날짜 만들기
 *
 * ⚠️ 이 파일에는 정답도, 기준 숫자도 없습니다. 전부 위에서 가져다 씁니다.
 *
 * 감정 톤: 축하하고 뿌듯한 분위기. 오늘 한 일을 진로로 이어주는 마무리.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    ⚠️ 다만 면책 문구는 반드시 화면에 남겨주세요. (기획서 필수 요구사항)
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DISCLAIMER_FULL } from "@/data/disclaimer";
import {
  ADVANCED_NURSE_FIELDS,
  CAREER_CLOSING_NOTE,
  NURSE_CAREER_PATH,
  RELATED_CAREERS,
} from "@/data/nurse-types";
import { badgeStatuses } from "@/lib/badges";
import { decideNurseType } from "@/lib/nurse-type";
import { overallAccuracyPercent } from "@/lib/scoring";
import { canOpenReport, resultList } from "@/lib/session";
import { formatCertificateDate } from "@/lib/timer";

import { AppScreen } from "./AppScreen";
import { Certificate } from "./Certificate";
import { MissionScoreChart } from "./MissionScoreChart";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./FinalReport.module.css";

export function FinalReport() {
  const router = useRouter();
  const session = useRequireSession();
  const { resetSession } = useSession();

  /**
   * 오늘 날짜.
   * 서버에서 미리 만들어둔 화면과 어긋나지 않게, 화면이 열린 뒤에 채웁니다.
   */
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(formatCertificateDate(new Date()));
  }, []);

  // 배지를 다 못 모았는데 주소로 들어온 경우 로비로 되돌립니다.
  const reportReady = session !== null && canOpenReport(session);
  useEffect(() => {
    if (session !== null && !reportReady) router.replace("/lobby");
  }, [session, reportReady, router]);

  if (session === null || !reportReady) return null;

  const results = resultList(session);
  const nurseType = decideNurseType(results);
  const badges = badgeStatuses(results);
  const totalPercent = overallAccuracyPercent(results);

  function handleRestart() {
    resetSession();
    router.push("/");
  }

  return (
    <AppScreen
      title="오늘의 간호사 리포트"
      subtitle={`${session.studentName} 간호사님, 세 곳 모두 잘 해냈어요`}
      tone="celebrate"
    >
      <div className={styles.report}>
        {/* 1. 수료증 — 인쇄하면 이 부분만 나옵니다 */}
        <Certificate
          studentName={session.studentName}
          dateLabel={dateLabel}
          badges={badges}
          nurseTypeTitle={nurseType?.title ?? ""}
          totalPercent={totalPercent}
        />

        {/* 인쇄 버튼 — 인쇄물에는 안 나옵니다 */}
        <div className={`no-print ${styles.actions}`}>
          <PrimaryButton onClick={() => window.print()}>
            수료증 인쇄하기
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={handleRestart}>
            처음부터 다시 하기
          </PrimaryButton>
        </div>

        {/* 2. 미션별 점수 그래프 */}
        <section className={`no-print ${styles.section}`}>
          <h2 className={styles.sectionTitle}>미션별 점수</h2>
          <MissionScoreChart results={results} />
        </section>

        {/* 3. 나의 간호 유형 */}
        {nurseType ? (
          <section className={`no-print ${styles.typeSection}`}>
            <p className={styles.typeLabel}>나의 간호 유형</p>
            <h2 className={styles.typeTitle}>{nurseType.title}</h2>
            <p className={styles.typeTagline}>{nurseType.tagline}</p>
            <p className={styles.typeDescription}>{nurseType.description}</p>

            <ul className={styles.strengthList}>
              {nurseType.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>

            <div className={styles.careerBox}>
              <p className={styles.careerBoxLabel}>어울리는 직업</p>
              <ul className={styles.careerChips}>
                {nurseType.careers.map((career) => (
                  <li key={career} className={styles.chip}>
                    {career}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* 4. 실제 진로 정보 */}
        <section className={`no-print ${styles.section}`}>
          <h2 className={styles.sectionTitle}>간호사가 되는 길</h2>
          <ol className={styles.pathList}>
            {NURSE_CAREER_PATH.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h3 className={styles.subTitle}>
            전문간호사 {ADVANCED_NURSE_FIELDS.length}개 분야
          </h3>
          <ul className={styles.fieldChips}>
            {ADVANCED_NURSE_FIELDS.map((field) => (
              <li key={field} className={styles.chip}>
                {field}
              </li>
            ))}
          </ul>

          <h3 className={styles.subTitle}>간호사 말고도 갈 수 있는 길</h3>
          <ul className={styles.fieldChips}>
            {RELATED_CAREERS.map((career) => (
              <li key={career} className={styles.chip}>
                {career}
              </li>
            ))}
          </ul>

          <p className={styles.closingNote}>{CAREER_CLOSING_NOTE}</p>
        </section>

        {/* 5. 의료 면책 문구 (기획서 필수) */}
        <section className={`no-print ${styles.disclaimer}`}>
          <h2 className={styles.disclaimerTitle}>알아두세요</h2>
          <ul className={styles.disclaimerList}>
            {DISCLAIMER_FULL.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </AppScreen>
  );
}
