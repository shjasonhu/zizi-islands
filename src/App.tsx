import { useEffect, useMemo, useState } from 'react'
import { decryptJson, readEncPayload } from './lib/contentCrypto.mjs'
import { localISO } from './lib/srs'
import { speak } from './lib/speech'
import { loadSave, persistSave, wipeSave } from './game/db'
import { buildAdventure, buildQuestions, islandsFromSave, itemsFromLesson, unlockInfo } from './game/questions'
import { feedPet, finishRound, freshSave, petStageName, type RoundResult } from './game/progress'
import type { LessonFile, Question, Save, Template } from './game/types'
import { ActivityScreen, type Outcome } from './screens/ActivityScreen'
import { CreateScreen } from './screens/CreateScreen'
import { MapScreen } from './screens/MapScreen'
import { ParentScreen } from './screens/ParentScreen'
import { Bi, PetFace, RubyLine, Stars } from './ui'

type View = 'gate' | 'create' | 'map' | 'play' | 'result' | 'parent' | 'dex' | 'pet'
type Tod = 'dawn' | 'day' | 'dusk' | 'night'

const TOUR = [
  { k: '01', zh: '每座島都是一個主題，點一座島就能出發！', en: 'Each island is a topic — tap one to start!' },
  { k: '02', zh: '島民會把你學會的字搬上島，蓋出新房子。', en: 'Islanders carry the words you learn onto the island and build houses.' },
  { k: '03', zh: '每天完成任務拿星星和貝殼，換新衣服！', en: 'Finish daily quests for stars and shells, then trade them for new clothes!' },
  { k: '04', zh: '照顧你的小寵物，用貝殼和字箱餵牠長大！', en: 'Take care of your pet. Feed it shells and word crates so it can grow!' },
]

export function App() {
  const [save, setSave] = useState<Save | null>(null)
  const [view, setView] = useState<View>('gate')
  const [packReady, setPackReady] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [tour, setTour] = useState(0)
  const [tod, setTod] = useState<Tod>('dawn')
  const [manualTod, setManualTod] = useState(false)
  const [play, setPlay] = useState<{ islandId: string; titleZh: string; titleEn: string; template: string; questions: Question[] } | null>(null)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [started, setStarted] = useState(0)

  useEffect(() => {
    loadSave().then((s) => {
      setSave(s)
      if (s.avatar) setView('map')
    })
    fetch(`${import.meta.env.BASE_URL}content.enc`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          setPackReady(false)
          return
        }
        const payload = readEncPayload(await r.text(), r.headers.get('content-type') || '')
        setPackReady(!!payload)
      })
      .catch(() => setPackReady(false))
  }, [])

  useEffect(() => {
    if (!save) return
    const t = window.setTimeout(() => void persistSave(save), 400)
    return () => window.clearTimeout(t)
  }, [save])

  useEffect(() => {
    if (!save || view === 'gate' || view === 'parent') return
    const id = window.setInterval(() => {
      setSave((s) => {
        if (!s) return s
        const today = localISO()
        if (s.playDate !== today) return { ...s, playDate: today, playedSec: 1 }
        return { ...s, playedSec: s.playedSec + 1 }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [!!save, view])

  const islands = useMemo(() => (save ? islandsFromSave(save) : []), [save])
  const limit = save ? save.settings.sessionMinutes * 60 + save.bonusSec : 15 * 60
  const blocked = !!save && save.playedSec >= limit
  const frac = save ? Math.min(1, save.playedSec / Math.max(1, limit)) : 0
  const autoTod: Tod = frac < 0.33 ? 'dawn' : frac < 0.66 ? 'day' : frac < 1 ? 'dusk' : 'night'
  const shownTod = manualTod || !save?.settings.clockMode ? tod : autoTod

  useEffect(() => {
    if (tour > 0) speak(TOUR[tour - 1].zh, save?.settings.speechRate || 0.95)
  }, [tour, save?.settings.speechRate])

  if (!save) {
    return (
      <div className="center">
        <div className="card">
          <Bi zh="字字群島準備中…" en="Zizi Islands is getting ready…" />
        </div>
      </div>
    )
  }

  function update(next: Save) {
    setSave(next)
  }

  async function unlockPack() {
    setPwErr('')
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}content.enc`, { cache: 'no-store' })
      if (!res.ok) {
        setPwErr('這個網站還沒有加密課本。 No encrypted textbook on this site yet.')
        return
      }
      const payload = readEncPayload(await res.text(), res.headers.get('content-type') || '')
      if (!payload) {
        setPwErr('這個網站還沒有加密課本。 No encrypted textbook on this site yet.')
        return
      }
      const data = (await decryptJson(payload, pw)) as { lessons?: LessonFile[] }
      const lessons = data.lessons || []
      if (!lessons.length) throw new Error('empty')
      const current = save
      if (!current) return
      const next = { ...current, packLessons: lessons.map((lesson) => ({ ...lesson, original: false, islandId: lesson.islandId || `pack-${lesson.lesson}` })) }
      update(next)
      setPw('')
      setView(next.avatar ? 'map' : 'create')
    } catch {
      setPwErr('密碼不對，或檔案壞了。 Wrong password, or the file is damaged.')
    }
  }

  function begin(islandId: string, template: Template | 'ADVENTURE', questions: Question[], titleZh: string, titleEn: string) {
    if (blocked) return
    if (!questions.length) return
    setPlay({ islandId, template, questions, titleZh, titleEn })
    setStarted(Date.now())
    setView('play')
  }

  function startIsland(islandId: string, template: Template) {
    if (!save) return
    const island = islands.find((i) => i.id === islandId)
    if (!island || !unlockInfo(island, islands, save.stars).ok) return
    const pool = islands.flatMap((isl) => itemsFromLesson(isl.lesson, isl.id))
    begin(island.id, template, buildQuestions(island, template, pool), island.titleZh, island.titleEn)
  }

  function startAdventure() {
    if (!save) return
    const questions = buildAdventure(islands, save.cards, localISO(), save.settings.newPerDay, save.stars)
    begin('adventure', 'ADVENTURE', questions, '今天的冒險', "Today’s adventure")
  }

  const visibleIslands = islands

  return (
    <div className={`app ${shownTod} scale-${save.settings.textScale}`}>
      {view !== 'gate' && view !== 'create' && (
        <header className="topbar">
          <div className="brand">
            <b>字字群島</b>
            <span>Zizi Islands</span>
          </div>
          <div className="cluster">
            {(['dawn', 'day', 'dusk', 'night'] as Tod[]).map((t) => (
              <button
                key={t}
                className={`iconbtn ${shownTod === t ? 'on' : ''}`}
                onClick={() => {
                  setManualTod(true)
                  setTod(t)
                }}
                aria-label={t}
              >
                {t === 'dawn' ? '🌅' : t === 'day' ? '☀️' : t === 'dusk' ? '🌇' : '🌙'}
              </button>
            ))}
            <button className={`chip ${save.settings.showZhuyin ? 'on' : ''}`} onClick={() => update({ ...save, settings: { ...save.settings, showZhuyin: !save.settings.showZhuyin } })}>
              <Bi zh="注音" en="Zhuyin" />
            </button>
            <button className={`chip ${save.settings.showPinyin ? 'on' : ''}`} onClick={() => update({ ...save, settings: { ...save.settings, showPinyin: !save.settings.showPinyin } })}>
              <Bi zh="拼音" en="Pinyin" />
            </button>
          </div>
          <div className="spacer" />
          <div className="cluster">
            <button className="iconbtn" onClick={() => setView('map')}>
              <Bi zh="地圖" en="Map" />
            </button>
            <button className="iconbtn" onClick={() => setView('create')}>
              <Bi zh="角色" en="Me" />
            </button>
            <button className="iconbtn" onClick={() => setView('pet')}>
              <Bi zh="寵物" en="Pet" />
            </button>
            <button className="iconbtn" onClick={() => setView('dex')}>
              <Bi zh="圖鑑" en="Dex" />
            </button>
            <button className="iconbtn" onClick={() => setView('parent')}>
              <Bi zh="家長" en="Parent" />
            </button>
          </div>
        </header>
      )}

      {view === 'gate' && (
        <div className="center">
          <div className="card">
            <div className="kicker">HELLO / 01</div>
            <h1>字字群島</h1>
            <p>Zizi Islands</p>
            <p>
              <Bi zh="每座島都是一課。可以先玩原創練習島，或用家庭密碼打開家裡的課本。" en="Each island is a lesson. Play the original practice island, or enter the family password to open the home textbook." />
            </p>
            {!packReady && !save.packLessons && (
              <p className="note">
                <Bi zh="這個網站還沒有放上加密課本。練習島可以直接玩。" en="This site does not have an encrypted textbook yet. The practice island is ready." />
              </p>
            )}
            <button
              className="btn wide"
              onClick={() => {
                setView(save.avatar ? 'map' : 'create')
                if (save.avatar && !save.tourDone) setTour(1)
              }}
            >
              <Bi zh="玩練習島" en="Play the practice island" />
            </button>
            {packReady && !save.packLessons && (
              <>
                <label className="field">
                  <Bi zh="家庭密碼" en="Family password" />
                  <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                </label>
                {pwErr && <p className="note">{pwErr}</p>}
                <button className="btn ghost wide" onClick={() => void unlockPack()}>
                  <Bi zh="打開課本" en="Unlock the textbook" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'create' && (
        <CreateScreen
          save={save}
          onSave={update}
          onDone={() => {
            if (!save.tourDone) setTour(1)
            setView('map')
          }}
        />
      )}

      {view === 'map' && save.avatar && (
        <>
          <MapScreen
            islands={visibleIslands}
            stars={save.stars}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id)
              setLeftOpen(true)
            }}
            onPlay={(island, template) => startIsland(island.id, template)}
            onAdventure={startAdventure}
            avatar={save.avatar}
            pet={save.pet}
            tod={shownTod}
            search={search}
            setSearch={setSearch}
            leftOpen={leftOpen}
            rightOpen={rightOpen}
            setLeftOpen={setLeftOpen}
            setRightOpen={setRightOpen}
          />
          <footer className="bottombar">
            <div className="cluster">
              <span>🔥 {save.wallet.streak}</span>
              <span>🐚 {save.wallet.shells}</span>
              <span>📦 {save.wallet.crates}</span>
              <span>⭐ {save.wallet.stars}</span>
              <span>
                {save.quests?.date === localISO() ? `${(save.quests.played ? 1 : 0) + (save.quests.review >= 3 ? 1 : 0) + (save.quests.learned >= 1 ? 1 : 0)}/3` : '0/3'}{' '}
                <Bi zh="每日" en="quests" />
              </span>
            </div>
            <button className="btn" disabled={blocked} onClick={startAdventure}>
              <Bi zh="今天的冒險" en="Today’s adventure" />
            </button>
          </footer>
        </>
      )}

      {view === 'play' && play && (
        <ActivityScreen
          titleZh={play.titleZh}
          titleEn={play.titleEn}
          questions={play.questions}
          showPy={save.settings.showPinyin}
          showZy={save.settings.showZhuyin}
          toneScoring={save.settings.toneScoring}
          rate={save.settings.speechRate}
          onExit={() => setView('map')}
          onFinish={(outcomes: Outcome[], hints: number) => {
            const minutes = Math.max(1, Math.round((Date.now() - started) / 60000))
            const today = localISO()
            const { save: next, result: round } = finishRound(save, {
              islandId: play.islandId,
              template: play.template,
              total: Math.max(1, outcomes.length),
              credits: outcomes.filter((o) => o.result !== 'wrong').length,
              hints,
              outcomes,
              today,
            })
            next.minutesByDay = { ...next.minutesByDay, [today]: (next.minutesByDay[today] || 0) + minutes * 60 }
            update(next)
            setResult(round)
            setView('result')
          }}
        />
      )}

      {view === 'result' && result && (
        <div className="center">
          <div className="card">
            <div className="kicker">RESULT</div>
            <h1>
              <Stars n={result.stars} />
            </h1>
            <p>
              <Bi zh={`得到 ${result.shells} 個貝殼、${result.crates} 個字箱。`} en={`${result.shells} shells and ${result.crates} word crates.`} />
            </p>
            <p className="note ok">
              <Bi
                zh={result.streakNote === 'back' ? '歡迎回來！' : '島民正在把字箱搬上島。'}
                en={result.streakNote === 'back' ? 'Welcome back!' : 'Islanders are carrying word crates onto the island.'}
              />
            </p>
            <div style={{ fontSize: 42, animation: 'none' }}>🏡 📦 🦦</div>
            {result.newBadges.length > 0 && (
              <p>
                <Bi zh="新貼紙！" en="New stickers!" /> {result.newBadges.join(', ')}
              </p>
            )}
            <button className="btn wide" onClick={() => setView('map')}>
              <Bi zh="回地圖" en="Back to the map" />
            </button>
          </div>
        </div>
      )}

      {view === 'parent' && (
        <ParentScreen
          save={save}
          onSave={update}
          onClose={() => setView('map')}
          onReplayTour={() => {
            update({ ...save, tourDone: false })
            setTour(1)
            setView('map')
          }}
          onAddTime={() => update({ ...save, bonusSec: save.bonusSec + 600 })}
          onWipe={() => {
            void wipeSave().then(() => {
              const fresh = freshSave()
              setSave(fresh)
              setView('gate')
            })
          }}
        />
      )}

      {view === 'pet' && (
        <div className="center">
          <div className="card">
            <PetFace pet={save.pet} size={180} />
            <h1>
              <Bi zh={save.pet.name} en={petStageName(save.pet.stage).en} />
            </h1>
            <p>
              <Bi zh={petStageName(save.pet.stage).zh} en={`Fullness ${save.pet.fullness}. It never gets sick from a day off.`} />
            </p>
            <div className="cluster">
              <button
                className="btn"
                onClick={() => {
                  const step = feedPet(save, 'shell')
                  if (!step.error) update(step.save)
                }}
              >
                <Bi zh="餵 2 貝殼" en="Feed 2 shells" />
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  const step = feedPet(save, 'crate')
                  if (!step.error) update(step.save)
                }}
              >
                <Bi zh="餵 1 字箱" en="Feed 1 crate" />
              </button>
            </div>
            <button className="btn ghost wide" style={{ marginTop: 12 }} onClick={() => setView('map')}>
              <Bi zh="回地圖" en="Back" />
            </button>
          </div>
        </div>
      )}

      {view === 'dex' && (
        <div className="center" style={{ alignItems: 'start' }}>
          <div className="card" style={{ margin: 24 }}>
            <h1>
              <Bi zh="字寶圖鑑" en="Word dex" />
            </h1>
            <div className="list">
              {islands.flatMap((isl) =>
                itemsFromLesson(isl.lesson, isl.id)
                  .filter((it) => Object.keys(save.cards).some((k) => k.startsWith(it.id + '|')))
                  .map((it) => {
                    const mastered = Object.values(save.cards).some((c) => c.itemId === it.id && c.mastered)
                    return (
                      <div key={isl.id + it.id} className="rowbtn">
                        <RubyLine text={it.text} pinyin={it.pinyin} zhuyin={it.zhuyin} showPy={save.settings.showPinyin} showZy={save.settings.showZhuyin} />
                        <span>
                          {it.en} {mastered ? '✦' : ''}
                        </span>
                      </div>
                    )
                  }),
              )}
            </div>
            <button className="btn" onClick={() => setView('map')}>
              <Bi zh="回地圖" en="Back" />
            </button>
          </div>
        </div>
      )}

      {tour > 0 && view === 'map' && (
        <div className="modal">
          <div className="card tour">
            <div className="kicker">WELCOME / {TOUR[tour - 1].k}</div>
            <h2>
              <Bi zh={TOUR[tour - 1].zh} en={TOUR[tour - 1].en} />
            </h2>
            <div className="cluster">
              <button
                className="btn ghost"
                onClick={() => {
                  setTour(0)
                  update({ ...save, tourDone: true })
                }}
              >
                <Bi zh="略過" en="Skip" />
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (tour >= 4) {
                    setTour(0)
                    update({ ...save, tourDone: true })
                  } else setTour(tour + 1)
                }}
              >
                <Bi zh="下一步 →" en="Next →" />
              </button>
            </div>
          </div>
        </div>
      )}

      {blocked && view === 'map' && (
        <div className="card nightmsg">
          <Bi zh="今天辛苦了，明天見！" en="See you tomorrow!" />
          <p className="sub">
            <Bi zh="這次的時間到了。做到一半的題目可以做完，新的關卡等下次。" en="Time is up for this session. You can finish a question you already started. New activities wait until next time." />
          </p>
        </div>
      )}
    </div>
  )
}
