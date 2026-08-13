/**
 * 시간 표시 계산 파일.
 *
 * 미션에 걸린 시간을 재거나, 남은 시간을 보여줄 때 씁니다.
 * 여기에는 화면 코드가 없습니다. 숫자 계산만 있습니다.
 *
 * ⛔ 코덱스(디자인 담당 AI)는 이 파일을 절대 수정하면 안 됩니다.
 */

/** 밀리초를 "분:초" 모양으로 바꿉니다. 예: 83000 → "1:23" */
export function formatDuration(milliseconds: number): string {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 시작한 뒤로 얼마나 지났는지(밀리초). */
export function elapsedMs(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt);
}

/** 제한 시간까지 얼마나 남았는지(밀리초). 다 쓰면 0. */
export function remainingMs(
  startedAt: number,
  limitMs: number,
  now: number,
): number {
  return Math.max(0, limitMs - elapsedMs(startedAt, now));
}

/** 제한 시간을 다 썼는지. */
export function isTimeUp(
  startedAt: number,
  limitMs: number,
  now: number,
): boolean {
  return remainingMs(startedAt, limitMs, now) <= 0;
}

/**
 * 진행 막대에 쓸 비율(0~1).
 * 시간이 지날수록 1에 가까워집니다.
 */
export function progressRatio(
  startedAt: number,
  limitMs: number,
  now: number,
): number {
  if (limitMs <= 0) return 1;
  return Math.min(1, elapsedMs(startedAt, now) / limitMs);
}

/** 오늘 날짜를 "2026년 8월 13일" 모양으로 만듭니다. 수료증에 씁니다. */
export function formatCertificateDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}
