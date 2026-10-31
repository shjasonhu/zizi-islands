/**
 * Taiwan Mandarin speech.
 * iPad Safari loads voices asynchronously and fires `voiceschanged`
 * (often with an empty list on the first getVoices() call).
 */

export type VoiceKind = 'zh-TW-enhanced' | 'zh-TW' | 'zh-fallback' | 'default' | 'missing'

export interface VoiceInfo {
  name: string
  lang: string
  voiceURI?: string
}

export interface VoicePick<T extends VoiceInfo = VoiceInfo> {
  voice: T | null
  kind: VoiceKind
}

const ENHANCED = /enhanced|premium|優化|加強/i
const MEIJIA = /meijia|美佳/i

export function isZhTw(voice: VoiceInfo): boolean {
  const blob = `${voice.lang} ${voice.voiceURI || ''} ${voice.name}`
  return /zh[-_]TW/i.test(blob) || /taiwan|台灣/i.test(voice.name)
}

function isChinese(voice: VoiceInfo): boolean {
  return /^zh/i.test(voice.lang) || /zh[-_]/i.test(voice.voiceURI || '')
}

/** Higher is better. Enhanced zh-TW (Meijia first) beats any other Chinese voice. */
export function voiceScore(voice: VoiceInfo): number {
  const blob = `${voice.name} ${voice.voiceURI || ''}`
  const enhanced = ENHANCED.test(blob) || /com\.apple\.voice\.(enhanced|premium)\.zh-TW/i.test(blob)
  if (isZhTw(voice) && enhanced && MEIJIA.test(blob)) return 100
  if (isZhTw(voice) && enhanced) return 90
  if (isZhTw(voice)) return 70
  if (isChinese(voice)) return 40
  return 10
}

export function rankVoices<T extends VoiceInfo>(voices: T[]): VoicePick<T> {
  if (!voices.length) return { voice: null, kind: 'missing' }
  let best = voices[0]
  let bestScore = voiceScore(best)
  for (const voice of voices.slice(1)) {
    const score = voiceScore(voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  const kind: VoiceKind =
    bestScore >= 90 ? 'zh-TW-enhanced' : bestScore >= 70 ? 'zh-TW' : bestScore >= 40 ? 'zh-fallback' : 'default'
  return { voice: best, kind }
}

export const NATURAL_RATE = 0.9
export const NATURAL_PITCH = 1

type SynthVoice = VoiceInfo & { localService?: boolean; default?: boolean }

let hooked = false
let current: VoicePick<SynthVoice> = { voice: null, kind: 'missing' }
const listeners = new Set<(pick: VoicePick<SynthVoice>) => void>()
let speakToken = 0

function synth(): SpeechSynthesis | undefined {
  return typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis
}

export function pickVoice(): VoicePick<SynthVoice> {
  const api = synth()
  if (!api) return { voice: null, kind: 'missing' }
  return rankVoices(api.getVoices())
}

function refreshVoices() {
  current = pickVoice()
  listeners.forEach((fn) => fn(current))
}

/** Subscribe to the best available voice, including the late iPad list. */
export function watchVoices(cb: (pick: VoicePick<SynthVoice>) => void): () => void {
  const api = synth()
  if (api && !hooked) {
    hooked = true
    api.getVoices()
    if (typeof api.addEventListener === 'function') {
      api.addEventListener('voiceschanged', refreshVoices)
    } else {
      const previous = api.onvoiceschanged
      api.onvoiceschanged = (event) => {
        if (typeof previous === 'function') previous.call(api, event)
        refreshVoices()
      }
    }
    window.setTimeout(refreshVoices, 300)
  }
  listeners.add(cb)
  cb(api ? pickVoice() : current)
  return () => listeners.delete(cb)
}

export function speak(text: string, rate = NATURAL_RATE): VoiceKind {
  const api = synth()
  if (!api || !text) return 'missing'
  const picked = pickVoice()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = picked.voice?.lang || 'zh-TW'
  utterance.rate = rate
  utterance.pitch = NATURAL_PITCH
  if (picked.voice) utterance.voice = picked.voice as SpeechSynthesisVoice
  const token = ++speakToken
  api.cancel()
  // iPad drops an utterance that starts in the same turn as cancel().
  window.setTimeout(() => {
    if (token !== speakToken) return
    api.speak(utterance)
  }, 40)
  return picked.kind
}

export function stopSpeak() {
  speakToken += 1
  synth()?.cancel()
}

export function chime(kind: 'ok' | 'star' = 'ok') {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  const ctx = new AC()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = kind === 'ok' ? 620 : 880
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.3)
  o.onended = () => ctx.close()
}

export async function recordClip(ms = 3500): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const rec = new MediaRecorder(stream)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  rec.start()
  await new Promise((r) => setTimeout(r, ms))
  await new Promise<void>((resolve) => {
    rec.onstop = () => resolve()
    rec.stop()
  })
  stream.getTracks().forEach((t) => t.stop())
  return new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
}
