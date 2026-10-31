import { useState } from 'react'
import { BADGES, defaultSettings } from '../game/progress'
import { itemsFromLesson, islandsFromSave, islandScore } from '../game/questions'
import type { LessonFile, Save, Settings } from '../game/types'
import { Bi } from '../ui'

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPin(pin: string, salt: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function asLessons(data: unknown): LessonFile[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { lessons?: unknown[] }).lessons)
      ? (data as { lessons: unknown[] }).lessons
      : [data]
  return list.filter((row): row is LessonFile => !!row && typeof row === 'object' && !!(row as LessonFile).title?.zh)
}

export function ParentScreen({
  save,
  onSave,
  onClose,
  onWipe,
  onReplayTour,
  onAddTime,
}: {
  save: Save
  onSave: (s: Save) => void
  onClose: () => void
  onWipe: () => void
  onReplayTour: () => void
  onAddTime: () => void
}) {
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'dash' | 'settings' | 'lessons' | 'backup'>('dash')
  const [draft, setDraft] = useState<LessonFile[] | null>(null)
  const [draftHash, setDraftHash] = useState('')
  const [note, setNote] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  async function enter() {
    if (save.pinLockUntil > Date.now()) {
      setErr('請等一分鐘再試。 Wait a minute, then try again.')
      return
    }
    if (!save.pin) {
      if (!/^\d{4,6}$/.test(pin) || pin !== pin2) {
        setErr('請用 4 到 6 位數字，而且要一樣。 Use 4–6 digits, typed the same way twice.')
        return
      }
      const salt = crypto.randomUUID()
      onSave({ ...save, pin: { salt, hash: await hashPin(pin, salt) }, pinFails: 0 })
      setUnlocked(true)
      return
    }
    const hash = await hashPin(pin, save.pin.salt)
    if (hash !== save.pin.hash) {
      const fails = save.pinFails + 1
      onSave({ ...save, pinFails: fails, pinLockUntil: fails >= 5 ? Date.now() + 60_000 : 0 })
      setErr(fails >= 5 ? '錯太多次，請等一分鐘。 Too many tries. Wait one minute.' : '密碼不對。 Wrong PIN.')
      setPin('')
      return
    }
    onSave({ ...save, pinFails: 0, pinLockUntil: 0 })
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <div className="center">
        <div className="card">
          <div className="kicker">PARENT</div>
          <h1>
            <Bi zh={save.pin ? '家長密碼' : '設定家長密碼'} en={save.pin ? 'Parent PIN' : 'Choose a parent PIN'} />
          </h1>
          <label className="field">
            <Bi zh="4 到 6 位數字" en="4 to 6 digits" />
            <input inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          {!save.pin && (
            <label className="field">
              <Bi zh="再輸入一次" en="Type it again" />
              <input inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value)} />
            </label>
          )}
          {err && <p className="note">{err}</p>}
          <button className="btn wide" onClick={() => void enter()}>
            <Bi zh="進入" en="Enter" />
          </button>
          <button className="btn ghost wide" style={{ marginTop: 8 }} onClick={onClose}>
            <Bi zh="回地圖" en="Back to the map" />
          </button>
        </div>
      </div>
    )
  }

  const islands = islandsFromSave(save)
  const today = new Date()
  const days = (n: number) => {
    let sec = 0
    for (let i = 0; i < n; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      sec += save.minutesByDay[key] || 0
    }
    return Math.round(sec / 60)
  }
  const missed = new Map<string, number>()
  for (const a of save.attempts) if (a.result === 'wrong') missed.set(a.itemId, (missed.get(a.itemId) || 0) + 1)
  const top = [...missed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const weekAgo = Date.now() - 7 * 86400000
  const fresh = Object.values(save.cards).filter((c) => Date.parse(c.firstSeen) >= weekAgo).length

  function patchSettings(p: Partial<Settings>) {
    onSave({ ...save, settings: { ...save.settings, ...p } })
  }

  return (
    <div className="center" style={{ alignItems: 'start' }}>
      <div className="card" style={{ width: 'min(920px, 100%)', margin: '24px auto' }}>
        <div className="kicker">PARENT</div>
        <h1>
          <Bi zh="家長區" en="Parent area" />
        </h1>
        <div className="chips">
          {(['dash', 'settings', 'lessons', 'backup'] as const).map((id) => (
            <button key={id} className={`chip ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              <Bi
                zh={id === 'dash' ? '儀表板' : id === 'settings' ? '設定' : id === 'lessons' ? '教材' : '備份'}
                en={id === 'dash' ? 'Dashboard' : id === 'settings' ? 'Settings' : id === 'lessons' ? 'Lessons' : 'Backup'}
              />
            </button>
          ))}
        </div>
        {tab === 'dash' && (
          <div>
            <p>
              <Bi zh={`連續 ${save.wallet.streak} 天 · 本週休息日還有 ${save.wallet.restLeft} 次`} en={`Streak ${save.wallet.streak} days · ${save.wallet.restLeft} rest days left this week`} />
            </p>
            <p>
              <Bi zh={`近 7 天大約 ${days(7)} 分鐘，近 30 天大約 ${days(30)} 分鐘。`} en={`About ${days(7)} minutes in 7 days, ${days(30)} in 30 days.`} />
            </p>
            <p>
              <Bi zh={`這 7 天新碰到 ${fresh} 張複習卡。`} en={`${fresh} review cards were first seen in 7 days.`} />
            </p>
            <h3>
              <Bi zh="每座島" en="Each island" />
            </h3>
            {islands.map((isl) => {
              const sc = islandScore(isl, save.stars)
              return (
                <p key={isl.id}>
                  <Bi zh={`${isl.titleZh} ${sc.got}/${sc.max}`} en={`${isl.titleEn} ${Math.round((sc.got / sc.max) * 100)}%`} />
                </p>
              )
            })}
            <h3>
              <Bi zh="常錯的" en="Often missed" />
            </h3>
            {top.length === 0 && <p className="sub"><Bi zh="還沒有。" en="None yet." /></p>}
            {top.map(([id, n]) => (
              <p key={id}>
                {id} · {n}
              </p>
            ))}
            <h3>
              <Bi zh="貼紙" en="Stickers" />
            </h3>
            <div className="chips">
              {BADGES.map((b) => (
                <span key={b.id} className={`chip ${save.achievements.includes(b.id) ? 'on' : ''}`}>
                  <Bi zh={b.zh} en={b.en} />
                </span>
              ))}
            </div>
          </div>
        )}
        {tab === 'settings' && (
          <div>
            <label className="field">
              <Bi zh="每次分鐘上限" en="Minutes per session" />
              <input type="number" min={5} max={30} value={save.settings.sessionMinutes} onChange={(e) => patchSettings({ sessionMinutes: Number(e.target.value) })} />
            </label>
            <label className="field">
              <Bi zh="每天新字詞上限" en="New items per day" />
              <input type="number" min={1} max={12} value={save.settings.newPerDay} onChange={(e) => patchSettings({ newPerDay: Number(e.target.value) })} />
            </label>
            <label className="field">
              <Bi zh="語音速度" en="Speech rate" />
              <input type="number" min={0.6} max={1.2} step={0.05} value={save.settings.speechRate} onChange={(e) => patchSettings({ speechRate: Number(e.target.value) })} />
            </label>
            <button className={`chip ${save.settings.showZhuyin ? 'on' : ''}`} onClick={() => patchSettings({ showZhuyin: !save.settings.showZhuyin })}>
              <Bi zh="注音" en="Zhuyin" />
            </button>
            <button className={`chip ${save.settings.showPinyin ? 'on' : ''}`} onClick={() => patchSettings({ showPinyin: !save.settings.showPinyin })}>
              <Bi zh="拼音" en="Pinyin" />
            </button>
            <button className={`chip ${save.settings.toneScoring ? 'on' : ''}`} onClick={() => patchSettings({ toneScoring: !save.settings.toneScoring })}>
              <Bi zh="拼音計聲調" en="Score pinyin tones" />
            </button>
            <button className={`chip ${save.settings.clockMode ? 'on' : ''}`} onClick={() => patchSettings({ clockMode: !save.settings.clockMode })}>
              <Bi zh="學習時鐘" en="Learning clock" />
            </button>
            <div className="chips" style={{ marginTop: 8 }}>
              {([1, 2, 3] as const).map((n) => (
                <button key={n} className={`chip ${save.settings.textScale === n ? 'on' : ''}`} onClick={() => patchSettings({ textScale: n })}>
                  <Bi zh={`字級 ${n}`} en={`Text ${n}`} />
                </button>
              ))}
            </div>
            <div className="cluster" style={{ marginTop: 12 }}>
              <button className="btn ghost" onClick={onReplayTour}>
                <Bi zh="再看導覽" en="Replay the tour" />
              </button>
              <button className="btn ghost" onClick={onAddTime}>
                <Bi zh="這次多 10 分鐘" en="Add 10 minutes" />
              </button>
              <button className="btn ghost" onClick={() => onSave({ ...save, settings: defaultSettings() })}>
                <Bi zh="恢復預設" en="Reset settings" />
              </button>
            </div>
          </div>
        )}
        {tab === 'lessons' && (
          <div>
            <p className="sub">
              <Bi
                zh="上傳和練習島一樣格式的 JSON。審過再發布。同一個檔案不會匯入兩次。"
                en="Upload a lesson JSON in the same shape as the practice island. Review it, then publish. The same file is not imported twice."
              />
            </p>
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const hash = await sha256(text)
                if (save.importedHashes.includes(hash)) {
                  setNote('已經匯入過。 Already imported.')
                  setDraft(null)
                  return
                }
                let parsed: unknown
                try {
                  parsed = JSON.parse(text)
                } catch {
                  setNote('這不是 JSON。 This is not JSON.')
                  return
                }
                const lessons = asLessons(parsed)
                if (!lessons.length) {
                  setNote('找不到 title.zh。 No title.zh found.')
                  return
                }
                const simp = JSON.stringify(lessons).match(/[国学这说们车门为后个]/)
                setNote(simp ? '裡面有簡體字，請改成繁體再發布。 Simplified characters found. Please use Traditional before publishing.' : '')
                setDraft(lessons)
                setDraftHash(hash)
              }}
            />
            {note && <p className="note">{note}</p>}
            {draft && (
              <div>
                {draft.map((lesson, li) => (
                  <div key={li}>
                    <h3>
                      <Bi zh={lesson.title.zh} en={lesson.title.en || ''} />
                    </h3>
                    {[...(lesson.characters || []), ...(lesson.words || [])].slice(0, 40).map((row, i) => {
                      const isChar = 'char' in row
                      return (
                        <div key={i} className="grid2">
                          <strong>{isChar ? (row as { char: string }).char : (row as { word: string }).word}</strong>
                          <input
                            value={row.en || ''}
                            onChange={(e) => {
                              const copy = structuredClone(draft)
                              const target = isChar ? copy[li].characters![i] : copy[li].words![i - (lesson.characters?.length || 0)]
                              if (target) target.en = e.target.value
                              setDraft(copy)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
                <button
                  className="btn"
                  onClick={() => {
                    const published = draft.map((lesson, i) => ({
                      ...lesson,
                      original: false,
                      islandId: lesson.islandId || `upload-${draftHash.slice(0, 8)}-${i}`,
                    }))
                    onSave({
                      ...save,
                      uploads: [...save.uploads, ...published],
                      importedHashes: [...save.importedHashes, draftHash],
                    })
                    setDraft(null)
                    setNote('已發布成新的島。 Published as new islands.')
                  }}
                >
                  <Bi zh="發布成新島" en="Publish as new islands" />
                </button>
              </div>
            )}
            <h3>
              <Bi zh="已加入的課" en="Added lessons" />
            </h3>
            {save.uploads.map((lesson) => (
              <p key={lesson.islandId}>
                {lesson.title.zh} · {itemsFromLesson(lesson, lesson.islandId || '').length}
              </p>
            ))}
            {save.packLessons && (
              <p>
                <Bi zh={`加密課包：${save.packLessons.length} 課（存在這台裝置）`} en={`Encrypted pack: ${save.packLessons.length} lessons cached on this device`} />
              </p>
            )}
            {save.packLessons && (
              <button className="btn ghost" onClick={() => onSave({ ...save, packLessons: null })}>
                <Bi zh="清掉已解開的課本" en="Clear the unlocked textbook" />
              </button>
            )}
          </div>
        )}
        {tab === 'backup' && (
          <div className="list">
            <button
              className="btn"
              onClick={() => {
                const { packLessons: _pack, ...rest } = save
                const blob = new Blob([JSON.stringify(rest, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'zizi-progress.json'
                a.click()
                URL.revokeObjectURL(a.href)
              }}
            >
              <Bi zh="匯出進度" en="Export progress" />
            </button>
            <label className="btn ghost">
              <Bi zh="匯入進度" en="Import progress" />
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const data = JSON.parse(await file.text()) as Save
                  onSave({ ...data, packLessons: save.packLessons, version: 1 })
                  setNote('進度已還原。課本若要看，再輸入一次家庭密碼。 Progress restored. Enter the family password again for the textbook.')
                }}
              />
            </label>
            <button
              className="btn ghost"
              onClick={() => {
                if (confirm('刪除這台裝置上的全部進度？ Delete all progress on this device?')) onWipe()
              }}
            >
              <Bi zh="刪除所有資料" en="Delete all data" />
            </button>
            <p className="sub">
              <Bi zh="匯出檔不含已解密的課本。進度、角色、寵物和你上傳的課會在裡面。" en="The export leaves out the decrypted textbook. Progress, the character, the pet, and lessons you uploaded are included." />
            </p>
          </div>
        )}
        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          <Bi zh="回地圖" en="Back to the map" />
        </button>
      </div>
    </div>
  )
}
