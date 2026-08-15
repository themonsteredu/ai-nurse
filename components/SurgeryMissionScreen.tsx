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
import styles from "./SurgeryMissionScreen.module.css";

type DragPoint = { x: number; y: number };
type SurgicalRole = "hemostasis" | "grasp" | "incision";
type SurgeryPhase = "setup" | "handoff" | "incident" | "count" | "complete";

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
  hemostat: "혈관을 잡아 출혈을 조절할 때 쓰는 잠금형 기구",
  forceps: "조직이나 거즈를 정교하게 집을 때 쓰는 기구",
  scalpelHandle: "수술용 칼날을 결합해 사용하는 손잡이",
  phone: "개인 물품은 멸균 구역 안으로 가져갈 수 없음",
  openedWrap: "바닥에 닿은 포장은 오염된 것으로 판단",
  unsealedGauze: "개봉 상태가 확인되지 않은 거즈는 사용 보류",
};

function SurgicalToolVisual({ itemId }: { itemId: string }) {
  return <span className={styles.toolVisual} data-tool={itemId} aria-hidden="true" />;
}

export function SurgeryMissionScreen() {
  const router = useRouter();
  const session = useRequireSession();
  const { saveMissionResult } = useSession();
  const [started, setStarted] = useState(false);
  const [placements, setPlacements] = useState<Record<string, SurgicalDestination>>({});
  const [firstJudgments, setFirstJudgments] = useState<Record<string, boolean>>({});
  const [rolePlacements, setRolePlacements] = useState<Partial<Record<SurgicalRole, string>>>({});
  const [roleJudgments, setRoleJudgments] = useState<Record<string, boolean>>({});
  const [selectedSterileId, setSelectedSterileId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [phase, setPhase] = useState<SurgeryPhase>("setup");
  const [requestIndex, setRequestIndex] = useState(0);
  const [requestVisible, setRequestVisible] = useState(false);
  const [requestJudgments, setRequestJudgments] = useState<boolean[]>([]);
  const [urgency, setUrgency] = useState(12);
  const [incidentFirstCorrect, setIncidentFirstCorrect] = useState<boolean | null>(null);
  const [countFirstCorrect, setCountFirstCorrect] = useState<boolean | null>(null);
  const [missingGauzeFound, setMissingGauzeFound] = useState(false);
  const dragOriginRef = useRef<DragPoint | null>(null);

  const difficulty = session?.difficulty ?? "elementary";
  const items = getSurgicalItems(difficulty);
  const remainingItems = items.filter((item) => placements[item.id] === undefined);
  const completed = remainingItems.length === 0;
  const sterileItems = items.filter((item) => item.destination === "sterile");
  const activeRoles = SURGICAL_ROLES.filter((role) => sterileItems.some((item) => item.id === role.itemId));
  const assemblyCompleted = activeRoles.every((role) => rolePlacements[role.id] === role.itemId);
  const activeRequest = activeRoles[requestIndex];

  useEffect(() => {
    if (phase !== "handoff" || requestVisible || !activeRequest) return;
    const delays = [650, 1050, 820];
    const timeout = window.setTimeout(() => setRequestVisible(true), delays[requestIndex % delays.length]);
    return () => window.clearTimeout(timeout);
  }, [phase, requestVisible, requestIndex, activeRequest]);

  useEffect(() => {
    if (phase !== "handoff" || !requestVisible) return;
    const interval = window.setInterval(() => setUrgency((current) => Math.min(100, current + 2)), 500);
    return () => window.clearInterval(interval);
  }, [phase, requestVisible]);

  if (session === null) return null;

  function placeItem(item: SurgicalItem, destination: SurgicalDestination) {
    const correct = item.destination === destination;
    setFirstJudgments((current) => (
      current[item.id] === undefined ? { ...current, [item.id]: correct } : current
    ));
    setSelectedId(null);

    if (!correct) {
      setFeedback({
        correct: false,
        text: destination === "sterile"
          ? `${item.label} 항목은 멸균 상태를 확인할 수 없어 격리해야 해요.`
          : `${item.label} 항목은 멸균 포장이 확인된 수술 기구예요.`,
      });
      return;
    }

    setPlacements((current) => ({ ...current, [item.id]: destination }));
    setFeedback({
      correct: true,
      text: destination === "sterile"
        ? `${item.label} 항목을 멸균 트레이에 안전하게 배치했습니다.`
        : `${item.label} 항목을 오염 위험 구역으로 분리했습니다.`,
    });
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

  function placeSterileRole(role: SurgicalRole) {
    if (!selectedSterileId) return;
    const expectedItemId = activeRoles.find((candidate) => candidate.id === role)?.itemId;
    const correct = expectedItemId === selectedSterileId;
    setRoleJudgments((current) => (
      current[selectedSterileId] === undefined
        ? { ...current, [selectedSterileId]: correct }
        : current
    ));

    if (!correct) {
      const selected = items.find((item) => item.id === selectedSterileId);
      setFeedback({
        correct: false,
        text: `${selected?.label ?? "선택한 기구"}의 역할을 다시 확인하세요. 기구 모양과 사용 목적을 함께 비교해야 합니다.`,
      });
      return;
    }

    setRolePlacements((current) => ({ ...current, [role]: selectedSterileId }));
    setSelectedSterileId(null);
    setFeedback({ correct: true, text: "기구의 역할과 수술 순서를 정확히 연결했습니다." });
  }

  function handleRequestedTool(itemId: string) {
    if (phase !== "handoff" || !requestVisible || !activeRequest) return;
    const correct = itemId === activeRequest.itemId;
    setRequestJudgments((current) => (
      current.length === requestIndex ? [...current, correct] : current
    ));
    if (!correct) {
      setUrgency((current) => Math.min(100, current + 15));
      setFeedback({ correct: false, text: "요청한 기구와 다릅니다. 이름과 역할을 다시 확인해 안전하게 전달하세요." });
      return;
    }
    setFeedback({ correct: true, text: `${activeRequest.label} 요청에 맞는 기구를 안전하게 전달했습니다.` });
    setRequestVisible(false);
    setUrgency((current) => Math.max(8, current - 18));
    if (requestIndex === activeRoles.length - 1) {
      setPhase("incident");
      return;
    }
    setRequestIndex((current) => current + 1);
  }

  function handleSterileIncident(choice: "reuse" | "replace") {
    const correct = choice === "replace";
    if (incidentFirstCorrect === null) setIncidentFirstCorrect(correct);
    if (!correct) {
      setFeedback({ correct: false, text: "멸균 영역 밖으로 나온 기구는 다시 사용할 수 없습니다. 환자 감염을 막기 위해 새 기구가 필요합니다." });
      return;
    }
    setFeedback({ correct: true, text: "오염 가능 기구를 격리하고 새 멸균 기구로 교체했습니다." });
    setPhase("count");
  }

  function inspectCountLocation(location: "floor" | "bin" | "drape") {
    const correct = location === "drape";
    if (countFirstCorrect === null) setCountFirstCorrect(correct);
    if (!correct) {
      setFeedback({ correct: false, text: "아직 거즈 수가 맞지 않습니다. 수술포와 기구대 주변을 차례로 다시 확인하세요." });
      return;
    }
    setMissingGauzeFound(true);
    setPhase("complete");
    setFeedback({ correct: true, text: "수술포 아래에서 남은 거즈를 찾아 사용 5개·회수 5개가 일치합니다." });
  }

  return (
    <AppScreen
      title="수술실"
      subtitle="멸균선을 지켜라"
      tone="surgical"
    >
      {!started ? (
        <section className={styles.briefing}>
          <div className={styles.hero}>
            <Image
              className={styles.heroImage}
              src="/assets/nurse/surgery-room-v1.webp"
              alt="수술 전 간호사가 멸균 기구 트레이를 준비하는 장면"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1180px"
            />
            <div className={styles.heroShade} />
            <div className={styles.heroCopy}>
              <span>MISSION 04 · OPERATING ROOM</span>
              <strong>준비하고, 전달하고<br />끝까지 확인하세요</strong>
              <p>멸균 준비부터 팀 요청, 돌발 오염과 마지막 카운트까지 직접 대응합니다.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>준비</span><strong>멸균 판정 + 역할 조립</strong></p>
            <p><span>수술 중</span><strong>팀 요청 + 돌발상황 + 카운트</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>수술 준비 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} data-phase={phase} aria-label="수술실 준비와 협업 시뮬레이션">
          <div className={styles.statusBar}>
            <p><span>STERILE SETUP</span><strong>{Object.keys(placements).length} / {items.length}</strong></p>
            <div className={styles.progressTrack}><i style={{ width: `${(Object.keys(placements).length / items.length) * 100}%` }} /></div>
          </div>

          <div className={styles.scene}>
            <Image
              className={styles.sceneImage}
              src="/assets/nurse/surgery-room-v1.webp"
              alt="멸균 트레이를 준비하는 수술실"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 1180px"
            />
            <div
              className={styles.sterileZone}
              data-surgical-destination="sterile"
              data-active={selectedId !== null}
              onClick={() => {
                const item = items.find((candidate) => candidate.id === selectedId);
                if (item) placeItem(item, "sterile");
              }}
            >
              <span>STERILE FIELD</span>
              <strong>멸균 트레이</strong>
              <small>기구 사이를 띄우고 손잡이가 같은 방향을 보도록 준비합니다.</small>
              <div className={styles.placedItems}>
                {items.filter((item) => placements[item.id] === "sterile").map((item) => (
                  <figure key={item.id} className={styles.placedTool}>
                    <SurgicalToolVisual itemId={item.id} />
                    <figcaption>{item.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div
              className={styles.isolateZone}
              data-surgical-destination="isolate"
              data-active={selectedId !== null}
              onClick={() => {
                const item = items.find((candidate) => candidate.id === selectedId);
                if (item) placeItem(item, "isolate");
              }}
            >
              <span>HOLD</span>
              <strong>격리 구역</strong>
              <div className={styles.placedItems}>
                {items.filter((item) => placements[item.id] === "isolate").map((item) => (
                  <figure key={item.id} className={styles.placedTool}>
                    <SurgicalToolVisual itemId={item.id} />
                    <figcaption>{item.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.supplyPanel}>
            <div className={styles.supplyHeader}>
              <p><span>SUPPLY CART</span><strong>{completed ? "준비 완료" : "물품을 직접 옮기세요"}</strong></p>
              <small>끌기 어렵다면 물품을 누른 뒤 구역을 누르세요.</small>
            </div>
            <p className={styles.roleGuide}>
              <span>간호사의 역할</span>
              <strong>{selectedId ? items.find((item) => item.id === selectedId)?.label : "도구를 선택해 역할을 알아보세요"}</strong>
              <small>{selectedId ? TOOL_PURPOSE[selectedId] : "수술 전 기구의 수량·포장·멸균 상태를 확인하고 사용 순서에 맞게 준비합니다."}</small>
            </p>
            <div className={styles.itemRail}>
              {remainingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.item}
                  data-selected={selectedId === item.id}
                  data-dragging={draggingId === item.id}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(event) => handlePointerUp(event, item)}
                  onPointerCancel={() => { setDraggingId(null); setDragPoint(null); }}
                >
                  <SurgicalToolVisual itemId={item.id} />
                  <span className={styles.itemCopy}>
                    <i aria-hidden="true">{String(items.indexOf(item) + 1).padStart(2, "0")}</i>
                    <strong>{item.label}</strong>
                    <small>{item.caption}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {feedback ? <p className={styles.feedback} data-correct={feedback.correct} role="status">{feedback.text}</p> : null}

          {completed ? (
            <section className={styles.assemblyPanel} aria-label="수술 기구 역할별 트레이 조립">
              <header className={styles.assemblyHeader}>
                <span>STEP 02 · ROLE ASSEMBLY</span>
                <strong>멸균 기구를 사용 목적에 맞게 다시 배치하세요.</strong>
                <small>기구 선택 → 역할 슬롯 선택 순서로 진행합니다.</small>
              </header>
              <div className={styles.sterileRack}>
                {sterileItems
                  .filter((item) => !Object.values(rolePlacements).includes(item.id))
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-selected={selectedSterileId === item.id}
                      onClick={() => {
                        setSelectedSterileId((current) => current === item.id ? null : item.id);
                        setFeedback(null);
                      }}
                    >
                      <SurgicalToolVisual itemId={item.id} />
                      <strong>{item.label}</strong>
                    </button>
                  ))}
              </div>
              <div className={styles.roleSlots}>
                {activeRoles.map((role) => {
                  const placedItem = items.find((item) => item.id === rolePlacements[role.id]);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      data-filled={Boolean(placedItem)}
                      data-active={selectedSterileId !== null}
                      onClick={() => placeSterileRole(role.id)}
                    >
                      <span>{role.label}</span>
                      <strong>{placedItem?.label ?? "기구를 배치하세요"}</strong>
                      <small>{role.caption}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {assemblyCompleted ? (
            <div className={styles.completePanel}>
              <p><span>STERILE FIELD READY</span><strong>준비가 끝났습니다. 이제 수술팀의 실시간 요청에 대응하세요.</strong></p>
              <PrimaryButton onClick={() => { setPhase("handoff"); setFeedback(null); }}>수술팀 호출 시작</PrimaryButton>
            </div>
          ) : null}

          {phase === "handoff" ? (
            <section className={styles.handoffStage} aria-label="수술팀 기구 요청 대응">
              <Image className={styles.handoffImage} src="/assets/nurse/surgery-room-v1.webp" alt="수술팀이 기구를 요청하는 수술실" fill priority sizes="(max-width:760px) 100vw, 1180px" />
              <div className={styles.handoffShade} />
              <div className={styles.requestConsole} data-live={requestVisible}>
                <p><span>LIVE REQUEST {String(requestIndex + 1).padStart(2, "0")}</span><strong>{requestVisible && activeRequest ? `“${activeRequest.label} 기구 주세요.”` : "수술팀 요청을 기다리는 중…"}</strong></p>
                <div className={styles.urgencyMeter}><i style={{ width: `${urgency}%` }} /></div>
                <small>요청 대기 시간이 길어지면 긴급도가 올라갑니다.</small>
              </div>
              <div className={styles.handoffTray}>
                {sterileItems.map((item) => (
                  <button key={item.id} type="button" disabled={!requestVisible} onClick={() => handleRequestedTool(item.id)}>
                    <SurgicalToolVisual itemId={item.id} />
                    <strong>{item.label}</strong>
                    <small>{TOOL_PURPOSE[item.id]}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {phase === "incident" ? (
            <section className={styles.incidentStage} aria-label="멸균 영역 이탈 돌발상황">
              <div>
                <span>STERILE FIELD BROKEN</span>
                <strong>전달 중 지혈겸자가 멸균 영역 밖으로 떨어졌습니다.</strong>
                <p>수술은 계속 진행 중입니다. 환자 감염을 막기 위해 즉시 행동하세요.</p>
              </div>
              <button type="button" onClick={() => handleSterileIncident("reuse")}><strong>닦아서 다시 사용</strong><small>시간을 아끼기 위해 즉시 전달</small></button>
              <button type="button" onClick={() => handleSterileIncident("replace")}><strong>오염 기구 격리·교체</strong><small>새 멸균 기구를 열어 전달</small></button>
            </section>
          ) : null}

          {phase === "count" || phase === "complete" ? (
            <section className={styles.countStage} data-complete={missingGauzeFound} aria-label="수술 종료 거즈 카운트">
              <header>
                <span>FINAL SAFETY COUNT</span>
                <strong>사용 5개 · 회수 {missingGauzeFound ? 5 : 4}개</strong>
                <p>{missingGauzeFound ? "카운트가 일치합니다. 수술 종료를 보고할 수 있습니다." : "거즈 1개가 보이지 않습니다. 수술실 환경을 직접 확인하세요."}</p>
              </header>
              <div className={styles.countScene}>
                <Image src="/assets/nurse/surgery-room-v1.webp" alt="거즈 카운트를 확인하는 수술실" fill priority sizes="(max-width:760px) 100vw, 1180px" />
                <button type="button" disabled={missingGauzeFound} onClick={() => inspectCountLocation("floor")}><span>바닥</span><strong>확인</strong></button>
                <button type="button" disabled={missingGauzeFound} onClick={() => inspectCountLocation("bin")}><span>폐기통</span><strong>확인</strong></button>
                <button type="button" disabled={missingGauzeFound} onClick={() => inspectCountLocation("drape")}><span>수술포 아래</span><strong>확인</strong></button>
              </div>
              {phase === "complete" ? (
                <div className={styles.surgeryDebrief}>
                  <p><span>당신의 간호 판단</span><strong>준비 · 협업 · 멸균 · 카운트를 모두 연결했습니다.</strong><small>수술실 간호사는 기구를 전달하는 사람을 넘어, 오염과 누락을 막아 환자 안전을 지킵니다.</small></p>
                  <PrimaryButton onClick={handleFinish}>수술 안전 결과 확인</PrimaryButton>
                </div>
              ) : null}
            </section>
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
