"use client";

/**
 * 통과 코드 화면 — 미션이 끝나면 여기서 대기합니다.
 *
 * 무엇을 하나:
 *  1. 방금 끝낸 미션의 점수와 배지 획득 여부를 보여줍니다
 *  2. 강사가 알려준 네 자리를 입력받습니다
 *  3. 맞으면 로비로 돌아갑니다. 틀리면 다시 입력받습니다
 *
 * 왜 있나: 반 전체의 진도를 맞추기 위한 장치입니다.
 *        먼저 끝낸 학생이 혼자 앞서가지 않도록 여기서 기다립니다.
 *
 * 어떤 데이터를 쓰나:
 *  - lib/unlock.ts  : 코드가 맞는지 확인 (정답 코드는 data/rules.ts 에 있음)
 *  - lib/session.ts : 방금 끝낸 미션의 성적
 *  - data/missions.ts : 미션 이름, 배지 이름
 *
 * ⚠️ 통과 코드(1004 등)를 이 파일에 직접 쓰면 안 됩니다.
 *    반드시 isValidUnlockCode() 를 불러서 확인합니다.
 *
 * 감정 톤: 차분하게 숨 고르는 시간. 다음 현장으로 가기 전 대기실.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일의 생김새를 마음껏 바꿔도 됩니다.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MISSIONS } from "@/data/missions";
import type { MissionId } from "@/data/types";
import { CODE_LENGTH, isCodeComplete, isValidUnlockCode, normalizeUnlockCode } from "@/lib/unlock";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import styles from "./UnlockCodeScreen.module.css";

export function UnlockCodeScreen({ missionId }: { missionId: MissionId }) {
  const router = useRouter();
  const session = useRequireSession();
  const { unlockMission } = useSession();

  const [code, setCode] = useState("");
  const [showError, setShowError] = useState(false);

  if (session === null) return null;

  const mission = MISSIONS[missionId];
  const result = session.results[missionId];

  function handleSubmit() {
    if (isValidUnlockCode(missionId, code)) {
      unlockMission(missionId);
      router.push("/lobby");
    } else {
      setShowError(true);
    }
  }

  function handleChange(value: string) {
    setCode(normalizeUnlockCode(value));
    setShowError(false);
  }

  return (
    <AppScreen
      title={`${mission.title} 체험 완료`}
      subtitle="선생님이 알려주는 네 자리 숫자를 넣어주세요"
      tone="calm"
    >
      <div className={styles.layout}>
        {/* 방금 끝낸 미션의 성적 */}
        {result ? (
          <section className={styles.resultCard} data-passed={result.passed}>
            <p className={styles.resultScore}>
              정확도 {result.accuracyPercent}%
              <span className={styles.resultDetail}>
                {" "}
                ({result.tally.correct} / {result.tally.total})
              </span>
            </p>
            <p className={styles.resultBadge}>
              {result.passed
                ? `★ ${mission.badgeName}를 받았어요!`
                : `아쉬워요. ${mission.badgeName}는 못 받았어요.`}
            </p>
          </section>
        ) : null}

        {/* 통과 코드 입력 */}
        <section className={styles.codeSection}>
          <label className={styles.label} htmlFor="unlock-code">
            통과 코드 {CODE_LENGTH}자리
          </label>

          <input
            id="unlock-code"
            className={styles.codeInput}
            data-error={showError}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
            placeholder={"•".repeat(CODE_LENGTH)}
            aria-invalid={showError}
            aria-describedby={showError ? "unlock-error" : undefined}
          />

          {showError ? (
            <p id="unlock-error" className={styles.error} role="alert">
              코드가 맞지 않아요. 선생님께 다시 여쭤보세요.
            </p>
          ) : (
            <p className={styles.hint}>
              모든 친구가 끝날 때까지 잠시 기다려요.
            </p>
          )}

          <PrimaryButton
            fullWidth
            disabled={!isCodeComplete(code)}
            onClick={handleSubmit}
          >
            로비로 돌아가기
          </PrimaryButton>
        </section>
      </div>
    </AppScreen>
  );
}
