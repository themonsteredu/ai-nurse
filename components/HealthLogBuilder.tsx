"use client";

/**
 * 보건일지 문장 조립 — 중등 모드에서만 나오는 추가 과제.
 *
 * 무엇을 하나:
 *   드롭다운 다섯 칸을 골라 한 문장짜리 보건일지를 완성합니다.
 *     [3학년 2반 김OO]이 [쉬는 시간]에 [코피]로 내원, [지혈 처치] 후 [10분 뒤 멈춤]
 *
 * 왜 있나:
 *   간호사가 하는 일 중 "기록"이 얼마나 중요한지 알려주는 과제입니다.
 *   애매하게 쓴 기록은 나중에 아무 쓸모가 없다는 걸 직접 겪게 합니다.
 *
 * 왜 드롭다운인가:
 *   기획서에 드롭다운으로 지정되어 있고, 태블릿에서 기기 자체 선택창이
 *   떠서 초등·중등 학생 모두 다루기 쉽습니다.
 *
 * ⚠️ 정답은 이 파일이 모릅니다. data/health-log.ts 에 있고,
 *    채점은 lib/health-room.ts 가 합니다.
 *
 * 감정 톤: 차분하게 마무리하는 느낌.
 *
 * ✅ 코덱스(디자인 담당 AI)는 이 파일을 마음껏 바꿔도 됩니다.
 */

import {
  HEALTH_LOG_SITUATION,
  HEALTH_LOG_SLOT_LIST,
} from "@/data/health-log";
import {
  buildLogSentence,
  isCorrectLogOption,
  type HealthLogAnswers,
} from "@/lib/health-room";

import { PrimaryButton } from "./PrimaryButton";
import styles from "./HealthLogBuilder.module.css";

type HealthLogBuilderProps = {
  answers: HealthLogAnswers;
  /** 답을 확인한 뒤인지 */
  submitted: boolean;
  onPick: (slotId: string, optionId: string) => void;
  onSubmit: () => void;
  onNext: () => void;
};

export function HealthLogBuilder({
  answers,
  submitted,
  onPick,
  onSubmit,
  onNext,
}: HealthLogBuilderProps) {
  const allChosen = HEALTH_LOG_SLOT_LIST.every((slot) => answers[slot.id]);

  return (
    <div className={styles.builder}>
      <p className={styles.situation}>{HEALTH_LOG_SITUATION}</p>

      {/* 완성되어 가는 문장 미리보기 */}
      <div className={styles.preview}>
        <p className={styles.previewLabel}>완성된 보건일지</p>
        <p className={styles.previewSentence}>{buildLogSentence(answers)}</p>
      </div>

      {/* 다섯 칸 드롭다운 */}
      <ol className={styles.slotList}>
        {HEALTH_LOG_SLOT_LIST.map((slot) => {
          const chosen = answers[slot.id];
          const correct = chosen ? isCorrectLogOption(slot.id, chosen) : false;

          return (
            <li key={slot.id} className={styles.slot}>
              <label className={styles.slotLabel} htmlFor={slot.id}>
                {slot.question}
              </label>

              <select
                id={slot.id}
                className={styles.select}
                data-state={
                  !submitted ? "open" : correct ? "correct" : "wrong"
                }
                value={chosen ?? ""}
                disabled={submitted}
                onChange={(event) => onPick(slot.id, event.target.value)}
              >
                <option value="" disabled>
                  골라주세요
                </option>
                {slot.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              {submitted ? (
                <p className={styles.explanation} data-correct={correct}>
                  {correct ? "⭕ " : "❌ "}
                  {slot.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {submitted ? (
        <PrimaryButton fullWidth onClick={onNext}>
          미션 결과 보기
        </PrimaryButton>
      ) : (
        <PrimaryButton fullWidth disabled={!allChosen} onClick={onSubmit}>
          {allChosen ? "보건일지 제출하기" : "다섯 칸을 모두 골라주세요"}
        </PrimaryButton>
      )}
    </div>
  );
}
