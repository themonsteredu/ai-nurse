/**
 * 시작 화면이 들어올 자리 (아직 안 만들었습니다).
 *
 * 지금은 1단계(데이터 + 로직)만 끝난 상태라서,
 * 무엇이 준비됐고 다음에 무엇을 만드는지 보여주는 임시 화면입니다.
 * 2단계에서 진짜 시작 화면(이름 입력 + 난이도 선택)으로 바뀝니다.
 */

import { MISSION_LIST } from "@/data/missions";
import { PASS_THRESHOLD_PERCENT } from "@/data/rules";
import { DISCLAIMER_SHORT } from "@/data/disclaimer";
import { getTriagePatients } from "@/data/triage-patients";
import { getHealthRoomCases } from "@/data/health-room-cases";
import { targetBpmRange } from "@/lib/cpr";

export default function BuildProgressPage() {
  const bpm = targetBpmRange();

  return (
    <main
      style={{
        maxWidth: "var(--content-max-width)",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-5)",
      }}
    >
      <h1 style={{ fontSize: "var(--font-size-title)" }}>
        골든타임 — 만드는 중
      </h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        1단계(데이터 + 계산 로직)까지 끝났습니다. 화면은 2단계부터 만듭니다.
      </p>

      <h2 style={{ fontSize: "var(--font-size-heading)" }}>준비된 미션</h2>
      <ul style={{ fontSize: "var(--font-size-body-large)" }}>
        {MISSION_LIST.map((mission) => (
          <li key={mission.id}>
            <strong>{mission.title}</strong> — {mission.subtitle}
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: "var(--font-size-heading)" }}>확인용 숫자</h2>
      <ul style={{ fontSize: "var(--font-size-body-large)" }}>
        <li>
          가슴압박 기준: 분당 {bpm.min}~{bpm.max}회
        </li>
        <li>
          통과 기준: 초등 {PASS_THRESHOLD_PERCENT.elementary}% / 중등{" "}
          {PASS_THRESHOLD_PERCENT.middle}%
        </li>
        <li>
          환자 카드: 초등 {getTriagePatients("elementary").length}장 / 중등{" "}
          {getTriagePatients("middle").length}장
        </li>
        <li>보건실 상황: {getHealthRoomCases("elementary").length}개</li>
      </ul>

      <p
        style={{
          marginTop: "var(--space-6)",
          fontSize: "var(--font-size-caption)",
          color: "var(--color-text-muted)",
        }}
      >
        {DISCLAIMER_SHORT}
      </p>
    </main>
  );
}
