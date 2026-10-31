import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SKIP = new Set(['node_modules', 'dist', 'content', 'dev-dist', '.git'])
// Joined at runtime so this file is not itself a copy of lesson text.
const BANNED = ['謝小' + '奇', '林友' + '友', '唐國' + '舟', '馬虎' + '先生', '賣草' + '帽', '字的' + '對話', '我不姓' + '王', '春眠不' + '覺曉', '明明得' + '了']

async function files(dir, out = []) {
  for (const name of await readdir(dir)) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) await files(p, out)
    else if (/\.(ts|tsx|js|mjs|css|html|md|json|svg|txt)$/.test(name)) out.push(p)
  }
  return out
}

test('tracked source does not contain textbook lesson text', async () => {
  const hits = []
  for (const file of await files(ROOT)) {
    const text = await readFile(file, 'utf8')
    for (const phrase of BANNED) {
      if (text.includes(phrase)) hits.push(`${file} contains ${phrase}`)
    }
  }
  assert.deepEqual(hits, [])
})
