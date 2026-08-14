"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<DragPoint | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const dragOriginRef = useRef<DragPoint | null>(null);

  if (session === null) return null;

  const difficulty = session.difficulty;
  const items = getSurgicalItems(difficulty);
  const remainingItems = items.filter((item) => placements[item.id] === undefined);
  const completed = remainingItems.length === 0;

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
    const correct = Object.values(firstJudgments).filter(Boolean).length;
    saveMissionResult(buildMissionResult(
      "operatingRoom",
      { correct, total: items.length },
      difficulty,
    ));
    router.push("/unlock/operatingRoom");
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
              <strong>기구를 알아보고<br />멸균 트레이를 완성하세요</strong>
              <p>실제 도구의 형태와 역할을 확인한 뒤 알맞은 위치에 배치하세요.</p>
            </div>
          </div>
          <div className={styles.briefingBar}>
            <p><span>목표</span><strong>{items.length}개 물품 분류</strong></p>
            <p><span>조작</span><strong>끌기 + 눌러 놓기</strong></p>
            <PrimaryButton onClick={() => setStarted(true)}>수술 준비 시작</PrimaryButton>
          </div>
        </section>
      ) : (
        <section className={styles.activity} aria-label="수술 기구 멸균 분류 활동">
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
            <div className={styles.completePanel}>
              <p><span>STERILE FIELD READY</span><strong>수술 전 안전 준비가 끝났습니다.</strong></p>
              <PrimaryButton onClick={handleFinish}>결과 확인</PrimaryButton>
            </div>
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
