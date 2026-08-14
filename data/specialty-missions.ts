import type { Difficulty } from "./types";

type DifficultyList = Difficulty[];

export type SurgicalDestination = "sterile" | "isolate";

export type SurgicalItem = {
  id: string;
  label: string;
  caption: string;
  destination: SurgicalDestination;
  levels: DifficultyList;
};

export const SURGICAL_ITEMS: SurgicalItem[] = [
  {
    id: "hemostat",
    label: "지혈겸자",
    caption: "멸균 포장 확인",
    destination: "sterile",
    levels: ["elementary", "middle"],
  },
  {
    id: "forceps",
    label: "조직겸자",
    caption: "멸균 포장 확인",
    destination: "sterile",
    levels: ["elementary", "middle"],
  },
  {
    id: "phone",
    label: "개인 휴대전화",
    caption: "비멸균 물품",
    destination: "isolate",
    levels: ["elementary", "middle"],
  },
  {
    id: "openedWrap",
    label: "바닥에 닿은 포장",
    caption: "오염 가능성",
    destination: "isolate",
    levels: ["elementary", "middle"],
  },
  {
    id: "scalpelHandle",
    label: "메스 손잡이",
    caption: "멸균 포장 확인",
    destination: "sterile",
    levels: ["middle"],
  },
  {
    id: "unsealedGauze",
    label: "개봉된 거즈",
    caption: "포장 상태 불확실",
    destination: "isolate",
    levels: ["middle"],
  },
];

export function getSurgicalItems(difficulty: Difficulty): SurgicalItem[] {
  return SURGICAL_ITEMS.filter((item) => item.levels.includes(difficulty));
}

export type IcuPatient = {
  id: string;
  bed: string;
  label: string;
  heartRate: number;
  spo2: number;
  resp: number;
  bloodPressure: string;
  status: string;
};

export type IcuRound = {
  id: string;
  situation: string;
  patients: IcuPatient[];
  urgentPatientId: string;
  response: string;
  explanation: string;
  levels: DifficultyList;
};

export const ICU_ROUNDS: IcuRound[] = [
  {
    id: "oxygenDrop",
    situation: "산소포화도가 갑자기 변했습니다.",
    patients: [
      { id: "a", bed: "A-01", label: "김하진", heartRate: 78, spo2: 98, resp: 16, bloodPressure: "118/72", status: "안정" },
      { id: "b", bed: "A-02", label: "이도윤", heartRate: 126, spo2: 89, resp: 30, bloodPressure: "104/66", status: "산소포화도 하강" },
      { id: "c", bed: "A-03", label: "박서연", heartRate: 92, spo2: 96, resp: 20, bloodPressure: "121/76", status: "관찰 중" },
    ],
    urgentPatientId: "b",
    response: "환자 상태를 직접 확인하고 의료진에게 즉시 알립니다.",
    explanation: "A-02 환자는 산소포화도가 89%로 낮고 맥박과 호흡도 함께 빨라졌습니다.",
    levels: ["elementary", "middle"],
  },
  {
    id: "pressureDrop",
    situation: "회복 중인 환자의 혈압 추세가 바뀌었습니다.",
    patients: [
      { id: "a", bed: "B-01", label: "정우진", heartRate: 84, spo2: 97, resp: 18, bloodPressure: "116/70", status: "회복 중" },
      { id: "b", bed: "B-02", label: "한예린", heartRate: 88, spo2: 98, resp: 17, bloodPressure: "124/78", status: "안정" },
      { id: "c", bed: "B-03", label: "조민호", heartRate: 122, spo2: 94, resp: 26, bloodPressure: "82/48", status: "혈압 급하강" },
    ],
    urgentPatientId: "c",
    response: "낮아진 혈압을 재확인하고 의료진 호출을 준비합니다.",
    explanation: "B-03 환자는 혈압이 82/48로 낮아지고 맥박이 빨라져 가장 먼저 확인해야 합니다.",
    levels: ["elementary", "middle"],
  },
  {
    id: "slowPulse",
    situation: "한 환자가 어지럽다고 말했습니다.",
    patients: [
      { id: "a", bed: "C-01", label: "오지안", heartRate: 48, spo2: 94, resp: 12, bloodPressure: "88/54", status: "어지럼·느린 맥박" },
      { id: "b", bed: "C-02", label: "서준호", heartRate: 90, spo2: 97, resp: 18, bloodPressure: "119/73", status: "안정" },
      { id: "c", bed: "C-03", label: "윤채원", heartRate: 98, spo2: 96, resp: 20, bloodPressure: "126/80", status: "관찰 중" },
    ],
    urgentPatientId: "a",
    response: "의식과 맥박을 바로 확인하고 도움을 요청합니다.",
    explanation: "C-01 환자는 어지럼 증상과 함께 맥박과 혈압이 낮아 우선 확인이 필요합니다.",
    levels: ["elementary", "middle"],
  },
  {
    id: "slowBreathing",
    situation: "처치 후 호흡수가 달라졌습니다.",
    patients: [
      { id: "a", bed: "D-01", label: "남도현", heartRate: 82, spo2: 97, resp: 16, bloodPressure: "120/74", status: "안정" },
      { id: "b", bed: "D-02", label: "신가은", heartRate: 58, spo2: 90, resp: 8, bloodPressure: "96/60", status: "호흡 느려짐" },
      { id: "c", bed: "D-03", label: "문지호", heartRate: 102, spo2: 96, resp: 21, bloodPressure: "130/82", status: "관찰 중" },
    ],
    urgentPatientId: "b",
    response: "호흡 상태를 직접 확인하고 즉시 의료진을 부릅니다.",
    explanation: "D-02 환자는 호흡수가 분당 8회로 느리고 산소포화도도 낮아졌습니다.",
    levels: ["middle"],
  },
];

export function getIcuRounds(difficulty: Difficulty): IcuRound[] {
  return ICU_ROUNDS.filter((round) => round.levels.includes(difficulty));
}

export type MedicationOption = {
  id: string;
  medicine: string;
  dose: string;
  form: string;
};

export type MedicationCase = {
  id: string;
  patientName: string;
  birthDate: string;
  order: string;
  route: string;
  correctOptionId: string;
  explanation: string;
  options: MedicationOption[];
  levels: DifficultyList;
};

export const MEDICATION_CASES: MedicationCase[] = [
  {
    id: "painRelief",
    patientName: "김지우",
    birthDate: "2010.04.18",
    order: "아세트아미노펜 500mg",
    route: "경구",
    correctOptionId: "acetaminophen500",
    explanation: "환자 두 가지 정보와 약 이름, 용량, 투여 경로가 모두 일치합니다.",
    options: [
      { id: "acetaminophen500", medicine: "아세트아미노펜", dose: "500mg", form: "정제" },
      { id: "acetaminophen250", medicine: "아세트아미노펜", dose: "250mg", form: "정제" },
      { id: "ibuprofen400", medicine: "이부프로펜", dose: "400mg", form: "정제" },
    ],
    levels: ["elementary", "middle"],
  },
  {
    id: "allergyRelief",
    patientName: "이하늘",
    birthDate: "1998.11.02",
    order: "세티리진 10mg",
    route: "경구",
    correctOptionId: "cetirizine10",
    explanation: "같은 약이라도 용량이 다르면 투약할 수 없습니다. 10mg 제품이 처방과 일치합니다.",
    options: [
      { id: "cetirizine5", medicine: "세티리진", dose: "5mg", form: "정제" },
      { id: "cetirizine10", medicine: "세티리진", dose: "10mg", form: "정제" },
      { id: "vitaminD1000", medicine: "비타민D", dose: "1000IU", form: "정제" },
    ],
    levels: ["elementary", "middle"],
  },
  {
    id: "vitaminOrder",
    patientName: "박하람",
    birthDate: "1986.06.27",
    order: "비타민D 1000IU",
    route: "경구",
    correctOptionId: "vitaminD1000",
    explanation: "이름이 비슷해 보여도 약 이름과 단위를 끝까지 확인해야 합니다.",
    options: [
      { id: "vitaminC1000", medicine: "비타민C", dose: "1000mg", form: "정제" },
      { id: "vitaminD2000", medicine: "비타민D", dose: "2000IU", form: "정제" },
      { id: "vitaminD1000", medicine: "비타민D", dose: "1000IU", form: "정제" },
    ],
    levels: ["elementary", "middle"],
  },
  {
    id: "antibioticOrder",
    patientName: "최민서",
    birthDate: "1975.09.14",
    order: "아목시실린 500mg",
    route: "경구",
    correctOptionId: "amoxicillin500",
    explanation: "환자 확인 뒤 처방과 약품의 이름·용량·경로를 차례로 대조했습니다.",
    options: [
      { id: "amoxicillin250", medicine: "아목시실린", dose: "250mg", form: "캡슐" },
      { id: "amoxicillin500", medicine: "아목시실린", dose: "500mg", form: "캡슐" },
      { id: "acetaminophen500", medicine: "아세트아미노펜", dose: "500mg", form: "정제" },
    ],
    levels: ["middle"],
  },
];

export function getMedicationCases(difficulty: Difficulty): MedicationCase[] {
  return MEDICATION_CASES.filter((item) => item.levels.includes(difficulty));
}
