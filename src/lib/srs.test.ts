import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyReview, blankCard, bumpStreak, starsFor } from './srs.ts'

test('AC-4 correct promotes box 2 to box 3 due in 7 days', () => {
  const card = { ...blankCard('word:森林', 'type', '2026-10-01'), box: 2 as const, due: '2026-10-01' }
  const next = applyReview(card, card.itemId, 'type', 'correct', '2026-10-31')
  assert.equal(next.box, 3)
  assert.equal(next.due, '2026-11-07')
})

test('AC-4 wrong drops two boxes to box 1 and is due tomorrow', () => {
  const card = { ...blankCard('word:森林', 'type', '2026-10-01'), box: 2 as const }
  const next = applyReview(card, card.itemId, 'type', 'wrong', '2026-10-31')
  assert.equal(next.box, 1)
  assert.equal(next.due, '2026-11-01')
  assert.equal(next.mastered, false)
})

test('tone-only partial stays in the same box and stays due', () => {
  const card = { ...blankCard('char:島', 'type', '2026-10-01'), box: 3 as const, due: '2026-11-07', correctStreak: 2 }
  const next = applyReview(card, card.itemId, 'type', 'partial', '2026-10-31')
  assert.equal(next.box, 3)
  assert.equal(next.correctStreak, 2)
  assert.equal(next.due, '2026-10-31')
  assert.equal(next.priority, true)
})

test('AC-5 three stars at 92% with no hints; two stars below 90', () => {
  assert.equal(starsFor(0.92 * 10, 10, 0), 3)
  assert.equal(starsFor(9, 10, 1), 2)
  assert.equal(starsFor(5, 10, 0), 1)
})

test('AC-5 a missed day spends a rest day and keeps the streak', () => {
  const start = { streak: 5, lastPlay: '2026-10-05', restLeft: 2, restWeek: '2026-10-05', shells: 0 }
  const { wallet, note } = bumpStreak(start, '2026-10-07')
  assert.equal(note, 'rest')
  assert.ok(wallet.streak >= 5)
  assert.equal(wallet.restLeft, 1)
  assert.equal(wallet.streak, 6)
})
