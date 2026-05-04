type CuteSoundKind = 'receive' | 'send' | 'ready'

type NoteStep = {
  frequency: number
  duration: number
  gain: number
}

const SOUND_PATTERNS: Record<CuteSoundKind, { wave: OscillatorType; steps: NoteStep[] }> = {
  receive: {
    wave: 'sine',
    steps: [
      { frequency: 880, duration: 0.09, gain: 0.12 },
      { frequency: 1175, duration: 0.11, gain: 0.11 },
    ],
  },
  send: {
    wave: 'triangle',
    steps: [
      { frequency: 659, duration: 0.08, gain: 0.13 },
      { frequency: 784, duration: 0.1, gain: 0.12 },
    ],
  },
  ready: {
    wave: 'triangle',
    steps: [
      { frequency: 262, duration: 0.09, gain: 0.15 },
      { frequency: 523, duration: 0.1, gain: 0.16 },
      { frequency: 659, duration: 0.1, gain: 0.15 },
      { frequency: 784, duration: 0.16, gain: 0.14 },
    ],
  },
}

let sharedAudioContext: AudioContext | null = null
const playedCuteSoundKeys = new Set<string>()

function getAudioContext() {
  if (typeof window === 'undefined') return null

  const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

  if (!AudioContextCtor) return null

  const audioContext = sharedAudioContext ?? new AudioContextCtor()
  sharedAudioContext = audioContext

  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => undefined)
  }

  return audioContext
}

export function playCuteSound(kind: CuteSoundKind) {
  const audioContext = getAudioContext()
  if (!audioContext) return

  const pattern = SOUND_PATTERNS[kind]
  const destination = audioContext.destination
  let currentTime = audioContext.currentTime + 0.01

  for (const step of pattern.steps) {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = pattern.wave
    oscillator.frequency.setValueAtTime(step.frequency, currentTime)
    oscillator.connect(gainNode)
    gainNode.connect(destination)

    gainNode.gain.setValueAtTime(0.0001, currentTime)
    gainNode.gain.exponentialRampToValueAtTime(step.gain, currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + step.duration)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + step.duration + 0.03)

    currentTime += step.duration + 0.02
  }
}

export function playCuteSoundOnce(kind: CuteSoundKind, key: string) {
  if (playedCuteSoundKeys.has(key)) return

  playedCuteSoundKeys.add(key)
  playCuteSound(kind)
}
