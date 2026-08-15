"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  getSurgicalItems,
  type SurgicalDestination,
  type SurgicalItem,
} from "@/data/specialty-missions";
import { buildMissionResult } from "@/lib/scoring";

import { AppScreen } from "./AppScreen";
import { PrimaryButton } from "./PrimaryButton";
import { useRequireSession, useSession } from "./SessionProvider";
import {
  getCountResponse,
  getHandoffPrompt,
  getHandoffResponse,
  getPrepResponse,
  getRolePrompt,
  getRoleResponse,
  INCIDENT_RESPONSES,
  SURGERY_DIALOGUES,
  SURGERY_SCENES,
  type SurgeryDialogueLine,
  type SurgeryStoryScene,
} from "./surgery-story";
import { playUiSound } from "./ui-sound";
import styles from "./SurgeryMissionScreen.module.css";

type DragPoint = { x: number; y: number };
type SurgicalRole = "hemostasis" | "grasp" | "incision";
type SurgeryPhase = "setup" | "handoff" | "incident" | "count" | "complete";
type Feedback = { correct: boolean; lines: SurgeryDialogueLine[] };

const SURGICAL_ROLES: Array<{
  id: SurgicalRole;
  label: string;
  caption: string;
  itemId: string;
}> = [
  { id: "hemostasis", label: "지혈", caption: "혈관을 잡아 출혈 조절", itemId: "hemostat" },
  { id: "grasp", label: "조직 잡기", caption: "조직과 거즈를 정교하게 잡기", itemId: "forceps" },
  { id: "incision", label: "절개 준비", caption: "수술용 칼날을 결합할 손잡이", itemId: "scalpelHandle" },
];

const TOOL_PURPOSE: Record<string, string> = {
  hemostat: "혈관을 잡아 출혈을 조절하는 잠금형 기구",
  forceps: "조직이나 거즈를 정교하게 집는 기구",
  scalpelHandle: "수술용 칼날을 결합해 사용하는 손잡이",
  phone: "개인 물품이라 멸균 구역 안으로 가져갈 수 없음",
  openedWrap: "바닥에 닿아 오염된 것으로 판단하는 포장",
  unsealedGauze: "개봉 상태를 신뢰할 수 없어 사용을 보류하는 거즈",
};

const COUNT_LOCATIONS = {
  floor: "바닥",
  bin: "폐기통",
  drape: "수술포 주변",
} as const;

function SurgicalToolVisual({ itemId }: { itemId: string }) {
  return <span className={styles.toolVisual} data-tool={itemId} aria-hidden="true" />;
}

function DialoguePanel({ lines }: { lines: SurgeryDialogueLine[] }) {
  return (
    <div className={styles.dialoguePanel} role="status" aria-live="polite">
      {lines.slice(-2).map((line, index) => (
        <p key={`${line.speaker}-${line.text}-${index}`} data-speaker={line.speaker}>
          <span>{line.speaker}</span>
          <strong>“{line.text}”</strong>
        </p>
      ))}
    </div>
  );
}

type CinematicSceneProps = {
  sceneId: SurgeryStoryScene;
  dialogue: SurgeryDialogueLine[];
  children?: React.ReactNode;
  urgency?: number;
  transferringToolId?: string | null;
};

function CinematicScene({
  sceneId,
  dialogue,
  children,
  urgency,
  transferringToolId,
}: CinematicSceneProps) {
  const scene = SURGERY_SCENES[sceneId];

  return (
    <section className={styles.cinematicScene} data-scene={sceneId} aria-label={scene.alt}>
      <Image
        key={scene.src}
        className={styles.cinematicImage}
        src={scene.src}
        alt={scene.alt}
        fill
        priority
        sizes="(max-width: 760px) 100vw, 1180px"
      />
      <div className={styles.sceneShade} />
      <span className={styles.sceneEyebrow}>{scene.eyebrow}</span>
      {typeof urgency === "number" ? (
        <div className={styles.urgencyIndicator} data-alert={urgency >= 70}>
          <span>TEAM TEMPO</span>
          <strong>{urgency < 45 ? "STEADY" : urgency < 70 ? "FOCUSED" : "URGENT"}</strong>
          <i><b style={{ width: `${urgency}%` }} /></i>
        </div>
      ) : null}
      {children}
      {transferringToolId ? (
        <div className={styles.transferCue} aria-hidden="true">
          <SurgicalToolVisual itemId={transferringToolId} />
        </div>
      ) : null}
      <DialoguePanel lines={dialogue} />
    </section>
  );
}

export function SurgeryMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult, soundEnabled } = useSession();
  const [started, setStarted] = useState(false);
  const [placements, setPlacements] = useState<Record<string, SurgicalDestination>>({});
  const [firstJudgments, setFirstJudgments] = useState<Record<string, boolean>>({});
  const [rolePlacements, setRolePlacements] = useState<Partial<Record<SurgicalRole, string>>>({});
  const [roleJudgments, setRoleJudgments] = useState<Record<string, boolean>>({});
  const [selectedSterileId, setSelectedSterileId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [phase, setPhase] = useState<SurgeryPhase>("setup");
  const [requestIndex, setRequestIndex] = useState(0);
  const [requestVisible, setRequestVisible] = useState(false);
  const [requestJudgments, setRequestJudgments] = useState<boolean[]>([]);
  const [urgency, setUrgency] = useState(12);
  const [transferToolId, setTransferToolId] = useState<string | null>(null);
  const [handoffAdvancePending, setHandoffAdvancePending] = useState(false);
  const [incidentFirstCorrect, setIncidentFirstCorrect] = useState<boolean | null>(null);
  const [incidentResolved, setIncidentResolved] = useState(false);
  const [countFirstCorrect, setCountFirstCorrect] = useState<boolean | null>(null);
  const [missingGauzeFound, setMissingGauzeFound] = useState(false);
  const [countResolved, setCountResolved] = useState(false);
  const dragOriginRef = useRef<DragPoint | null>(null);

  const difficulty = session?.difficulty ?? "elementary";
  const items = getSurgicalItems(difficulty);
  const remainingItems = items.filter((item) => placements[item.id] === undefined);
  const completed = remainingItems.length === 0;
  const sterileItems = items.filter((item) => item.destination === "sterile");
  const activeRoles = SURGICAL_ROLES.filter((role) => sterileItems.some((item) => item.id === role.itemId));
  const currentRole = activeRoles.find((role) => rolePlacements[role.id] !== role.itemId);
  const assemblyCompleted = currentRole === undefined;
  const activeRequest = activeRoles[requestIndex];
  const activeRequestItem = items.find((item) => item.id === activeRequest?.itemId);
  const activeRequestLabel = activeRequestItem?.label ?? activeRequest?.label ?? "요청 기구";

  const storyScene: SurgeryStoryScene = !started
    ? "briefing"
    : phase === "setup"
      ? completed ? "instrumentCheck" : "prep"
      : phase === "handoff"
        ? requestIndex === 0 ? "handoff" : "surgeryProgress"
        : phase;

  const baseDialogue = phase === "setup"
    ? completed
      ? currentRole ? getRolePrompt(currentRole.label) : [
        { speaker: "수술실 간호사" as const, text: "기구 준비가 끝났습니다. 수술팀 요청에 대응하겠습니다." },
      ]
      : SURGERY_DIALOGUES.prep
    : phase === "handoff" && requestVisible && activeRequest
      ? getHandoffPrompt(activeRequestLabel)
      : SURGERY_DIALOGUES[storyScene];
  const dialogue = feedback?.lines ?? baseDialogue;

  const setupRatio = items.length === 0 ? 0 : Object.keys(placements).length / items.length;
  const roleRatio = activeRoles.length === 0 ? 0 : Object.keys(rolePlacements).length / activeRoles.length;
  const progress = phase === "setup"
    ? Math.round((setupRatio * 28) + (roleRatio * 17))
    : phase === "handoff"
      ? 45 + Math.round(((requestIndex + (handoffAdvancePending ? 1 : 0)) / activeRoles.length) * 30)
      : phase === "incident" ? 80
        : phase === "count" ? 90
          : 100;

  useEffect(() => {
    if (phase !== "handoff" || requestVisible || handoffAdvancePending || !activeRequest) return;
    const delays = [650, 1050, 820];
    const timeout = window.setTimeout(() => {
      setFeedback(null);
      setRequestVisible(true);
    }, delays[requestIndex % delays.length]);
    return () => window.clearTimeout(timeout);
  }, [phase, requestVisible, handoffAdvancePending, requestIndex, activeRequest]);

  useEffect(() => {
    if (phase !== "handoff" || !requestVisible) return;
    const interval = window.setInterval(() => setUrgency((current) => Math.min(100, current + 2)), 500);
    return () => window.clearInterval(interval);
  }, [phase, requestVisible]);

  useEffect(() => {
    if (!handoffAdvancePending) return;
    const timeout = window.setTimeout(() => {
      setTransferToolId(null);
      setFeedback(null);
      setHandoffAdvancePending(false);
      if (requestIndex === activeRoles.length - 1) {
        setPhase("incident");
      } else {
        setRequestIndex((current) => current + 1);
      }
    }, 950);
    return () => window.clearTimeout(timeout);
  }, [handoffAdvancePending, requestIndex, activeRoles.length]);

  useEffect(() => {
    if (!incidentResolved) return;
    const timeout = window.setTimeout(() => {
      setFeedback(null);
      setIncidentResolved(false);
      setPhase("count");
    }, 1250);
    return () => window.clearTimeout(timeout);
  }, [incidentResolved]);

  useEffect(() => {
    if (!countResolved) return;
    const timeout = window.setTimeout(() => {
      setFeedback(null);
      setCountResolved(false);
      setPhase("complete");
    }, 1350);
    return () => window.clearTimeout(timeout);
  }, [countResolved]);

  if (session === null) return null;

  function playMissionSound(sound: Parameters<typeof playUiSound>[0]) {
    if (soundEnabled) playUiSound(sound);
  }

  function placeItem(item: SurgicalItem, destination: SurgicalDestination) {
    const correct = item.destination === destination;
    setFirstJudgments((current) => (
      current[item.id] === undefined ? { ...current, [item.id]: correct } : current
    ));
    setSelectedId(null);
    setFeedback({ correct, lines: getPrepResponse(item.label, destination, correct) });

    if (!correct) {
      playMissionSound("warning");
      return;
    }

    playMissionSound("instrument");
    setPlacements((current) => ({ ...current, [item.id]: destination }));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, item: SurgicalItem) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOriginRef.current = { x: event.clientX, y: event.clientY };
    setDraggingId(item.id);
    setDragPoint({ x: event.clientX, y: event.clientY });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (draggingId === null) return;
    setDragPoint({ x: event.clientX, y: event.clientY });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>, item: SurgicalItem) {
    const origin = dragOriginRef.current;
    const moved = origin !== null && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10;
    const dropTarget = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-surgical-destination]");
    const destination = dropTarget?.dataset.surgicalDestination as SurgicalDestination | undefined;

    setDraggingId(null);
    setDragPoint(null);
    dragOriginRef.current = null;

    if (moved && destination) {
      placeItem(item, destination);
    } else if (!moved) {
      setSelectedId((current) => current === item.id ? null : item.id);
      setFeedback(null);
    }
  }

  function handleFinish() {
    const correct = Object.values(firstJudgments).filter(Boolean).length
      + Object.values(roleJudgments).filter(Boolean).length
      + requestJudgments.filter(Boolean).length
      + (incidentFirstCorrect ? 1 : 0)
      + (countFirstCorrect ? 1 : 0);
    saveMissionResult(buildMissionResult(
      "operatingRoom",
      { correct, total: items.length + activeRoles.length + activeRoles.length + 2 },
      difficulty,
    ));
    router.push("/unlock/operatingRoom");
  }

  function placeSterileRole() {
    if (!selectedSterileId || !currentRole) return;
    const correct = currentRole.itemId === selectedSterileId;
    setRoleJudgments((current) => (
      current[selectedSterileId] === undefined
        ? { ...current, [selectedSterileId]: correct }
        : current
    ));
    const selected = items.find((item) => item.id === selectedSterileId);
    setFeedback({ correct, lines: getRoleResponse(selected?.label ?? "선택한 기구", correct) });

    if (!correct) {
      playMissionSound("warning");
      return;
    }

    playMissionSound("instrument");
    setRolePlacements((current) => ({ ...current, [currentRole.id]: selectedSterileId }));
    setSelectedSterileId(null);
  }

  function handleRequestedTool(itemId: string) {
    if (phase !== "handoff" || !requestVisible || !activeRequest || handoffAdvancePending) return;
    const correct = itemId === activeRequest.itemId;
    setRequestJudgments((current) => (
      current.length === requestIndex ? [...current, correct] : current
    ));
    setFeedback({ correct, lines: getHandoffResponse(activeRequestLabel, correct) });

    if (!correct) {
      playMissionSound("warning");
      setUrgency((current) => Math.min(100, current + 15));
      return;
    }

    playMissionSound("instrument");
    setRequestVisible(false);
    setTransferToolId(itemId);
    setHandoffAdvancePending(true);
    setUrgency((current) => Math.max(8, current - 18));
  }

  function handleSterileIncident(choice: "reuse" | "replace") {
    if (incidentResolved) return;
    const correct = choice === "replace";
    if (incidentFirstCorrect === null) setIncidentFirstCorrect(correct);
    setFeedback({ correct, lines: correct ? INCIDENT_RESPONSES.resolved : INCIDENT_RESPONSES.retry });

    if (!correct) {
      playMissionSound("warning");
      return;
    }

    playMissionSound("success");
    setIncidentResolved(true);
  }

  function inspectCountLocation(location: keyof typeof COUNT_LOCATIONS) {
    if (countResolved) return;
    const correct = location === "drape";
    if (countFirstCorrect === null) setCountFirstCorrect(correct);
    setFeedback({ correct, lines: getCountResponse(COUNT_LOCATIONS[location], correct) });

    if (!correct) {
      playMissionSound("warning");
      return;
    }

    playMissionSound("success");
    setMissingGauzeFound(true);
    setCountResolved(true);
  }

  const placedSterileItems = items.filter((item) => placements[item.id] === "sterile");
  const isolatedItems = items.filter((item) => placements[item.id] === "isolate");

  return (
    <AppScreen title="수술실" subtitle="수술팀의 안전을 연결하세요" tone="surgical">
      {!started ? (
        <section className={styles.briefing}>
          <CinematicScene sceneId="briefing" dialogue={SURGERY_DIALOGUES.briefing} />
          <div className={styles.briefingDock}>
            <p>
              <span>YOUR ROLE</span>
              <strong>오늘 당신은 수술실 간호사입니다.</strong>
              <small>멸균 준비부터 기구 전달, 사고 대응, 마지막 카운트까지 팀 안에서 판단합니다.</small>
            </p>
            <PrimaryButton onClick={() => {
              playMissionSound("transition");
              setStarted(true);
            }}>
              수술 준비 시작
            </PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} data-phase={phase} aria-label="수술팀 협업 시뮬레이션">
          <div className={styles.missionStatus}>
            <p><span>OPERATING ROOM</span><strong>{progress}%</strong></p>
            <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>
            <ol aria-label="수술 미션 진행 단계">
              {[
                ["setup", "준비"],
                ["handoff", "전달"],
                ["incident", "오염 대응"],
                ["count", "카운트"],
                ["complete", "종료"],
              ].map(([id, label], index) => (
                <li key={id} data-current={phase === id} data-done={progress >= [1, 46, 81, 91, 100][index]}>{label}</li>
              ))}
            </ol>
          </div>

          {phase === "setup" && !completed ? (
            <>
              <CinematicScene sceneId="prep" dialogue={dialogue} />
              <section className={styles.prepWorkbench} aria-label="멸균 물품 판별 준비대">
                <header>
                  <p><span>STERILE PREP</span><strong>포장 상태를 보고 물품을 옮기세요.</strong></p>
                  <small>끌어 놓거나, 물품을 누른 뒤 구역을 누를 수 있습니다.</small>
                </header>
                <div className={styles.destinationRow}>
                  <button
                    type="button"
                    data-surgical-destination="sterile"
                    data-active={selectedId !== null}
                    onClick={() => {
                      const item = items.find((candidate) => candidate.id === selectedId);
                      if (item) placeItem(item, "sterile");
                    }}
                  >
                    <span>사용 가능</span><strong>멸균 준비대</strong><small>{placedSterileItems.map((item) => item.label).join(" · ") || "아직 비어 있음"}</small>
                  </button>
                  <button
                    type="button"
                    data-surgical-destination="isolate"
                    data-active={selectedId !== null}
                    onClick={() => {
                      const item = items.find((candidate) => candidate.id === selectedId);
                      if (item) placeItem(item, "isolate");
                    }}
                  >
                    <span>사용 보류</span><strong>격리 구역</strong><small>{isolatedItems.map((item) => item.label).join(" · ") || "아직 비어 있음"}</small>
                  </button>
                </div>
                <div className={styles.instrumentRail}>
                  {remainingItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.instrumentCard}
                      data-selected={selectedId === item.id}
                      data-dragging={draggingId === item.id}
                      onPointerDown={(event) => handlePointerDown(event, item)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={(event) => handlePointerUp(event, item)}
                      onPointerCancel={() => { setDraggingId(null); setDragPoint(null); }}
                    >
                      <SurgicalToolVisual itemId={item.id} />
                      <span><strong>{item.label}</strong><small>{item.caption}</small></span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {phase === "setup" && completed ? (
            <>
              <CinematicScene sceneId="instrumentCheck" dialogue={dialogue} />
              <section className={styles.instrumentCheck} aria-label="수술 기구 역할 확인">
                <header>
                  <p><span>INSTRUMENT CHECK</span><strong>{currentRole ? `${currentRole.label} 기구를 준비하세요.` : "기구 준비가 끝났습니다."}</strong></p>
                  <small>{currentRole?.caption ?? "수술팀 호출을 시작할 수 있습니다."}</small>
                </header>
                <div className={styles.preparedTools} aria-label="준비 완료 기구">
                  {activeRoles.map((role) => {
                    const prepared = items.find((item) => item.id === rolePlacements[role.id]);
                    return (
                      <div key={role.id} data-ready={Boolean(prepared)}>
                        <span>{role.label}</span>
                        {prepared ? <SurgicalToolVisual itemId={prepared.id} /> : null}
                        <strong>{prepared?.label ?? "준비 대기"}</strong>
                      </div>
                    );
                  })}
                </div>
                {!assemblyCompleted ? (
                  <div className={styles.instrumentChoice}>
                    <div className={styles.instrumentRail}>
                      {sterileItems
                        .filter((item) => !Object.values(rolePlacements).includes(item.id))
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={styles.instrumentCard}
                            data-selected={selectedSterileId === item.id}
                            onClick={() => {
                              setSelectedSterileId((current) => current === item.id ? null : item.id);
                              setFeedback(null);
                            }}
                          >
                            <SurgicalToolVisual itemId={item.id} />
                            <span><strong>{item.label}</strong><small>{TOOL_PURPOSE[item.id]}</small></span>
                          </button>
                        ))}
                    </div>
                    <button type="button" className={styles.placeOnTray} disabled={!selectedSterileId} onClick={placeSterileRole}>
                      선택한 기구를 준비대에 놓기
                    </button>
                  </div>
                ) : (
                  <div className={styles.teamReady}>
                    <p><span>STERILE FIELD READY</span><strong>준비가 끝났습니다. 이제 집도의의 요청에 대응하세요.</strong></p>
                    <PrimaryButton onClick={() => {
                      playMissionSound("transition");
                      setFeedback(null);
                      setPhase("handoff");
                    }}>
                      수술팀 호출 시작
                    </PrimaryButton>
                  </div>
                )}
              </section>
            </>
          ) : null}

          {phase === "handoff" ? (
            <>
              <CinematicScene
                sceneId={requestIndex === 0 ? "handoff" : "surgeryProgress"}
                dialogue={dialogue}
                urgency={urgency}
                transferringToolId={transferToolId}
              />
              <section className={styles.handoffTray} aria-label="집도의 요청 기구 선택">
                <header>
                  <p><span>INSTRUMENT TRAY</span><strong>{requestVisible ? "집도의의 요청을 듣고 기구를 집으세요." : handoffAdvancePending ? "안전하게 전달하는 중입니다." : "다음 요청을 기다리는 중입니다."}</strong></p>
                  <small>{requestIndex + 1} / {activeRoles.length} 요청</small>
                </header>
                <div className={styles.instrumentRail}>
                  {sterileItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.instrumentCard}
                      disabled={!requestVisible || handoffAdvancePending}
                      onClick={() => handleRequestedTool(item.id)}
                    >
                      <SurgicalToolVisual itemId={item.id} />
                      <span><strong>{item.label}</strong><small>{TOOL_PURPOSE[item.id]}</small></span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {phase === "incident" ? (
            <>
              <CinematicScene sceneId="incident" dialogue={dialogue} />
              <section className={styles.incidentActions} aria-label="멸균 오염 사고 대응">
                <header><span>YOUR DECISION</span><strong>떨어진 기구를 어떻게 처리할까요?</strong></header>
                <button type="button" disabled={incidentResolved} onClick={() => handleSterileIncident("reuse")}>
                  <span>행동 A</span><strong>그대로 다시 사용한다</strong><small>수술 지연을 막고 바로 전달한다</small>
                </button>
                <button type="button" disabled={incidentResolved} onClick={() => handleSterileIncident("replace")}>
                  <span>행동 B</span><strong>새 멸균 기구로 교체한다</strong><small>오염 가능 기구는 즉시 격리한다</small>
                </button>
              </section>
            </>
          ) : null}

          {phase === "count" ? (
            <CinematicScene sceneId="count" dialogue={dialogue}>
              <div className={styles.countHotspots} data-resolved={missingGauzeFound}>
                <button type="button" disabled={countResolved} onClick={() => inspectCountLocation("floor")}><span>바닥</span><strong>조사</strong></button>
                <button type="button" disabled={countResolved} onClick={() => inspectCountLocation("bin")}><span>폐기통</span><strong>조사</strong></button>
                <button type="button" disabled={countResolved} onClick={() => inspectCountLocation("drape")}><span>수술포 주변</span><strong>조사</strong></button>
              </div>
            </CinematicScene>
          ) : null}

          {phase === "complete" ? (
            <>
              <CinematicScene sceneId="complete" dialogue={SURGERY_DIALOGUES.complete} />
              <section className={styles.debrief}>
                <div>
                  <span>당신이 수행한 수술실 간호 업무</span>
                  <h2>수술 전·중·후의 안전을 연결했습니다.</h2>
                  <ul>
                    <li>멸균 상태 판단</li>
                    <li>수술 기구 준비</li>
                    <li>집도의 요청 대응</li>
                    <li>오염 사고 대응</li>
                    <li>수술 종료 전 거즈 카운트</li>
                  </ul>
                  <p>수술실 간호사는 기구를 전달하는 사람이 아니라, 수술 전·중·후의 안전을 지키는 팀 구성원입니다.</p>
                </div>
                <PrimaryButton onClick={handleFinish}>수술 안전 결과 확인</PrimaryButton>
              </section>
            </>
          ) : null}

          {draggingId && dragPoint ? (
            <div className={styles.dragGhost} style={{ left: dragPoint.x, top: dragPoint.y }} aria-hidden="true">
              <SurgicalToolVisual itemId={draggingId} />
              <span>{items.find((item) => item.id === draggingId)?.label}</span>
            </div>
          ) : null}
        </section>
      )}
    </AppScreen>
  );
}
