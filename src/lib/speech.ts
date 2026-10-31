export type VoiceKind = 'zh-TW' | 'zh-fallback' | 'default' | 'missing'

export function pickVoice(): { voice: SpeechSynthesisVoice | null; kind: VoiceKind } {
  if (typeof speechSynthesis === 'undefined') return { voice: null, kind: 'missing' }
  const voices = speechSynthesis.getVoices()
  const tw = voices.find((v) => /zh[-_]TW/i.test(v.lang) || /taiwan/i.test(v.name))
  if (tw) return { voice: tw, kind: 'zh-TW' }
  const zh = voices.find((v) => v.lang.toLowerCase().startsWith('zh'))
  if (zh) return { voice: zh, kind: 'zh-fallback' }
  return { voice: voices[0] || null, kind: voices.length ? 'default' : 'missing' }
}

export function speak(text: string, rate = 0.95): VoiceKind {
  if (typeof speechSynthesis === 'undefined' || !text) return 'missing'
  const u = new SpeechSynthesisUtterance(text)
  const { voice, kind } = pickVoice()
  u.lang = voice?.lang || 'zh-TW'
  u.rate = rate
  if (voice) u.voice = voice
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
  return kind
}

export function stopSpeak() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
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
