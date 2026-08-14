type UiSound = "tap" | "enabled";

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

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(sound === "enabled" ? 620 : 480, now);
    if (sound === "enabled") {
      oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.11);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound === "enabled" ? 0.075 : 0.035, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (sound === "enabled" ? 0.16 : 0.07));

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + (sound === "enabled" ? 0.17 : 0.08));
  });
}
