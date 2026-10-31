import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NATURAL_PITCH, NATURAL_RATE, rankVoices, type VoiceInfo } from './speech.ts'

const voices: VoiceInfo[] = [
  { name: 'Ting-Ting', lang: 'zh-CN', voiceURI: 'com.apple.voice.compact.zh-CN.Ting-Ting' },
  { name: 'Meijia', lang: 'zh-TW', voiceURI: 'com.apple.voice.compact.zh-TW.Meijia' },
  { name: 'Meijia', lang: 'zh-TW', voiceURI: 'com.apple.voice.enhanced.zh-TW.Meijia' },
  { name: 'Sinji', lang: 'zh-HK', voiceURI: 'com.apple.voice.premium.zh-HK.Sinji' },
]

test('enhanced zh-TW Meijia wins over compact zh-TW and zh-CN', () => {
  const pick = rankVoices(voices)
  assert.equal(pick.kind, 'zh-TW-enhanced')
  assert.equal(pick.voice?.voiceURI, 'com.apple.voice.enhanced.zh-TW.Meijia')
})

test('premium zh-TW beats a plain zh-TW voice', () => {
  const pick = rankVoices([
    { name: 'Meijia', lang: 'zh-TW', voiceURI: 'com.apple.voice.compact.zh-TW.Meijia' },
    { name: 'Meijia', lang: 'zh-TW', voiceURI: 'com.apple.voice.premium.zh-TW.Meijia' },
  ])
  assert.equal(pick.voice?.voiceURI, 'com.apple.voice.premium.zh-TW.Meijia')
})

test('優化 and 加強 count as enhanced Taiwan voices', () => {
  const pick = rankVoices([
    { name: '美佳', lang: 'zh-TW', voiceURI: 'compact' },
    { name: '美佳（加強版）', lang: 'zh-TW', voiceURI: 'local' },
  ])
  assert.equal(pick.kind, 'zh-TW-enhanced')
  assert.equal(pick.voice?.name, '美佳（加強版）')
})

test('any zh-TW voice beats zh-CN when nothing is enhanced', () => {
  const pick = rankVoices([
    { name: 'Ting-Ting', lang: 'zh-CN', voiceURI: 'zh-CN' },
    { name: 'Meijia', lang: 'zh-TW', voiceURI: 'com.apple.voice.compact.zh-TW.Meijia' },
  ])
  assert.equal(pick.kind, 'zh-TW')
  assert.equal(pick.voice?.lang, 'zh-TW')
})

test('zh-CN is the fallback when Taiwan is missing', () => {
  const pick = rankVoices([{ name: 'Ting-Ting', lang: 'zh-CN', voiceURI: 'zh-CN' }])
  assert.equal(pick.kind, 'zh-fallback')
})

test('an empty voice list is missing', () => {
  assert.equal(rankVoices([]).kind, 'missing')
})

test('natural speech is a little slower than 1 and at a normal pitch', () => {
  assert.ok(NATURAL_RATE > 0.8 && NATURAL_RATE < 1)
  assert.equal(NATURAL_RATE, 0.9)
  assert.equal(NATURAL_PITCH, 1)
})
