"use client";

/**
 * 시작 화면 — 학생이 앱을 열면 가장 먼저 보는 화면.
 *
 * 무엇을 하나:
 *  1. 이름을 입력받습니다 (수료증에 찍히는 용도)
 *  2. 난이도를 고릅니다 (초등 모드 / 중등 모드)
 *  3. 의료 면책 문구와 개인정보 안내를 보여줍니다
 *  4. "체험 시작"을 누르면 로비로 갑니다
 *
 * 어떤 데이터를 쓰나:
 *  - data/disclaimer.ts : 면책 문구, 개인정보 안내
 *  - data/rules.ts      : 이름 길이 제한, 통과 기준 퍼센트
 *  - lib/session.ts     : 이름 정리, 입력이 끝났는지 판단
 *
 * ⚠️ 정답이나 기준 숫자를 이 파일에 직접 쓰지 마세요. 위 파일에서 가져다 씁니다.
 *
 * 감정 톤: 차분하고 설레는 느낌. 병원 문 앞에 선 기분.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일의 생김새를 마음껏 바꿔도 됩니다.
 *    단, 면책 문구와 개인정보 안내는 반드시 화면에 남아 있어야 합니다.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DISCLAIMER_FULL,
  DISCLAIMER_SHORT,
  PRIVACY_NOTICE,
} from "@/data/disclaimer";
import { STUDENT_NAME_MAX_LENGTH } from "@/data/rules";
import type { Difficulty } from "@/data/types";
import { isNameReady } from "@/lib/session";
import { passThreshold } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useSession } from "./SessionProvider";
import styles from "./StartScreen.module.css";

/** 난이도 선택 버튼에 보여줄 설명. 기준 퍼센트는 lib 에서 가져옵니다. */
const DIFFICULTY_CHOICES: {
  value: Difficulty;
  label: string;
  description: string;
}[] = [
  {
    value: "elementary",
    label: "초등 모드",
    description: "초등 3~6학년",
  },
  {
    value: "middle",
    label: "중등 모드",
    description: "중학생 · 문제가 더 많고 어려워요",
  },
];

export function StartScreen() {
  const router = useRouter();
  const { startSession } = useSession();

  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  const canStart = isNameReady(name) && difficulty !== null;

  function handleStart() {
    if (!canStart || difficulty === null) return;
    startSession(name, difficulty);
    router.push("/lobby");
  }

  return (
    <AppScreen
      title="골든타임"
      subtitle="간호사가 되어 세 곳의 현장을 체험해요"
      tone="calm"
    >
      <div className={styles.start}>
        <section className={styles.cover} aria-labelledby="career-cover-title">
          <Image
            className={styles.coverImage}
            src="/assets/nurse/career-cover-v2.webp"
            alt="응급실 앞에서 환자 이송을 준비하는 간호사와 응급구조사"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 980px"
          />
          <div className={styles.coverRoles} aria-label="체험 직업군">
            <span>NURSE · 병원 간호</span>
            <span>PARAMEDIC · 119 현장</span>
          </div>
          <div className={styles.coverCopy}>
            <span>CAREER SIMULATION</span>
            <h2 id="career-cover-title">골든타임을 지키는 사람들</h2>
            <p>환자를 관찰하고, 판단하고, 가장 필요한 처치를 결정하세요.</p>
          </div>
        </section>

        <div className={styles.layout}>
        {/* 1. 이름 입력 */}
        <section className={styles.section}>
          <label className={styles.label} htmlFor="student-name">
            이름을 알려주세요
          </label>
          <input
            id="student-name"
            className={styles.nameInput}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={STUDENT_NAME_MAX_LENGTH}
            placeholder="이름"
            autoComplete="off"
            enterKeyHint="done"
          />
          <p className={styles.hint}>{PRIVACY_NOTICE}</p>
        </section>

        {/* 2. 난이도 선택 */}
        <section className={styles.section}>
          <p className={styles.label}>어떤 모드로 할까요?</p>
          <div className={styles.difficultyGrid}>
            {DIFFICULTY_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className={styles.difficultyCard}
                data-selected={difficulty === choice.value}
                aria-pressed={difficulty === choice.value}
                onClick={() => setDifficulty(choice.value)}
              >
                <span className={styles.difficultyLabel}>{choice.label}</span>
                <span className={styles.difficultyDescription}>
                  {choice.description}
                </span>
                <span className={styles.difficultyThreshold}>
                  통과 기준 {passThreshold(choice.value)}%
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. 면책 문구 */}
        <section className={styles.disclaimer}>
          <p className={styles.disclaimerShort}>{DISCLAIMER_SHORT}</p>

          <button
            type="button"
            className={styles.disclaimerToggle}
            onClick={() => setShowFullDisclaimer((current) => !current)}
            aria-expanded={showFullDisclaimer}
          >
            {showFullDisclaimer ? "접기" : "자세히 보기"}
          </button>

          {showFullDisclaimer ? (
            <ul className={styles.disclaimerList}>
              {DISCLAIMER_FULL.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* 4. 시작 버튼 */}
        <PrimaryButton fullWidth disabled={!canStart} onClick={handleStart}>
          체험 시작하기
        </PrimaryButton>

        {!canStart ? (
          <p className={styles.hint}>
            이름을 쓰고 모드를 고르면 시작할 수 있어요.
          </p>
        ) : null}
        </div>
      </div>
    </AppScreen>
  );
}
