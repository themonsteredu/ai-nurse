"use client";

/**
 * 학생 한 명의 진행 상황을 화면들 사이에서 공유하는 파일.
 *
 * ★ 중요: 여기 담긴 내용은 브라우저 메모리에만 있습니다.
 *   서버로 보내지 않고, 저장하지도 않습니다.
 *   새로고침하거나 창을 닫으면 즉시 사라집니다.
 *   (학교 반입 시 개인정보 승인 절차를 피하기 위한 의도적인 설계입니다.)
 *
 * 실제 계산은 전부 lib/session.ts 가 합니다.
 * 이 파일은 그 결과를 화면에 전달하는 통로 역할만 합니다.
 *
 * ✅ 코덱스(디자인 담당 AI)에게: 이 파일은 화면 생김새와 관계없습니다.
 *    화면을 새로 만들 때도 useSession() 을 그대로 쓰면 됩니다.
 */

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Difficulty, MissionId, MissionResult } from "@/data/types";
import {
  createSession,
  markMissionUnlocked,
  recordMissionResult,
  type SessionState,
} from "@/lib/session";

type SessionContextValue = {
  /** 지금 진행 중인 체험. 아직 시작 안 했으면 null. */
  session: SessionState | null;
  /** 소리를 켰는지. 교실 사용을 위해 기본은 꺼짐입니다. */
  soundEnabled: boolean;
  /** 시작 화면에서 이름과 난이도를 받아 체험을 시작합니다. */
  startSession: (studentName: string, difficulty: Difficulty) => void;
  /** 미션 성적을 기록합니다. */
  saveMissionResult: (result: MissionResult) => void;
  /** 통과 코드를 맞게 넣었을 때 호출합니다. */
  unlockMission: (missionId: MissionId) => void;
  /** 소리 켜기/끄기 */
  toggleSound: () => void;
  /** 처음부터 다시 시작합니다. */
  resetSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null);

  // 교실에서 30대가 동시에 소리 나면 안 되므로 기본은 음소거입니다.
  const [soundEnabled, setSoundEnabled] = useState(false);

  const startSession = useCallback(
    (studentName: string, difficulty: Difficulty) => {
      setSession(createSession(studentName, difficulty));
    },
    [],
  );

  const saveMissionResult = useCallback((result: MissionResult) => {
    setSession((current) =>
      current === null ? current : recordMissionResult(current, result),
    );
  }, []);

  const unlockMission = useCallback((missionId: MissionId) => {
    setSession((current) =>
      current === null ? current : markMissionUnlocked(current, missionId),
    );
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => !current);
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      soundEnabled,
      startSession,
      saveMissionResult,
      unlockMission,
      toggleSound,
      resetSession,
    }),
    [
      session,
      soundEnabled,
      startSession,
      saveMissionResult,
      unlockMission,
      toggleSound,
      resetSession,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** 화면에서 진행 상황을 읽고 쓸 때 씁니다. */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error(
      "useSession() 은 SessionProvider 안에서만 쓸 수 있습니다. app/layout.tsx 를 확인하세요.",
    );
  }
  return context;
}

/**
 * 체험을 시작하지 않은 상태로 이 화면에 들어오면 시작 화면으로 되돌립니다.
 *
 * 학생이 새로고침하면 진행 상황이 사라지는데,
 * 그때 빈 화면이 나오지 않고 처음부터 다시 시작하게 만듭니다.
 */
export function useRequireSession(): SessionState | null {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/");
  }, [session, router]);

  return session;
}
