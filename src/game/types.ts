import type { ReviewCard } from '../lib/srs'

export interface Gloss {
  word: string
  pinyin: string
  zhuyin: string
  en?: string | null
}

export interface CharEntry {
  char: string
  pinyin: string
  zhuyin: string
  example_word?: string
  en?: string | null
}

export interface SentLine {
  zh: string
  pinyin?: string
  zhuyin?: string
  en?: string | null
}

/** Lesson JSON the parent can upload. Same shape as the private textbook files. */
export interface LessonFile {
  book?: string
  lesson?: number
  islandId?: string
  original?: boolean
  theme?: string
  title: { zh: string; en?: string | null }
  story?: { title_zh?: string; title_en?: string; text?: string | null }
  characters?: CharEntry[]
  words?: Gloss[]
  supplementary_words?: Gloss[]
  sentence_patterns?: { pattern: string; en?: string | null }[]
  example_sentences?: { zh: string; en?: string | null; pinyin?: string; zhuyin?: string }[]
  text?: { zh_traditional?: string; en?: string | null; sentences?: SentLine[] }
  notes?: string
}

export type Template =
  | 'FLASH'
  | 'RECOGNIZE'
  | 'TYPE'
  | 'STROKE'
  | 'SPEAK'
  | 'LISTEN'
  | 'MATCH'
  | 'STORY'
  | 'QUIZ'
  | 'ORDER'

export type Skill = 'recognize' | 'type' | 'stroke' | 'speak' | 'listen'

export interface Item {
  id: string
  kind: 'char' | 'word'
  text: string
  pinyin: string
  zhuyin: string
  en: string
  lessonId: string
}

export interface Island {
  id: string
  number: number
  titleZh: string
  titleEn: string
  theme: string
  parentCreated: boolean
  lesson: LessonFile
}

export interface Choice {
  id: string
  zh: string
  en: string
  correct: boolean
}

export interface Question {
  id: string
  template: Template
  skill: Skill
  itemId: string
  promptZh: string
  promptEn: string
  hanzi: string
  pinyin: string
  zhuyin: string
  en: string
  hideHanzi?: boolean
  choices?: Choice[]
  lines?: SentLine[]
  chunks?: string[]
  requeue?: boolean
}

export interface Avatar {
  nickname: string
  hair: string
  hairColor: string
  skin: string
  blush: boolean
  identity: string
  hat: string | null
  facing: 'front' | 'back'
}

export interface Pet {
  name: string
  stage: 0 | 1 | 2
  feeds: number
  fullness: number
}

export interface Wallet {
  shells: number
  stars: number
  crates: number
  streak: number
  lastPlay: string | null
  restLeft: number
  restWeek: string
}

export interface Settings {
  sessionMinutes: number
  newPerDay: number
  showZhuyin: boolean
  showPinyin: boolean
  toneScoring: boolean
  speechRate: number
  clockMode: boolean
  textScale: 1 | 2 | 3
}

export interface Attempt {
  itemId: string
  skill: Skill
  result: 'correct' | 'wrong' | 'partial'
  hint: boolean
  at: string
}

export interface QuestState {
  date: string
  review: number
  learned: number
  played: boolean
  rewarded: boolean
}

export interface Save {
  version: 1
  avatar: Avatar | null
  settings: Settings
  wallet: Wallet
  pet: Pet
  cards: Record<string, ReviewCard>
  attempts: Attempt[]
  stars: Record<string, number>
  achievements: string[]
  owned: string[]
  uploads: LessonFile[]
  packLessons: LessonFile[] | null
  importedHashes: string[]
  quests: QuestState | null
  playDate: string
  playedSec: number
  bonusSec: number
  minutesByDay: Record<string, number>
  tourDone: boolean
  pin: { salt: string; hash: string } | null
  pinFails: number
  pinLockUntil: number
}

export const cardKey = (itemId: string, skill: string) => `${itemId}|${skill}`
