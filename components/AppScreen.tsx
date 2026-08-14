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

import { useEffect, type ReactNode } from "react";

import { useSession } from "./SessionProvider";
import { playUiSound } from "./ui-sound";
import styles from "./AppScreen.module.css";

/**
 * 화면의 감정 톤.
 *  calm       — 차분함 (시작 화면, 통과 코드 화면)
 *  urgent     — 긴박함 (응급실)
 *  focused    — 집중 (119 구급차)
 *  warm       — 따뜻함 (보건실)
 *  celebrate  — 축하 (최종 리포트)
 */
export type ScreenTone =
  | "calm"
  | "urgent"
  | "focused"
  | "warm"
  | "surgical"
  | "critical"
  | "medication"
  | "celebrate";

const TONE_LABEL: Record<ScreenTone, string> = {
  calm: "GOLDEN TIME · NURSE MISSION",
  urgent: "MISSION 01 · EMERGENCY",
  focused: "MISSION 02 · AMBULANCE",
  warm: "MISSION 03 · WARD",
  surgical: "MISSION 04 · OPERATING ROOM",
  critical: "MISSION 05 · INTENSIVE CARE",
  medication: "MISSION 06 · MEDICATION SAFETY",
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

  useEffect(() => {
    if (!soundEnabled) return;

    const playInteractionSound = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("button:not(:disabled), a[href]")) playUiSound("tap");
    };

    document.addEventListener("pointerdown", playInteractionSound);
    return () => document.removeEventListener("pointerdown", playInteractionSound);
  }, [soundEnabled]);

  function handleSoundToggle() {
    if (!soundEnabled) playUiSound("enabled");
    toggleSound();
  }

  return (
    <div className={styles.screen} data-tone={tone}>
      <header className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">GT</div>

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
          onClick={handleSoundToggle}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "소리 끄기" : "소리 켜기"}
        >
          <span className={styles.soundSignal} data-active={soundEnabled} aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className={styles.soundCopy}>
            <small>SOUND</small>
            <strong>{soundEnabled ? "ON" : "OFF"}</strong>
          </span>
        </button>
      </header>

      <main className={styles.body}>{children}</main>

      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </div>
  );
}
