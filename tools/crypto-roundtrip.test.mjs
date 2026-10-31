import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decryptJson, encryptJson, readEncPayload, DEFAULT_ITERATIONS } from '../src/lib/contentCrypto.mjs'

test('default iterations are slow enough for a family password', () => {
  assert.ok(DEFAULT_ITERATIONS >= 100_000)
})

test('the password gate accepts an enc file even when the server omits a json type', async () => {
  const enc = await encryptJson({ kind: 'zizi-lesson-bundle', lessons: [{ title: { zh: '練習' } }] }, 'pw', 2_000)
  const text = JSON.stringify(enc)
  assert.ok(readEncPayload(text, 'application/octet-stream'))
  assert.ok(readEncPayload(text, ''))
  assert.equal(readEncPayload('<!doctype html><html></html>', 'text/html'), null)
  assert.equal(readEncPayload(text, 'text/html'), null)
  assert.equal(readEncPayload('{"lessons":[]}', 'application/json'), null)
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
