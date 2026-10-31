import { applyReview, bumpStreak, localISO, starsFor, weekKey } from '../lib/srs'
import type { ReviewResult } from '../lib/srs'
import { cardKey, type Attempt, type Pet, type Save, type Settings, type Skill, type Wallet } from './types'

export interface ShopItem {
  id: string
  zh: string
  en: string
  cost: number
  slot: 'hat' | 'identity'
  value?: string
}

export const SHOP: ShopItem[] = [
  { id: 'hat:cap', zh: '鴨舌帽', en: 'Cap', cost: 20, slot: 'hat' as const },
  { id: 'hat:bow', zh: '蝴蝶結', en: 'Bow', cost: 30, slot: 'hat' as const },
  { id: 'hat:panda', zh: '熊貓帽', en: 'Panda hat', cost: 50, slot: 'hat' as const },
  { id: 'hat:crown', zh: '小皇冠', en: 'Little crown', cost: 80, slot: 'hat' as const },
  { id: 'id:chef', zh: '小廚師', en: 'Little chef', cost: 40, slot: 'identity' as const, value: 'chef' },
  { id: 'id:artist', zh: '小畫家', en: 'Little artist', cost: 40, slot: 'identity' as const, value: 'artist' },
  { id: 'id:scientist', zh: '小科學家', en: 'Little scientist', cost: 40, slot: 'identity' as const, value: 'scientist' },
  { id: 'id:musician', zh: '小音樂家', en: 'Little musician', cost: 40, slot: 'identity' as const, value: 'musician' },
]

export const HAIR = ['short', 'bob', 'pony', 'bun', 'braids', 'spikes', 'curly', 'bangs']
export const HAIR_COLORS = ['#2B2118', '#5A3A22', '#C4552A', '#E0B15A', '#F4EFE8', '#3E6B8A']
export const SKINS = ['#F6D3B0', '#E8B48A', '#C98A62', '#8D5A3C', '#F3E0C8', '#D7A07A']

export const BADGES: { id: string; zh: string; en: string }[] = [
  { id: 'first', zh: '第一次出航', en: 'First voyage' },
  { id: 'three', zh: '三星島主', en: 'Three-star captain' },
  { id: 'streak3', zh: '連續三天', en: 'Three-day streak' },
  { id: 'shells30', zh: '貝殼小富豪', en: 'Shell pocket' },
  { id: 'baby', zh: '寵物破殼', en: 'Pet hatched' },
  { id: 'adult', zh: '寵物長大', en: 'Pet grew up' },
  { id: 'type5', zh: '拼音小手', en: 'Pinyin fingers' },
  { id: 'stroke3', zh: '筆順三遍', en: 'Three stroke drills' },
  { id: 'speak1', zh: '開口說', en: 'Spoke aloud' },
  { id: 'dex8', zh: '八字圖鑑', en: 'Eight-character dex' },
  { id: 'listen5', zh: '順風耳', en: 'Sharp ears' },
  { id: 'back', zh: '歡迎回來', en: 'Welcome back' },
]

export function defaultSettings(): Settings {
  return {
    sessionMinutes: 15,
    newPerDay: 5,
    showZhuyin: true,
    showPinyin: true,
    toneScoring: true,
    speechRate: 0.95,
    clockMode: true,
    textScale: 1,
  }
}

export function freshSave(): Save {
  const today = localISO()
  return {
    version: 1,
    avatar: null,
    settings: defaultSettings(),
    wallet: { shells: 0, stars: 0, crates: 0, streak: 0, lastPlay: null, restLeft: 2, restWeek: weekKey(today) },
    pet: { name: '貝貝', stage: 0, feeds: 0, fullness: 40 },
    cards: {},
    attempts: [],
    stars: {},
    achievements: [],
    owned: ['id:explorer'],
    uploads: [],
    packLessons: null,
    importedHashes: [],
    quests: null,
    playDate: today,
    playedSec: 0,
    bonusSec: 0,
    minutesByDay: {},
    tourDone: false,
    pin: null,
    pinFails: 0,
    pinLockUntil: 0,
  }
}

export function normalizeSave(raw: unknown): Save {
  const base = freshSave()
  if (!raw || typeof raw !== 'object') return base
  const s = raw as Partial<Save>
  return {
    ...base,
    ...s,
    version: 1,
    settings: { ...base.settings, ...(s.settings || {}) },
    wallet: { ...base.wallet, ...(s.wallet || {}) },
    pet: { ...base.pet, ...(s.pet || {}) },
    cards: s.cards || {},
    attempts: s.attempts || [],
    stars: s.stars || {},
    achievements: s.achievements || [],
    owned: s.owned || base.owned,
    uploads: s.uploads || [],
    packLessons: s.packLessons ?? null,
    importedHashes: s.importedHashes || [],
    minutesByDay: s.minutesByDay || {},
  }
}

function countSkill(save: Save, skill: Skill, result: Attempt['result'] = 'correct') {
  return save.attempts.filter((a) => a.skill === skill && a.result === result).length
}

function awardBadges(save: Save, note: string) {
  const have = new Set(save.achievements)
  const checks: [string, boolean][] = [
    ['first', save.wallet.stars >= 1],
    ['three', Object.values(save.stars).some((n) => n >= 3)],
    ['streak3', save.wallet.streak >= 3],
    ['shells30', save.wallet.shells >= 30],
    ['baby', save.pet.stage >= 1],
    ['adult', save.pet.stage >= 2],
    ['type5', countSkill(save, 'type') >= 5],
    ['stroke3', countSkill(save, 'stroke') >= 3],
    ['speak1', countSkill(save, 'speak') >= 1],
    ['dex8', new Set(save.attempts.map((a) => a.itemId)).size >= 8],
    ['listen5', countSkill(save, 'listen') >= 5],
    ['back', note === 'back'],
  ]
  for (const [id, ok] of checks) if (ok) have.add(id)
  save.achievements = [...have]
}

export interface RoundInput {
  islandId: string
  template: string
  total: number
  credits: number
  hints: number
  outcomes: { itemId: string; skill: Skill; result: ReviewResult; hint: boolean }[]
  today?: string
}

export interface RoundResult {
  stars: 1 | 2 | 3
  shells: number
  crates: number
  streakNote: 'same' | 'up' | 'rest' | 'back'
  newBadges: string[]
}

export function shellsFor(stars: number) {
  return 8 + stars * 6
}

export function finishRound(save: Save, input: RoundInput): { save: Save; result: RoundResult } {
  const today = input.today || localISO()
  const next: Save = {
    ...save,
    cards: { ...save.cards },
    attempts: [...save.attempts],
    stars: { ...save.stars },
    wallet: { ...save.wallet },
    pet: { ...save.pet },
    quests: save.quests ? { ...save.quests } : null,
    minutesByDay: { ...save.minutesByDay },
    achievements: [...save.achievements],
  }
  let crates = 0
  for (const o of input.outcomes) {
    const key = cardKey(o.itemId, o.skill)
    const before = next.cards[key]
    const card = applyReview(before, o.itemId, o.skill, o.result, today)
    if (card.mastered && !before?.mastered) crates++
    next.cards[key] = card
    next.attempts.push({ itemId: o.itemId, skill: o.skill, result: o.result, hint: o.hint, at: new Date().toISOString() })
  }
  next.attempts = next.attempts.slice(-400)
  const stars = starsFor(input.credits, input.total, input.hints)
  const starKey = `${input.islandId}:${input.template}`
  next.stars[starKey] = Math.max(next.stars[starKey] || 0, stars)
  const shells = shellsFor(stars)
  next.wallet.shells += shells
  next.wallet.stars += stars
  next.wallet.crates += crates
  const bumped = bumpStreak(next.wallet, today)
  next.wallet = bumped.wallet as Wallet
  const quests = !next.quests || next.quests.date !== today
    ? { date: today, review: 0, learned: 0, played: false, rewarded: false }
    : { ...next.quests }
  quests.played = true
  quests.review += input.outcomes.filter((o) => o.result !== 'wrong').length
  quests.learned += input.outcomes.filter((o) => !save.cards[cardKey(o.itemId, o.skill)]).length
  if (!quests.rewarded && quests.played && quests.review >= 3 && quests.learned >= 1) {
    quests.rewarded = true
    next.wallet.shells += 8
  }
  next.quests = quests
  const beforeBadges = new Set(save.achievements)
  awardBadges(next, bumped.note)
  const newBadges = next.achievements.filter((id) => !beforeBadges.has(id))
  return { save: next, result: { stars, shells, crates, streakNote: bumped.note, newBadges } }
}

export function buyItem(save: Save, id: string): { save: Save; error?: string } {
  const sku = SHOP.find((s) => s.id === id)
  if (!sku) return { save, error: 'missing' }
  if (save.owned.includes(id)) {
    const avatar = save.avatar ? { ...save.avatar } : null
    if (avatar && sku.slot === 'hat') avatar.hat = id
    if (avatar && sku.slot === 'identity' && sku.value) avatar.identity = sku.value
    return { save: { ...save, avatar } }
  }
  if (save.wallet.shells < sku.cost) return { save, error: 'shells' }
  const avatar = save.avatar ? { ...save.avatar } : null
  if (avatar && sku.slot === 'hat') avatar.hat = id
  if (avatar && sku.slot === 'identity' && sku.value) avatar.identity = sku.value
  return {
    save: {
      ...save,
      avatar,
      owned: [...save.owned, id],
      wallet: { ...save.wallet, shells: save.wallet.shells - sku.cost },
    },
  }
}

export function feedPet(save: Save, kind: 'shell' | 'crate'): { save: Save; grew: boolean; error?: string } {
  const pet: Pet = { ...save.pet }
  const wallet = { ...save.wallet }
  if (kind === 'shell') {
    if (wallet.shells < 2) return { save, grew: false, error: 'shells' }
    wallet.shells -= 2
    pet.fullness = Math.min(100, pet.fullness + 25)
  } else {
    if (wallet.crates < 1) return { save, grew: false, error: 'crates' }
    wallet.crates -= 1
    pet.fullness = Math.min(100, pet.fullness + 40)
  }
  pet.feeds += 1
  const stage: Pet['stage'] = pet.feeds >= 8 ? 2 : pet.feeds >= 3 ? 1 : 0
  const grew = stage > pet.stage
  pet.stage = stage
  const next = { ...save, pet, wallet }
  awardBadges(next, 'same')
  return { save: next, grew }
}

export function petStageName(stage: number) {
  if (stage >= 2) return { zh: '成體', en: 'Grown' }
  if (stage >= 1) return { zh: '幼體', en: 'Baby' }
  return { zh: '蛋', en: 'Egg' }
}
