/**
 * 데이터와 계산 로직이 서로 어긋나지 않는지 확인하는 점검 스크립트.
 *
 * 터미널에서 `npm run test:data` 라고 치면 돌아갑니다.
 * 문제가 있으면 무엇이 잘못됐는지 한국어로 알려줍니다.
 *
 * 선생님이 data/ 폴더의 환자 카드나 정답을 고친 뒤에 이걸 한 번 돌려보면,
 * 실수로 정답을 빠뜨렸는지 같은 걸 바로 잡아낼 수 있습니다.
 */

import { AED_PAD_SPOTS, CORRECT_AED_PAD_SPOTS } from "../data/aed-pads";
import { DISPATCH_STEPS, getDispatchSteps } from "../data/dispatch-steps";
import { HEALTH_LOG_SLOT_LIST } from "../data/health-log";
import {
  getHealthRoomCases,
  HEALTH_ROOM_CASES,
} from "../data/health-room-cases";
import { MISSION_LIST } from "../data/missions";
import { MISSION_TO_NURSE_TYPE, NURSE_TYPES } from "../data/nurse-types";
import {
  CPR_BPM_MAX,
  CPR_BPM_MIN,
  CPR_DURATION_SECONDS,
  PASS_THRESHOLD_PERCENT,
  TRIAGE_TIME_LIMIT_SECONDS,
  UNLOCK_CODES,
} from "../data/rules";
import { getTriagePatients, TRIAGE_PATIENTS } from "../data/triage-patients";
import { getTriageZones } from "../data/triage-zones";
import type { Difficulty } from "../data/types";
import {
  bpmFromIntervalMs,
  compressionDurationMs,
  guideCircleScale,
  isGoodRhythm,
  isGuideVisible,
  scoreCompressions,
} from "../lib/cpr";
import { scoreHealthRoomCases, scoreHealthLog } from "../lib/health-room";
import { decideNurseTypeId } from "../lib/nurse-type";
import { accuracyPercent, buildMissionResult, isPassing } from "../lib/scoring";
import { canOpenReport, createSession, markMissionUnlocked, recordMissionResult } from "../lib/session";
import { isValidUnlockCode, normalizeUnlockCode } from "../lib/unlock";

const problems: string[] = [];
const notes: string[] = [];

function check(condition: boolean, message: string) {
  if (!condition) problems.push(message);
}

const DIFFICULTIES: Difficulty[] = ["elementary", "middle"];

/* ------------------- 1. 환자 카드 / 구역 (미션 1) ------------------- */

// 기획서: 초등 구역 4개·환자 6명 / 중등 구역 5개·환자 10명
const EXPECTED_ZONES: Record<Difficulty, number> = { elementary: 4, middle: 5 };
const EXPECTED_PATIENTS: Record<Difficulty, number> = {
  elementary: 6,
  middle: 10,
};

const patientIds = new Set<string>();
for (const patient of TRIAGE_PATIENTS) {
  check(!patientIds.has(patient.id), `환자 카드 id가 중복됩니다: ${patient.id}`);
  patientIds.add(patient.id);
  check(
    patient.explanation.trim().length > 0,
    `환자 "${patient.name}"에 오답 해설이 비어 있습니다.`,
  );
  check(
    patient.levels.length > 0,
    `환자 "${patient.name}"이 어느 난이도에도 안 나옵니다.`,
  );
}

for (const difficulty of DIFFICULTIES) {
  const zones = getTriageZones(difficulty);
  const patients = getTriagePatients(difficulty);

  check(
    zones.length === EXPECTED_ZONES[difficulty],
    `${difficulty} 모드 구역이 ${zones.length}개입니다. 기획서 기준은 ${EXPECTED_ZONES[difficulty]}개입니다.`,
  );
  check(
    patients.length === EXPECTED_PATIENTS[difficulty],
    `${difficulty} 모드 환자가 ${patients.length}명입니다. 기획서 기준은 ${EXPECTED_PATIENTS[difficulty]}명입니다.`,
  );

  // 그 난이도에 없는 구역이 정답인 환자가 있으면 학생이 절대 못 맞힙니다
  const zoneLevels = new Set(zones.map((zone) => zone.level));
  for (const patient of patients) {
    check(
      zoneLevels.has(patient.correctZone),
      `${difficulty} 모드에 "${patient.correctZone}" 구역이 없는데 환자 "${patient.name}"의 정답이 그 구역입니다.`,
    );
  }

  // 안 쓰이는 빈 구역이 있으면 알려줍니다
  const usedZones = new Set(patients.map((p) => p.correctZone));
  const emptyZones = zones.filter((z) => !usedZones.has(z.level));
  check(
    emptyZones.length === 0,
    `${difficulty} 모드에서 정답 환자가 하나도 없는 구역: ${emptyZones.map((z) => z.label).join(", ")}`,
  );

  const limit = TRIAGE_TIME_LIMIT_SECONDS[difficulty];
  notes.push(
    `미션1 ${difficulty}: 구역 ${zones.length}개 · 환자 ${patients.length}명 · 제한시간 ${limit === null ? "없음" : `${limit}초`} · 통과 ${PASS_THRESHOLD_PERCENT[difficulty]}%`,
  );
}

/* ------------------------ 2. 신고 순서 (미션 2) ---------------------- */

for (const difficulty of DIFFICULTIES) {
  const steps = getDispatchSteps(difficulty);
  check(steps.length === 5, `${difficulty} 모드 신고 순서 카드가 ${steps.length}장입니다. 기획서 기준은 5장입니다.`);
  const orders = steps.map((s) => s.correctOrder);
  check(
    new Set(orders).size === orders.length,
    `${difficulty} 모드 신고 순서에 같은 번호가 두 번 나옵니다: ${orders.join(", ")}`,
  );
  check(
    orders.join(",") === [1, 2, 3, 4, 5].join(","),
    `${difficulty} 모드 신고 순서 번호가 1~5로 이어지지 않습니다: ${orders.join(", ")}`,
  );
}
check(
  new Set(DISPATCH_STEPS.map((s) => s.id)).size === DISPATCH_STEPS.length,
  "신고 순서 카드 id가 중복됩니다.",
);

/* ---------------------------- 3. AED ------------------------------- */

check(
  CORRECT_AED_PAD_SPOTS.length === 2,
  `AED 정답 자리는 2곳이어야 하는데 ${CORRECT_AED_PAD_SPOTS.length}곳입니다.`,
);
for (const spot of AED_PAD_SPOTS) {
  check(
    spot.x >= 0 && spot.x <= 100 && spot.y >= 0 && spot.y <= 100,
    `AED 자리 "${spot.label}"의 좌표가 0~100 범위를 벗어났습니다.`,
  );
  check(
    spot.explanation.trim().length > 0,
    `AED 자리 "${spot.label}"에 설명이 비어 있습니다.`,
  );
}

/* ------------------------- 4. 보건실 (미션 3) ----------------------- */

check(
  HEALTH_ROOM_CASES.length === 5,
  `보건실 상황이 ${HEALTH_ROOM_CASES.length}개입니다. 기획서 기준은 5개입니다.`,
);

for (const item of HEALTH_ROOM_CASES) {
  const correctTreatments = item.treatmentChoices.filter((c) => c.isCorrect);
  check(
    correctTreatments.length === 1,
    `보건실 "${item.title}"의 처치 정답이 ${correctTreatments.length}개입니다. 정확히 1개여야 합니다.`,
  );
  check(
    item.treatmentChoices.length === 4,
    `보건실 "${item.title}"의 처치 선택지가 ${item.treatmentChoices.length}개입니다. 기획서 기준은 4개입니다.`,
  );

  const correctFollowUps = item.followUpChoices.filter((c) => c.isCorrect);
  check(
    correctFollowUps.length === 1,
    `보건실 "${item.title}"의 다음 조치 정답이 ${correctFollowUps.length}개입니다. 정확히 1개여야 합니다.`,
  );
  check(
    item.followUpChoices.length === 4,
    `보건실 "${item.title}"의 다음 조치 선택지가 ${item.followUpChoices.length}개입니다. 4개여야 합니다.`,
  );

  for (const choice of [...item.treatmentChoices, ...item.followUpChoices]) {
    check(
      choice.explanation.trim().length > 0,
      `보건실 "${item.title}"의 선택지 "${choice.label}"에 설명이 없습니다.`,
    );
  }
}

// 보건실 만점이 실제로 100%가 나오는지
const perfectTreatments: Record<string, string> = {};
const perfectFollowUps: Record<string, string> = {};
for (const item of HEALTH_ROOM_CASES) {
  perfectTreatments[item.id] = item.treatmentChoices.find((c) => c.isCorrect)!.id;
  perfectFollowUps[item.id] = item.followUpChoices.find((c) => c.isCorrect)!.id;
}
const healthPerfect = scoreHealthRoomCases(
  perfectTreatments,
  perfectFollowUps,
  getHealthRoomCases("elementary"),
);
check(
  accuracyPercent(healthPerfect) === 100,
  `보건실을 다 맞혔는데 만점이 아닙니다: ${healthPerfect.correct}/${healthPerfect.total}`,
);
check(
  healthPerfect.total === 10,
  `보건실 만점이 ${healthPerfect.total}점입니다. 상황 5개 × 2단계 = 10점이어야 합니다.`,
);
notes.push(`미션3: 상황 ${HEALTH_ROOM_CASES.length}개 × 2단계 = ${healthPerfect.total}점`);

/* --------------------- 5. 보건일지 (중등 전용) ---------------------- */

check(
  HEALTH_LOG_SLOT_LIST.length === 5,
  `보건일지 칸이 ${HEALTH_LOG_SLOT_LIST.length}개입니다. 기획서 문장 틀은 5칸입니다.`,
);
for (const slot of HEALTH_LOG_SLOT_LIST) {
  const correct = slot.options.filter((o) => o.isCorrect);
  check(
    correct.length === 1,
    `보건일지 칸 "${slot.question}"의 정답이 ${correct.length}개입니다.`,
  );
}
const perfectLog: Record<string, string> = {};
for (const slot of HEALTH_LOG_SLOT_LIST) {
  perfectLog[slot.id] = slot.options.find((o) => o.isCorrect)!.id;
}
check(
  accuracyPercent(scoreHealthLog(perfectLog)) === 100,
  "보건일지를 다 맞혔는데 만점이 아닙니다.",
);

/* -------------------------- 6. 통과 코드 --------------------------- */

for (const mission of MISSION_LIST) {
  const code = UNLOCK_CODES[mission.id];
  check(/^\d{4}$/.test(code), `${mission.title}의 통과 코드가 네 자리 숫자가 아닙니다: ${code}`);
  check(isValidUnlockCode(mission.id, code), `${mission.title}의 통과 코드 확인이 실패했습니다.`);
  check(
    !isValidUnlockCode(mission.id, "0000") || code === "0000",
    `${mission.title}에서 아무 코드나 통과됩니다.`,
  );
}
check(
  normalizeUnlockCode("1-0-0-4") === "1004",
  "통과 코드 입력에서 숫자만 걸러내는 기능이 동작하지 않습니다.",
);
check(
  new Set(Object.values(UNLOCK_CODES)).size === MISSION_LIST.length,
  "통과 코드 중에 겹치는 게 있습니다. 미션마다 달라야 합니다.",
);

/* ---------------------------- 7. CPR ------------------------------- */

check(
  isGoodRhythm(CPR_BPM_MIN) && isGoodRhythm(CPR_BPM_MAX),
  "CPR 기준값 100과 120이 '알맞음'으로 판정되지 않습니다.",
);
check(
  !isGoodRhythm(CPR_BPM_MIN - 1) && !isGoodRhythm(CPR_BPM_MAX + 1),
  "CPR 기준 범위 밖의 값이 '알맞음'으로 판정됩니다.",
);
check(
  Math.round(bpmFromIntervalMs(545)) === 110,
  "탭 간격에서 BPM을 계산하는 식이 틀렸습니다.",
);

const perfectTaps = Array.from({ length: 40 }, (_, i) => i * 545);
check(
  accuracyPercent(scoreCompressions(perfectTaps)) === 100,
  "정확한 리듬으로 40번 눌렀는데 만점이 아닙니다.",
);
check(
  accuracyPercent(scoreCompressions(Array.from({ length: 40 }, (_, i) => i * 1000))) === 0,
  "너무 느린 리듬(분당 60회)인데 점수가 나옵니다.",
);
check(
  !isPassing(scoreCompressions(Array.from({ length: 5 }, (_, i) => i * 545)), "elementary"),
  "몇 번만 누르고 멈췄는데 통과됩니다.",
);

// 가이드 원: 초등은 끝까지, 중등은 20초 뒤 사라짐
check(isGuideVisible("elementary", 59_000), "초등 모드에서 가이드 원이 도중에 사라집니다.");
check(isGuideVisible("middle", 19_000), "중등 모드에서 가이드 원이 20초 전에 사라집니다.");
check(!isGuideVisible("middle", 21_000), "중등 모드에서 20초가 지나도 가이드 원이 남아 있습니다.");

// 가이드 원 크기는 0~1 사이를 오가야 합니다
let guideMin = 1;
let guideMax = 0;
for (let t = 0; t < 2000; t += 10) {
  const scale = guideCircleScale(t);
  guideMin = Math.min(guideMin, scale);
  guideMax = Math.max(guideMax, scale);
}
check(
  guideMin < 0.05 && guideMax > 0.95,
  `가이드 원이 제대로 커졌다 작아지지 않습니다 (${guideMin.toFixed(2)}~${guideMax.toFixed(2)}).`,
);

for (const difficulty of DIFFICULTIES) {
  check(
    compressionDurationMs(difficulty) === CPR_DURATION_SECONDS[difficulty] * 1000,
    `${difficulty} 모드 가슴압박 시간이 맞지 않습니다.`,
  );
  notes.push(
    `미션2 ${difficulty}: 압박 ${CPR_DURATION_SECONDS[difficulty]}초 · 통과 ${PASS_THRESHOLD_PERCENT[difficulty]}%`,
  );
}

/* -------------------------- 8. 간호 유형 --------------------------- */

check(
  Object.keys(NURSE_TYPES).length === 3,
  `간호 유형이 ${Object.keys(NURSE_TYPES).length}개입니다. 기획서 기준은 3개입니다.`,
);

const typeCases: { label: string; scores: [number, number, number]; expect: string }[] = [
  { label: "응급실 최고점", scores: [10, 5, 4], expect: "fastJudgment" },
  { label: "CPR 최고점", scores: [4, 10, 5], expect: "calmAction" },
  { label: "보건실 최고점", scores: [3, 4, 9], expect: "carefulCare" },
];
for (const testCase of typeCases) {
  const results = [
    buildMissionResult("er", { correct: testCase.scores[0], total: 10 }, "middle"),
    buildMissionResult("ambulance", { correct: testCase.scores[1], total: 10 }, "middle"),
    buildMissionResult("healthRoom", { correct: testCase.scores[2], total: 10 }, "middle"),
  ];
  check(
    decideNurseTypeId(results) === testCase.expect,
    `${testCase.label}인데 기대한 유형(${testCase.expect})이 안 나옵니다.`,
  );
}

for (const mission of MISSION_LIST) {
  const typeId = MISSION_TO_NURSE_TYPE[mission.id];
  const type = NURSE_TYPES[typeId];
  check(!!type, `${mission.title}에 연결된 간호 유형이 없습니다.`);
  check(
    type.careers.length > 0,
    `간호 유형 "${type.title}"에 진로 정보가 비어 있습니다.`,
  );
}

/* ------------------- 9. 통과 기준 / 리포트 열림 --------------------- */

check(isPassing({ correct: 4, total: 6 }, "elementary"), "초등 6문제 중 4개(67%)인데 탈락합니다.");
check(!isPassing({ correct: 3, total: 6 }, "elementary"), "초등 6문제 중 3개(50%)인데 통과됩니다.");
check(isPassing({ correct: 6, total: 8 }, "middle"), "중등에서 정확히 75%인데 탈락합니다.");
check(!isPassing({ correct: 5, total: 8 }, "middle"), "중등 8문제 중 5개(63%)인데 통과됩니다.");

// 기획서: 배지 3개를 다 모아야 리포트가 열린다
let session = createSession("점검", "elementary");
for (const mission of MISSION_LIST) {
  session = recordMissionResult(
    session,
    buildMissionResult(mission.id, { correct: 10, total: 10 }, "elementary"),
  );
  session = markMissionUnlocked(session, mission.id);
}
check(canOpenReport(session), "세 미션을 모두 통과했는데 리포트가 안 열립니다.");

let failedSession = createSession("점검", "elementary");
for (const mission of MISSION_LIST) {
  const passed = mission.id !== "ambulance";
  failedSession = recordMissionResult(
    failedSession,
    buildMissionResult(mission.id, { correct: passed ? 10 : 1, total: 10 }, "elementary"),
  );
  failedSession = markMissionUnlocked(failedSession, mission.id);
}
check(
  !canOpenReport(failedSession),
  "한 미션을 통과 못 했는데 리포트가 열립니다. 기획서는 배지 3개를 다 모아야 열립니다.",
);

/* ---------------------------- 결과 출력 ---------------------------- */

console.log("\n📋 데이터 점검 결과\n");
for (const note of notes) console.log(`   · ${note}`);

if (problems.length === 0) {
  console.log("\n✅ 문제 없습니다. 데이터와 계산이 기획서대로 잘 맞습니다.\n");
  process.exit(0);
} else {
  console.log(`\n❌ 문제 ${problems.length}건을 찾았습니다:\n`);
  for (const problem of problems) console.log(`   - ${problem}`);
  console.log("");
  process.exit(1);
}
