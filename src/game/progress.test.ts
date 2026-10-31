import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildAdventure, islandsFromSave } from './questions.ts'
import { buyItem, feedPet, freshSave } from './progress.ts'

test('adventure keeps brand-new items inside the daily cap', () => {
  const islands = islandsFromSave({ uploads: [], packLessons: null })
  const qs = buildAdventure(islands, {}, '2026-10-31', 5, {})
  const ids = new Set(qs.map((q) => q.itemId))
  assert.ok(qs.length >= 4)
  assert.ok(ids.size <= 5)
})

test('AC-5 buying a 50-shell hat leaves 10 and equips it', () => {
  const save = freshSave()
  save.avatar = {
    nickname: '小島',
    hair: 'bob',
    hairColor: '#2B2118',
    skin: '#F6D3B0',
    blush: true,
    identity: 'explorer',
    hat: null,
    facing: 'front',
  }
  save.wallet.shells = 60
  const { save: next, error } = buyItem(save, 'hat:panda')
  assert.equal(error, undefined)
  assert.equal(next.wallet.shells, 10)
  assert.equal(next.avatar?.hat, 'hat:panda')
  assert.ok(next.owned.includes('hat:panda'))
})

test('feeding grows the pet and never removes it', () => {
  let save = freshSave()
  save.wallet.shells = 20
  let grew = false
  for (let i = 0; i < 3; i++) {
    const step = feedPet(save, 'shell')
    save = step.save
    grew = grew || step.grew
  }
  assert.equal(save.pet.stage, 1)
  assert.equal(save.pet.feeds, 3)
  assert.ok(grew)
  assert.equal(save.wallet.shells, 14)
})
