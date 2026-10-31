import { SAMPLE_LESSONS, THEME_COLORS } from './sample'
import type { Choice, Island, Item, LessonFile, Question, Save, Skill, Template } from './types'

export const ACTIVITY_LIST: { id: Template; zh: string; en: string; skill: Skill }[] = [
  { id: 'FLASH', zh: '字卡', en: 'Flashcards', skill: 'recognize' },
  { id: 'RECOGNIZE', zh: '認字', en: 'Recognize', skill: 'recognize' },
  { id: 'TYPE', zh: '拼音打字', en: 'Pinyin typing', skill: 'type' },
  { id: 'STROKE', zh: '筆順', en: 'Stroke order', skill: 'stroke' },
  { id: 'LISTEN', zh: '聽力', en: 'Listening', skill: 'listen' },
  { id: 'SPEAK', zh: '發音', en: 'Speaking', skill: 'speak' },
  { id: 'MATCH', zh: '配對', en: 'Match', skill: 'recognize' },
  { id: 'STORY', zh: '故事', en: 'Story', skill: 'listen' },
  { id: 'ORDER', zh: '排句子', en: 'Order the sentence', skill: 'recognize' },
  { id: 'QUIZ', zh: '小測驗', en: 'Quiz', skill: 'recognize' },
]

const THEME_CYCLE = Object.keys(THEME_COLORS)

export function itemsFromLesson(lesson: LessonFile, lessonId: string): Item[] {
  const items: Item[] = []
  for (const c of lesson.characters ?? []) {
    if (!c?.char) continue
    items.push({
      id: `char:${c.char}`,
      kind: 'char',
      text: c.char,
      pinyin: c.pinyin || '',
      zhuyin: c.zhuyin || '',
      en: c.en || '',
      lessonId,
    })
  }
  for (const w of [...(lesson.words ?? []), ...(lesson.supplementary_words ?? [])]) {
    if (!w?.word) continue
    items.push({
      id: `word:${w.word}`,
      kind: 'word',
      text: w.word,
      pinyin: w.pinyin || '',
      zhuyin: w.zhuyin || '',
      en: w.en || '',
      lessonId,
    })
  }
  return items
}

export function islandsFromSave(save: Pick<Save, 'uploads' | 'packLessons'>): Island[] {
  const groups: { lesson: LessonFile; source: 'builtin' | 'pack' | 'upload' }[] = [
    ...SAMPLE_LESSONS.map((lesson) => ({ lesson, source: 'builtin' as const })),
    ...(save.packLessons ?? []).map((lesson) => ({ lesson, source: 'pack' as const })),
    ...(save.uploads ?? []).map((lesson) => ({ lesson, source: 'upload' as const })),
  ]
  return groups.map((g, i) => {
    const theme = g.lesson.theme && THEME_COLORS[g.lesson.theme] ? g.lesson.theme : THEME_CYCLE[i % THEME_CYCLE.length]
    const id =
      g.lesson.islandId ||
      (g.source === 'pack' ? `pack-${g.lesson.lesson ?? i}` : `upload-${g.lesson.lesson ?? i}-${i}`)
    return {
      id,
      number: i + 1,
      titleZh: g.lesson.title?.zh || `島 ${i + 1}`,
      titleEn: g.lesson.title?.en || `Island ${i + 1}`,
      theme,
      parentCreated: g.source !== 'builtin',
      lesson: g.lesson,
    }
  })
}

export function templatesFor(lesson: LessonFile): Template[] {
  const items = itemsFromLesson(lesson, 'x')
  const out: Template[] = []
  if (items.length >= 1) out.push('RECOGNIZE', 'TYPE')
  if (items.some((i) => i.kind === 'char')) out.push('STROKE')
  if (items.length >= 1) out.push('SPEAK', 'LISTEN', 'FLASH')
  if (items.length >= 2) out.push('MATCH', 'QUIZ')
  if ((lesson.text?.sentences?.length ?? 0) > 0) out.push('STORY')
  if ((lesson.example_sentences?.length ?? 0) > 0 || (lesson.text?.sentences?.length ?? 0) > 0) out.push('ORDER')
  return out
}

export function islandScore(island: Island, stars: Record<string, number>) {
  const templates = templatesFor(island.lesson)
  const max = Math.max(1, templates.length * 3)
  const got = templates.reduce((n, t) => n + (stars[`${island.id}:${t}`] || 0), 0)
  return { got, max }
}

export function unlockInfo(island: Island, islands: Island[], stars: Record<string, number>) {
  if (island.parentCreated) return { ok: true, need: 0 }
  const chain = islands.filter((i) => !i.parentCreated)
  const idx = chain.findIndex((i) => i.id === island.id)
  if (idx <= 0) return { ok: true, need: 0 }
  const prev = chain[idx - 1]
  const { got, max } = islandScore(prev, stars)
  const threshold = Math.ceil(max * 0.6)
  if (got >= threshold) return { ok: true, need: 0 }
  return { ok: false, need: threshold - got }
}

export function growthStage(got: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (max <= 0 || got <= 0) return 0
  const p = got / max
  if (p >= 1) return 4
  if (p >= 0.75) return 3
  if (p >= 0.5) return 2
  if (p >= 0.25) return 1
  return 0
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function baseOf(p: string) {
  return p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[1-5]/g, '').replace(/\s+/g, '').toLowerCase()
}

function choicesFor(correct: Item, pool: Item[], show: 'en' | 'zh', n = 4): Choice[] {
  const used = new Set<string>([show === 'en' ? correct.en : correct.text])
  const distractors = shuffle(pool).filter((it) => {
    if (it.id === correct.id) return false
    const label = show === 'en' ? it.en : it.text
    if (!label || used.has(label)) return false
    if (show === 'zh' && baseOf(it.pinyin) && baseOf(it.pinyin) === baseOf(correct.pinyin)) return false
    used.add(label)
    return true
  })
  const picked = [correct, ...distractors.slice(0, n - 1)]
  return shuffle(picked).map((it, i) => ({
    id: `${it.id}-${i}`,
    zh: show === 'zh' ? it.text : it.text,
    en: it.en || '…',
    correct: it.id === correct.id,
  }))
}

function qBase(item: Item, template: Template, skill: Skill, promptZh: string, promptEn: string): Question {
  return {
    id: `${template}-${item.id}-${Math.random().toString(36).slice(2, 7)}`,
    template,
    skill,
    itemId: item.id,
    promptZh,
    promptEn,
    hanzi: item.text,
    pinyin: item.pinyin,
    zhuyin: item.zhuyin,
    en: item.en,
  }
}

export function buildQuestions(island: Island, template: Template, pool: Item[]): Question[] {
  const items = itemsFromLesson(island.lesson, island.id).filter((it) => it.pinyin || it.en || it.text)
  const all = pool.length ? pool : items
  const withEn = items.filter((it) => it.en)
  const source = withEn.length ? withEn : items
  if (!source.length) return []

  if (template === 'FLASH') {
    return shuffle(source).slice(0, 6).map((it) => ({
      ...qBase(it, 'FLASH', 'recognize', '先看字，翻面再想想。', 'Look at the word, then flip the card.'),
      choices: choicesFor(it, all.filter((x) => x.en), 'en'),
    }))
  }
  if (template === 'RECOGNIZE') {
    return shuffle(source).slice(0, 6).map((it) => ({
      ...qBase(it, 'RECOGNIZE', 'recognize', '這個字是什麼意思？', 'What does this mean?'),
      choices: choicesFor(it, all.filter((x) => x.en), 'en'),
    }))
  }
  if (template === 'TYPE') {
    return shuffle(source.filter((it) => it.pinyin)).slice(0, 6).map((it, i) => ({
      ...qBase(
        it,
        'TYPE',
        'type',
        i % 2 === 1 ? '聽一聽，打出拼音。' : '看字，打出拼音。',
        i % 2 === 1 ? 'Listen, then type the pinyin.' : 'Look, then type the pinyin.',
      ),
      hideHanzi: i % 2 === 1,
    }))
  }
  if (template === 'STROKE') {
    return shuffle(items.filter((it) => it.kind === 'char')).slice(0, 4).map((it) =>
      qBase(it, 'STROKE', 'stroke', '跟著筆順寫一寫。', 'Trace the strokes in order.'),
    )
  }
  if (template === 'LISTEN') {
    return shuffle(source).slice(0, 6).map((it) => ({
      ...qBase(it, 'LISTEN', 'listen', '聽一聽，選出你聽到的。', 'Listen and choose what you hear.'),
      hideHanzi: true,
      choices: choicesFor(it, all, 'zh'),
    }))
  }
  if (template === 'SPEAK') {
    return shuffle(source).slice(0, 4).map((it) =>
      qBase(it, 'SPEAK', 'speak', '先聽標準國語，再跟著說。', 'Listen to Taiwan Mandarin, then say it.'),
    )
  }
  if (template === 'MATCH') {
    const set = shuffle(source.filter((it) => it.en)).slice(0, 4)
    if (set.length < 2) return []
    return [
      {
        ...qBase(set[0], 'MATCH', 'recognize', '把字和英文連起來。', 'Match each word with its English.'),
        choices: set.map((it, i) => ({ id: it.id + i, zh: it.text, en: it.en, correct: true })),
      },
    ]
  }
  if (template === 'STORY') {
    const lines = island.lesson.text?.sentences ?? []
    if (!lines.length) return []
    const focus = lines[Math.min(1, lines.length - 1)]
    const enPool = lines.map((l) => l.en).filter(Boolean) as string[]
    const correctEn = focus.en || ''
    const distract = enPool.filter((e) => e !== correctEn).slice(0, 3)
    while (distractsNeed(distract) && enPool.length) break
    const extra = ['A little island in the sea.', 'The star hops onto the bridge.', 'Someone cooks dinner.', 'A boat waits by the sand.']
    const options = shuffle([correctEn, ...distract, ...extra]).filter(Boolean)
    const uniq: string[] = []
    for (const e of options) if (e && !uniq.includes(e)) uniq.push(e)
    const four = uniq.slice(0, 4)
    if (correctEn && !four.includes(correctEn)) four[0] = correctEn
    return [
      {
        ...qBase(source[0], 'STORY', 'listen', '讀一讀，再回答。', 'Read, then answer.'),
        lines,
        choices: shuffle(four).map((en, i) => ({ id: 's' + i, zh: '', en, correct: en === correctEn })),
        promptZh: '這句話是什麼意思？',
        promptEn: 'What does this sentence mean?',
        hanzi: focus.zh,
        en: correctEn,
      },
    ]
  }
  if (template === 'ORDER') {
    const raw = island.lesson.example_sentences?.[0]?.zh || island.lesson.text?.sentences?.[0]?.zh || ''
    const chunks = raw.split(/[，,]/).map((s) => s.replace(/[。！？]/g, '').trim()).filter(Boolean)
    const parts = chunks.length >= 2 ? chunks : raw.length >= 8 ? [raw.slice(0, Math.floor(raw.length / 2)), raw.slice(Math.floor(raw.length / 2)).replace(/[。]/g, '')] : []
    if (parts.length < 2) return []
    return [
      {
        ...qBase(source[0], 'ORDER', 'recognize', '把詞卡排成句子。', 'Put the pieces in order.'),
        chunks: parts,
        hanzi: parts.join('，'),
      },
    ]
  }
  if (template === 'QUIZ') {
    const bag = shuffle(source).slice(0, 7)
    return bag.map((it, i) => {
      const listen = i % 2 === 1
      return {
        ...qBase(
          it,
          'QUIZ',
          listen ? 'listen' : 'recognize',
          listen ? '聽一聽，選出你聽到的。' : '這個字是什麼意思？',
          listen ? 'Listen and choose what you hear.' : 'What does this mean?',
        ),
        hideHanzi: listen,
        choices: choicesFor(it, all.filter((x) => (listen ? x.text : x.en)), listen ? 'zh' : 'en'),
      }
    })
  }
  return []
}

function distractsNeed(d: string[]) {
  return d.length >= 3
}

export function buildAdventure(
  islands: Island[],
  cards: Record<string, { due: string; priority?: boolean }>,
  today: string,
  newCap: number,
  stars: Record<string, number> = {},
): Question[] {
  const use = islands.filter((isl) => unlockInfo(isl, islands, stars).ok)
  const pool = use.flatMap((isl) => itemsFromLesson(isl.lesson, isl.id))
  const byId = new Map(pool.map((it) => [it.id, it]))
  const dueIds: string[] = []
  for (const [key, card] of Object.entries(cards)) {
    const itemId = key.slice(0, key.lastIndexOf('|'))
    if (!byId.has(itemId)) continue
    if (card.priority || card.due <= today) dueIds.push(itemId)
  }
  const fresh = pool.filter((it) => !Object.keys(cards).some((k) => k.startsWith(it.id + '|')))
  const picked: Item[] = []
  const seen = new Set<string>()
  for (const id of shuffle(dueIds)) {
    if (seen.has(id) || !byId.has(id)) continue
    seen.add(id)
    picked.push(byId.get(id)!)
    if (picked.length >= 8) break
  }
  let added = 0
  for (const it of shuffle(fresh)) {
    if (seen.has(it.id)) continue
    if (added >= newCap) break
    seen.add(it.id)
    picked.push(it)
    added++
  }
  for (const it of shuffle(pool)) {
    if (picked.length >= Math.min(5, newCap)) break
    if (seen.has(it.id)) continue
    seen.add(it.id)
    picked.push(it)
  }
  const questions: Question[] = []
  const skills: Template[] = ['RECOGNIZE', 'TYPE', 'LISTEN', 'SPEAK', 'STROKE']
  picked.forEach((it, i) => {
    let template = skills[i % skills.length]
    if (template === 'STROKE' && it.kind !== 'char') template = 'RECOGNIZE'
    const island = use.find((isl) => isl.id === it.lessonId) || use[0]
    if (!island) return
    const made = buildQuestions({ ...island, lesson: singleItemLesson(island.lesson, it) }, template, pool)
    if (made[0]) questions.push(made[0])
  })
  return questions.slice(0, 10)
}

function singleItemLesson(lesson: LessonFile, it: Item): LessonFile {
  if (it.kind === 'char') {
    return { ...lesson, characters: [{ char: it.text, pinyin: it.pinyin, zhuyin: it.zhuyin, en: it.en }], words: [], supplementary_words: [] }
  }
  return { ...lesson, characters: [], words: [{ word: it.text, pinyin: it.pinyin, zhuyin: it.zhuyin, en: it.en }], supplementary_words: [] }
}

export function searchIslands(islands: Island[], q: string): Island[] {
  const s = q.trim().toLowerCase()
  if (!s) return islands
  return islands.filter((isl) => {
    const blob = [
      isl.titleZh,
      isl.titleEn,
      ...itemsFromLesson(isl.lesson, isl.id).flatMap((it) => [it.text, it.pinyin, it.zhuyin, it.en]),
    ]
      .join('\n')
      .toLowerCase()
    return blob.includes(s)
  })
}
