"use client";

/**
 * 모든 화면을 감싸는 공통 틀.
 *
 * 무엇을 보여주나:
 *  - 화면 위쪽 띠 (제목, 소리 켜기/끄기 버튼)
 *  - 가운데 본문 (각 화면이 넣는 내용)
 *
 * 어떤 데이터를 받나:
 *  - title: 화면 위에 크게 보일 제목
 *  - subtitle: 제목 아래 한 줄 설명 (없어도 됨)
 *  - tone: 화면 분위기. 코덱스가 배경색·느낌을 다르게 줄 때 씁니다.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import type { ReactNode } from "react";

import { useSession } from "./SessionProvider";
import styles from "./AppScreen.module.css";

/**
 * 화면의 감정 톤.
 *  calm       — 차분함 (시작 화면, 통과 코드 화면)
 *  urgent     — 긴박함 (응급실)
 *  focused    — 집중 (119 구급차)
 *  warm       — 따뜻함 (보건실)
 *  celebrate  — 축하 (최종 리포트)
 */
export type ScreenTone = "calm" | "urgent" | "focused" | "warm" | "celebrate";

const TONE_LABEL: Record<ScreenTone, string> = {
  calm: "GOLDEN TIME",
  urgent: "MISSION 01 · 응급 판단",
  focused: "MISSION 02 · 현장 출동",
  warm: "MISSION 03 · 돌봄 실습",
  celebrate: "MISSION COMPLETE",
};

type AppScreenProps = {
  title: string;
  subtitle?: string;
  tone?: ScreenTone;
  /** 화면 아래쪽에 고정으로 붙일 내용 (예: 다음 버튼) */
  footer?: ReactNode;
  children: ReactNode;
};

export function AppScreen({
  title,
  subtitle,
  tone = "calm",
  footer,
  children,
}: AppScreenProps) {
  const { soundEnabled, toggleSound } = useSession();

  return (
    <div className={styles.screen} data-tone={tone}>
      <header className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">
          <span className={styles.brandPulse}>+</span>
        </div>

        <div className={styles.headerText}>
          <span className={styles.eyebrow}>{TONE_LABEL[tone]}</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.liveDot} aria-hidden="true" />
          </div>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        <button
          type="button"
          className={styles.soundButton}
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "소리 끄기" : "소리 켜기"}
        >
          <span className={styles.soundIcon} aria-hidden="true">
            {soundEnabled ? "🔊" : "🔇"}
          </span>
          <span>{soundEnabled ? "소리 켜짐" : "소리 꺼짐"}</span>
        </button>
      </header>

      <main className={styles.body}>{children}</main>

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  );
}
