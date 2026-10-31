import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decryptJson, encryptJson, DEFAULT_ITERATIONS } from '../src/lib/contentCrypto.mjs'

test('default iterations are slow enough for a family password', () => {
  assert.ok(DEFAULT_ITERATIONS >= 100_000)
})

test('AES-GCM round trip keeps a made-up lesson and rejects a wrong password', async () => {
  const bundle = {
    kind: 'zizi-lesson-bundle',
    lessons: [
      {
        title: { zh: '練習小島', en: 'Practice Islet' },
        characters: [{ char: '島', pinyin: 'dǎo', zhuyin: 'ㄉㄠˇ', en: 'island' }],
      },
    ],
  }
  const enc = await encryptJson(bundle, 'family-test-password', 2_000)
  assert.equal(enc.format, 'zizi-content-enc')
  assert.equal(enc.ciphertext.includes('練習小島'), false)
  const back = await decryptJson(enc, 'family-test-password')
  assert.deepEqual(back, bundle)
  await assert.rejects(() => decryptJson(enc, 'nope'), /Wrong password/)
})
