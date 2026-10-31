#!/usr/bin/env node
/** Copy open stroke-order JSON for the original sample characters into public/strokes. */
import { copyFile, mkdir, access } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const destDir = join(here, '..', 'public', 'strokes')
const chars = ['島', '貝', '海', '星', '寵', '橋', '燈', '游', '獺', '殼', '物', '小', '路', '泳', '光', '沙', '船', '歌', '灘', '唱']

try {
  const root = dirname(require.resolve('hanzi-writer-data/package.json'))
  await mkdir(destDir, { recursive: true })
  let n = 0
  for (const ch of chars) {
    const src = join(root, `${ch}.json`)
    try {
      await access(src)
      await copyFile(src, join(destDir, `${ch}.json`))
      n++
    } catch {
      console.warn('no stroke file for', ch)
    }
  }
  console.log(`stroke files: ${n}`)
} catch {
  console.warn('hanzi-writer-data is not installed; stroke files were left as-is.')
}
