/**
 * A short, pleasant completion chime built with the Web Audio API.
 * No audio files, no network, no cost.
 */
export function playCompletionChime(): void {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const ctx = new AudioCtor()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.12 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.45)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(now + index * 0.12)
      oscillator.stop(now + index * 0.12 + 0.5)
    })
    window.setTimeout(() => ctx.close(), 1200)
  } catch {
    /* autoplay policies or no audio device — silently ignore */
  }
}
