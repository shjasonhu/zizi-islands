#!/usr/bin/env node
/**
 * Encrypt a folder of lesson JSON files into public/content.enc.
 *
 *   node tools/encrypt-content.mjs --in content/meizhou-g4 --out public/content.enc
 *
 * Password: the ZIZI_PASSWORD environment variable, or a hidden prompt.
 * The password is not written into the file or the repo.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, basename } from 'node:path'
import { encryptJson, DEFAULT_ITERATIONS } from '../src/lib/contentCrypto.mjs'

function arg(name, fallback) {
  const i = process.argv.indexOf(name)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    if (!stdin.isTTY) {
      reject(new Error('No TTY. Set ZIZI_PASSWORD and run again.'))
      return
    }
    process.stdout.write(label)
    stdin.setRawMode(true)
    stdin.resume()
    let s = ''
    const onData = (buf) => {
      const c = buf.toString('utf8')
      if (c === '\n' || c === '\r' || c === '\u0004') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.off('data', onData)
        process.stdout.write('\n')
        resolve(s)
      } else if (c === '\u0003') {
        process.stdout.write('\n')
        process.exit(1)
      } else if (c === '\u007f' || c === '\b') {
        s = s.slice(0, -1)
      } else if (c >= ' ') {
        s += c
      }
    }
    stdin.on('data', onData)
  })
}

async function loadLessons(dir) {
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json')).sort()
  if (!names.length) throw new Error(`No JSON files in ${dir}`)
  const lessons = []
  for (const name of names) {
    const text = await readFile(join(dir, name), 'utf8')
    const data = JSON.parse(text)
    if (Array.isArray(data)) lessons.push(...data)
    else if (Array.isArray(data.lessons)) lessons.push(...data.lessons)
    else lessons.push(data)
  }
  return lessons
}

async function main() {
  const input = arg('--in', 'content/meizhou-g4')
  const output = arg('--out', 'public/content.enc')
  const password = process.env.ZIZI_PASSWORD || (await promptHidden('Family password / 家庭密碼: '))
  if (!password || password.length < 4) {
    throw new Error('Use a family password of at least 4 characters.')
  }
  const lessons = await loadLessons(input)
  const bundle = {
    kind: 'zizi-lesson-bundle',
    createdAt: new Date().toISOString(),
    lessons,
  }
  const enc = await encryptJson(bundle, password, DEFAULT_ITERATIONS)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, JSON.stringify(enc))
  const kb = Math.round(JSON.stringify(enc).length / 102.4) / 10
  console.log(`Encrypted ${lessons.length} lesson(s) from ${basename(input)} → ${output} (${kb} KB).`)
  console.log('The password is not stored. Commit public/content.enc only if this repository stays in the family.')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
