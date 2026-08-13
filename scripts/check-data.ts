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
import { getHealthRoomCases, HEALTH_ROOM_CASES } from "../data/health-room-cases";
import { MISSION_LIST } from "../data/missions";
import { NURSE_TYPES } from "../data/nurse-types";
import {
  CPR_BPM_MAX,
  CPR_BPM_MIN,
  PASS_THRESHOLD_PERCENT,
  UNLOCK_CODES,
} from "../data/rules";
import { getTriagePatients, TRIAGE_PATIENTS } from "../data/triage-patients";
import { TRIAGE_ZONE_LIST } from "../data/triage-zones";
import type { Difficulty } from "../data/types";
import {
  bpmFromIntervalMs,
  isGoodRhythm,
  scoreCompressions,
} from "../lib/cpr";
import { decideNurseTypeId } from "../lib/nurse-type";
import { accuracyPercent, buildMissionResult, isPassing } from "../lib/scoring";
import { isValidUnlockCode, normalizeUnlockCode } from "../lib/unlock";

const problems: string[] = [];
const notes: string[] = [];

function check(condition: boolean, message: string) {
  if (!condition) problems.push(message);
}

const DIFFICULTIES: Difficulty[] = ["elementary", "middle"];

/* ------------------------- 1. 환자 카드 점검 ------------------------ */

const patientIds = new Set<string>();
for (const patient of TRIAGE_PATIENTS) {
  check(
    !patientIds.has(patient.id),
    `환자 카드 id가 중복됩니다: ${patient.id}`,
  );
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
  const patients = getTriagePatients(difficulty);
  check(
    patients.length > 0,
    `${difficulty} 모드에 환자 카드가 하나도 없습니다.`,
  );
  const zonesUsed = new Set(patients.map((p) => p.correctZone));
  check(
    zonesUsed.size === TRIAGE_ZONE_LIST.length,
    `${difficulty} 모드에서 안 쓰이는 색깔 구역이 있습니다. 빈 구역: ${TRIAGE_ZONE_LIST.filter(
      (z) => !zonesUsed.has(z.level),
    )
      .map((z) => z.label)
      .join(", ")}`,
  );
  notes.push(
    `${difficulty} 모드 환자 카드 ${patients.length}장 (통과 기준 ${PASS_THRESHOLD_PERCENT[difficulty]}%)`,
  );
}

/* ------------------------ 2. 신고 순서 점검 ------------------------- */

for (const difficulty of DIFFICULTIES) {
  const steps = getDispatchSteps(difficulty);
  check(steps.length > 0, `${difficulty} 모드에 신고 순서 카드가 없습니다.`);
  const orders = steps.map((s) => s.correctOrder);
  check(
    new Set(orders).size === orders.length,
    `${difficulty} 모드 신고 순서에 같은 번호가 두 번 나옵니다: ${orders.join(", ")}`,
  );
  notes.push(`${difficulty} 모드 신고 순서 카드 ${steps.length}장`);
}

const stepIds = new Set(DISPATCH_STEPS.map((s) => s.id));
check(
  stepIds.size === DISPATCH_STEPS.length,
  "신고 순서 카드 id가 중복됩니다.",
);

/* -------------------------- 3. AED 점검 ---------------------------- */

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

/* ------------------------- 4. 보건실 점검 --------------------------- */

for (const item of HEALTH_ROOM_CASES) {
  const correct = item.choices.filter((c) => c.isCorrect);
  check(
    correct.length === 1,
    `보건실 상황 "${item.title}"의 정답이 ${correct.length}개입니다. 정답은 정확히 1개여야 합니다.`,
  );
  check(
    item.choices.length >= 2,
    `보건실 상황 "${item.title}"의 선택지가 너무 적습니다.`,
  );
  for (const choice of item.choices) {
    check(
      choice.explanation.trim().length > 0,
      `보건실 상황 "${item.title}"의 선택지 "${choice.label}"에 설명이 없습니다.`,
    );
  }
}

for (const difficulty of DIFFICULTIES) {
  notes.push(
    `${difficulty} 모드 보건실 상황 ${getHealthRoomCases(difficulty).length}개`,
  );
}

for (const slot of HEALTH_LOG_SLOT_LIST) {
  const correct = slot.options.filter((o) => o.isCorrect);
  check(
    correct.length === 1,
    `보건일지 칸 "${slot.question}"의 정답이 ${correct.length}개입니다.`,
  );
}

/* ------------------------ 5. 통과 코드 점검 ------------------------- */

for (const mission of MISSION_LIST) {
  const code = UNLOCK_CODES[mission.id];
  check(
    /^\d{4}$/.test(code),
    `${mission.title}의 통과 코드가 네 자리 숫자가 아닙니다: ${code}`,
  );
  check(
    isValidUnlockCode(mission.id, code),
    `${mission.title}의 통과 코드 확인이 실패했습니다.`,
  );
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

/* -------------------------- 6. CPR 점검 ---------------------------- */

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

// 분당 110회(간격 545ms)로 40번 정확히 누른 경우 → 만점이어야 함
const perfectTaps = Array.from({ length: 40 }, (_, i) => i * 545);
const perfectScore = scoreCompressions(perfectTaps);
check(
  accuracyPercent(perfectScore) === 100,
  `정확한 리듬으로 40번 눌렀는데 만점이 아닙니다: ${perfectScore.correct}/${perfectScore.total}`,
);

// 너무 느리게(분당 60회) 누른 경우 → 0점이어야 함
const slowTaps = Array.from({ length: 40 }, (_, i) => i * 1000);
check(
  accuracyPercent(scoreCompressions(slowTaps)) === 0,
  "너무 느린 리듬인데 점수가 나옵니다.",
);

// 정확하지만 몇 번 안 누른 경우 → 통과하면 안 됨
const tooFewTaps = Array.from({ length: 5 }, (_, i) => i * 545);
check(
  !isPassing(scoreCompressions(tooFewTaps), "elementary"),
  "몇 번만 누르고 멈췄는데 통과됩니다.",
);

/* ----------------------- 7. 유형 판정 점검 ------------------------- */

const allHigh = [
  buildMissionResult("er", { correct: 9, total: 10 }, "middle"),
  buildMissionResult("ambulance", { correct: 9, total: 10 }, "middle"),
  buildMissionResult("healthRoom", { correct: 9, total: 10 }, "middle"),
];
check(
  decideNurseTypeId(allHigh) === "allRounder",
  "세 미션을 모두 잘했는데 올라운드형이 안 나옵니다.",
);

const erBest = [
  buildMissionResult("er", { correct: 10, total: 10 }, "middle"),
  buildMissionResult("ambulance", { correct: 5, total: 10 }, "middle"),
  buildMissionResult("healthRoom", { correct: 4, total: 10 }, "middle"),
];
check(
  decideNurseTypeId(erBest) === "emergency",
  "응급실을 제일 잘했는데 응급실형이 안 나옵니다.",
);

const healthBest = [
  buildMissionResult("er", { correct: 3, total: 10 }, "middle"),
  buildMissionResult("ambulance", { correct: 4, total: 10 }, "middle"),
  buildMissionResult("healthRoom", { correct: 9, total: 10 }, "middle"),
];
check(
  decideNurseTypeId(healthBest) === "schoolCare",
  "보건실을 제일 잘했는데 돌봄교육형이 안 나옵니다.",
);

for (const type of Object.values(NURSE_TYPES)) {
  check(
    type.careers.length > 0 && type.pathway.trim().length > 0,
    `간호 유형 "${type.title}"에 진로 정보가 비어 있습니다.`,
  );
}

/* ------------------------ 8. 통과 기준 점검 ------------------------- */

// 초등 6문제 중 4개 = 67% → 통과, 3개 = 50% → 탈락
check(
  isPassing({ correct: 4, total: 6 }, "elementary"),
  "초등 모드에서 6문제 중 4개를 맞았는데 탈락합니다.",
);
check(
  !isPassing({ correct: 3, total: 6 }, "elementary"),
  "초등 모드에서 6문제 중 3개를 맞았는데 통과됩니다.",
);
// 중등 8문제 중 6개 = 75% → 통과 (기준값과 같으면 통과)
check(
  isPassing({ correct: 6, total: 8 }, "middle"),
  "중등 모드에서 정확히 75%인데 탈락합니다.",
);
check(
  !isPassing({ correct: 5, total: 8 }, "middle"),
  "중등 모드에서 8문제 중 5개를 맞았는데 통과됩니다.",
);

/* ---------------------------- 결과 출력 ---------------------------- */

console.log("\n📋 데이터 점검 결과\n");
for (const note of notes) console.log(`   · ${note}`);

if (problems.length === 0) {
  console.log("\n✅ 문제 없습니다. 데이터와 계산이 서로 잘 맞습니다.\n");
  process.exit(0);
} else {
  console.log(`\n❌ 문제 ${problems.length}건을 찾았습니다:\n`);
  for (const problem of problems) console.log(`   - ${problem}`);
  console.log("");
  process.exit(1);
}
