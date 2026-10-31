/**
 * Leitner scheduler.
 * AC-4 worked example is the default: a card in box 2 that is answered
 * correctly moves to box 3 and is due in 7 days; a wrong answer drops two
 * boxes (minimum box 1) and is due tomorrow.
 * The narrative interval list in the spec (0, 1, 3, 7, 21) is the same
 * shape; box 3 uses 7 days so the acceptance example holds.
 */

export type Box = 1 | 2 | 3 | 4 | 5
export type ReviewResult = 'correct' | 'wrong' | 'partial'

export interface ReviewCard {
  itemId: string
  skill: string
  box: Box
  due: string
  correctStreak: number
  mastered: boolean
  priority: boolean
  seen: number
  firstSeen: string
}

export const BOX_DUE_DAYS: Record<Box, number> = {
  1: 0,
  2: 1,
  3: 7,
  4: 7,
  5: 21,
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso + 'T00:00:00Z')
  const b = Date.parse(toIso + 'T00:00:00Z')
  return Math.round((b - a) / 86400000)
}

export function localISO(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}

export function weekKey(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() - day + 1)
  return dt.toISOString().slice(0, 10)
}

export function blankCard(itemId: string, skill: string, today: string): ReviewCard {
  return { itemId, skill, box: 1, due: today, correctStreak: 0, mastered: false, priority: false, seen: 0, firstSeen: today }
}

export function applyReview(
  prev: ReviewCard | undefined,
  itemId: string,
  skill: string,
  result: ReviewResult,
  today: string,
): ReviewCard {
  const c = prev ?? blankCard(itemId, skill, today)
  const seen = c.seen + 1
  const firstSeen = c.firstSeen || today
  if (result === 'partial') {
    return { ...c, seen, firstSeen, due: today, priority: true }
  }
  if (result === 'wrong') {
    const box = Math.max(1, c.box - 2) as Box
    return { ...c, seen, firstSeen, box, due: addDays(today, 1), correctStreak: 0, mastered: false, priority: true }
  }
  const box = Math.min(5, c.box + 1) as Box
  const correctStreak = c.correctStreak + 1
  const mastered = box === 5 && correctStreak >= 3
  return {
    ...c,
    seen,
    firstSeen,
    box,
    due: addDays(today, BOX_DUE_DAYS[box]),
    correctStreak,
    mastered,
    priority: false,
  }
}

export function starsFor(correctCredits: number, total: number, hints: number): 1 | 2 | 3 {
  if (total <= 0) return 1
  const acc = correctCredits / total
  if (acc >= 0.9 && hints === 0) return 3
  if (acc >= 0.7) return 2
  return 1
}

export interface StreakWallet {
  streak: number
  lastPlay: string | null
  restLeft: number
  restWeek: string
}

export function bumpStreak<T extends StreakWallet>(w: T, today: string): { wallet: T; note: 'same' | 'up' | 'rest' | 'back' } {
  let restLeft = w.restLeft
  const wk = weekKey(today)
  if (w.restWeek !== wk) restLeft = 2
  if (w.lastPlay === today) return { wallet: { ...w, restLeft, restWeek: wk }, note: 'same' }
  if (!w.lastPlay) return { wallet: { ...w, streak: Math.max(1, w.streak || 1), lastPlay: today, restLeft, restWeek: wk }, note: 'up' }
  const gap = daysBetween(w.lastPlay, today)
  if (gap <= 1) {
    return { wallet: { ...w, streak: w.streak + (gap === 1 ? 1 : 0), lastPlay: today, restLeft, restWeek: wk }, note: gap === 1 ? 'up' : 'same' }
  }
  const missed = gap - 1
  if (missed <= restLeft) {
    return { wallet: { ...w, streak: w.streak + 1, lastPlay: today, restLeft: restLeft - missed, restWeek: wk }, note: 'rest' }
  }
  return { wallet: { ...w, streak: 1, lastPlay: today, restLeft, restWeek: wk }, note: 'back' }
}
