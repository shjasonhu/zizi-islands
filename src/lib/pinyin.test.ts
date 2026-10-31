import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gradePinyin, pinyinKey } from './pinyin.ts'

test('number tones match tone marks', () => {
  const g = gradePinyin('ni3 hao3', 'nǐ hǎo', 'number')
  assert.equal(g.grade, 'correct')
})

test('case, spaces, and v for ü', () => {
  assert.equal(gradePinyin('  NV3 ', 'nǚ', 'number').grade, 'correct')
  assert.equal(gradePinyin('nu:3', 'nǚ', 'number').grade, 'correct')
  assert.equal(gradePinyin('Nǐ', 'nǐ', 'number').grade, 'correct')
})

test('tone-off ignores tones', () => {
  assert.equal(gradePinyin('ni hao', 'nǐ hǎo', 'none').grade, 'correct')
  assert.equal(gradePinyin('ni4 hao1', 'nǐ hǎo', 'none').grade, 'correct')
})

test('tone-only is partial, not a full miss', () => {
  assert.equal(gradePinyin('ni4', 'nǐ', 'number').grade, 'tone')
  assert.equal(gradePinyin('ni', 'nǐ', 'number').grade, 'tone')
})

test('a wrong letter is wrong and an unfinished prefix is incomplete', () => {
  assert.equal(gradePinyin('ma3', 'nǐ', 'number').grade, 'wrong')
  assert.equal(gradePinyin('ni', 'nǐ hǎo', 'none').grade, 'incomplete')
})

test('pinyin key ignores tones', () => {
  assert.equal(pinyinKey('nǐ'), pinyinKey('ni3'))
})

test('digits separate syllables without spaces', () => {
  assert.equal(gradePinyin('you2yong3', 'yóu yǒng', 'number').grade, 'correct')
  assert.equal(gradePinyin('youyong', 'yóu yǒng', 'none').grade, 'correct')
  assert.equal(gradePinyin('you2yong', 'yóu yǒng', 'number').grade, 'tone')
})
