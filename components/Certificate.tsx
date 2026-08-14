"use client";

/**
 * 수료증 — 최종 리포트 맨 위에 나오는, 이름과 날짜가 들어간 증서.
 *
 * 무엇을 보여주나:
 *   학생 이름, 체험 날짜, 받은 배지, 나의 간호 유형, 총점.
 *
 * 인쇄에 대하여:
 *   기획서에 "캡처하거나 인쇄해서 학교에 제출"이라고 되어 있습니다.
 *   그래서 이 부분에 print-area 라는 이름표를 붙여두었고,
 *   인쇄 버튼을 누르면 화면의 나머지는 빼고 이 증서만 종이에 나옵니다.
 *   (인쇄 규칙은 app/globals.css 맨 아래에 있습니다)
 *
 * ⚠️ print-area 라는 이름표(className)를 지우면 인쇄가 깨집니다.
 *
 * 어떤 데이터를 받나:
 *   - studentName  : 시작 화면에서 입력한 이름 (어디에도 저장되지 않습니다)
 *   - dateLabel    : "2026년 8월 13일" 형태의 날짜
 *   - badges       : 전체 배지의 획득 여부
 *   - nurseTypeTitle : 나의 간호 유형 이름
 *   - totalPercent : 전체 정확도
 *
 * 감정 톤: 축하. 오늘 하루를 기념하는 느낌.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 *    수료증답게 더 근사하게 만들어도 좋습니다.
 */

import { DISCLAIMER_SHORT } from "@/data/disclaimer";
import type { BadgeStatus } from "@/lib/badges";

import styles from "./Certificate.module.css";

type CertificateProps = {
  studentName: string;
  dateLabel: string;
  badges: BadgeStatus[];
  nurseTypeTitle: string;
  totalPercent: number;
};

export function Certificate({
  studentName,
  dateLabel,
  badges,
  nurseTypeTitle,
  totalPercent,
}: CertificateProps) {
  return (
    // ⚠️ print-area 는 인쇄할 때 이 부분만 남기기 위한 이름표입니다. 지우지 마세요.
    <section className={`print-area ${styles.certificate}`}>
      <p className={styles.appName}>골든타임 · 간호사 진로체험</p>
      <h2 className={styles.title}>체험 수료증</h2>

      <p className={styles.name}>{studentName}</p>
      <p className={styles.role}>간호사</p>

      <p className={styles.body}>
        위 학생은 응급실부터 수술실·중환자실·투약실까지 여섯 간호 현장을 모두 체험하고
        <br />
        아래 배지를 받았기에 이 수료증을 드립니다.
      </p>

      <ul className={styles.badgeList}>
        {badges.map((badge) => (
          <li key={badge.missionId} className={styles.badge} data-earned={badge.earned}>
            <span className={styles.badgeIcon} aria-hidden="true">
              {badge.earned ? "★" : "☆"}
            </span>
            <span className={styles.badgeName}>{badge.name}</span>
          </li>
        ))}
      </ul>

      <dl className={styles.summary}>
        <div className={styles.summaryItem}>
          <dt>나의 간호 유형</dt>
          <dd>{nurseTypeTitle}</dd>
        </div>
        <div className={styles.summaryItem}>
          <dt>전체 정확도</dt>
          <dd>{totalPercent}%</dd>
        </div>
      </dl>

      <p className={styles.date}>{dateLabel}</p>
      <p className={styles.issuer}>모아킷 진로체험 프로그램</p>

      <p className={styles.disclaimer}>{DISCLAIMER_SHORT}</p>
    </section>
  );
}
