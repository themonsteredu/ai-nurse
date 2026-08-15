type UiSound = "tap" | "enabled" | "instrument" | "warning" | "success" | "transition";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return null;

  audioContext ??= new AudioContextClass();
  return audioContext;
}

/**
 * 버튼 조작이 실제로 들리도록 짧고 차분한 의료 대시보드 톤을 재생합니다.
 * 파일 다운로드 없이 Web Audio를 사용하므로 첫 사용자 조작부터 동작합니다.
 */
export function playUiSound(sound: UiSound) {
  const context = getAudioContext();
  if (context === null) return;

  void context.resume().then(() => {
    const now = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.type = sound === "warning" ? "triangle" : "sine";
    const frequency = {
      tap: 480,
      enabled: 620,
      instrument: 740,
      warning: 310,
      success: 660,
      transition: 420,
    }[sound];
    const duration = {
      tap: 0.08,
      enabled: 0.17,
      instrument: 0.11,
      warning: 0.22,
      success: 0.19,
      transition: 0.13,
    }[sound];

    oscillator.frequency.setValueAtTime(frequency, now);
    if (sound === "enabled" || sound === "success") {
      oscillator.frequency.exponentialRampToValueAtTime(sound === "success" ? 920 : 820, now + 0.11);
    } else if (sound === "warning") {
      oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.18);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound === "enabled" ? 0.075 : 0.035, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.07, duration - 0.01));

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  });
}
