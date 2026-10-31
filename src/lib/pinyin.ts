/** Pinyin grading for the TYPE activity. Display form uses tone marks; input may use numbers. */

const MARK: Record<string, [string, number]> = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4],
  ń: ['n', 2], ň: ['n', 3], ǹ: ['n', 4],
}

export interface Syllable {
  base: string
  tone: number
  raw: string
}

export type Grade = 'correct' | 'tone' | 'wrong' | 'incomplete'

export interface PinyinGrade {
  grade: Grade
  cells: { ch: string; state: 'ok' | 'bad' | 'tone' | 'empty' | 'extra' }[]
}

function normalizeToken(raw: string): Syllable | null {
  let s = raw.trim().toLowerCase().replace(/u:/g, 'v').replace(/ü/g, 'v')
  if (!s) return null
  let tone = 0
  const out: string[] = []
  const m = s.match(/[1-5]$/)
  if (m && !/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(s)) {
    tone = Number(m[0])
    if (tone === 5) tone = 0
    s = s.slice(0, -1)
  }
  for (const ch of s) {
    const hit = MARK[ch]
    if (hit) {
      out.push(hit[0])
      tone = hit[1]
    } else if (/[a-z]/.test(ch)) {
      out.push(ch)
    }
  }
  const base = out.join('')
  if (!base) return null
  return { base, tone, raw }
}

function tokensOf(chunk: string): Syllable[] {
  const hasMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ]/.test(chunk)
  if (!hasMark && /[1-5]/.test(chunk)) {
    return chunk
      .split(/(?<=[1-5])/)
      .map(normalizeToken)
      .filter((s): s is Syllable => !!s)
  }
  const one = normalizeToken(chunk)
  return one ? [one] : []
}

export function syllablesOf(input: string): Syllable[] {
  return input
    .trim()
    .toLowerCase()
    .split(/[\s,，'’·]+/)
    .filter(Boolean)
    .flatMap(tokensOf)
}

/** Tone-off typing often omits spaces: youyong for yóu yǒng. */
function splitBlob(blob: string, target: Syllable[]): Syllable[] | null {
  let rest = blob
  const out: Syllable[] = []
  for (const t of target) {
    if (!rest.startsWith(t.base)) return null
    rest = rest.slice(t.base.length)
    out.push({ base: t.base, tone: 0, raw: t.base })
  }
  return rest ? null : out
}

function compact(sylls: Syllable[], withTone: boolean): string {
  return sylls.map((s) => s.base + (withTone && s.tone ? String(s.tone) : '')).join('')
}

export function gradePinyin(input: string, targetDisplay: string, toneMode: 'number' | 'none'): PinyinGrade {
  const target = syllablesOf(targetDisplay)
  let got = syllablesOf(input)
  if (got.length === 1 && target.length > 1 && got[0].tone === 0) {
    const split = splitBlob(got[0].base, target)
    if (split) got = split
  }
  const wantTone = toneMode === 'number'
  const targetCompact = compact(target, true)
  const cells: PinyinGrade['cells'] = []

  const n = Math.max(target.length, got.length)
  let basesOk = target.length > 0 && target.length === got.length
  let tonesOk = true
  for (let i = 0; i < n; i++) {
    const t = target[i]
    const g = got[i]
    if (!t) {
      for (const ch of (g?.base || '') + (g?.tone ? String(g.tone) : '')) cells.push({ ch, state: 'extra' })
      basesOk = false
      continue
    }
    const tChars = [...t.base, ...(wantTone && t.tone ? [String(t.tone)] : [])]
    const gChars = g ? [...g.base, ...(g.tone ? [String(g.tone)] : [])] : []
    if (!g || g.base !== t.base) basesOk = false
    if (!g || g.tone !== t.tone) tonesOk = false
    tChars.forEach((ch, k) => {
      const have = gChars[k]
      if (have == null) cells.push({ ch: '·', state: 'empty' })
      else if (have !== ch) {
        const toneSlot = wantTone && t.tone && k === tChars.length - 1 && /\d/.test(ch)
        cells.push({ ch: have, state: toneSlot && g?.base === t.base ? 'tone' : 'bad' })
      } else cells.push({ ch: have, state: 'ok' })
    })
    if (g && gChars.length > tChars.length) {
      gChars.slice(tChars.length).forEach((ch) => cells.push({ ch, state: 'extra' }))
    }
  }

  let grade: Grade
  if (!input.trim() || got.length === 0) grade = 'incomplete'
  else if (basesOk && (!wantTone || tonesOk)) grade = 'correct'
  else if (basesOk && wantTone && !tonesOk) grade = 'tone'
  else if (got.length < target.length && compact(got, true) === targetCompact.slice(0, compact(got, true).length)) grade = 'incomplete'
  else grade = 'wrong'

  return { grade, cells }
}

/** Loose key used to reject homophone distractors. */
export function pinyinKey(display: string): string {
  return syllablesOf(display).map((s) => s.base).join(' ')
}
