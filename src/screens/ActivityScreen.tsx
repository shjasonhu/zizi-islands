import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { gradePinyin } from '../lib/pinyin'
import type { ReviewResult } from '../lib/srs'
import { chime, recordClip, speak, type VoiceKind } from '../lib/speech'
import type { Question, Skill } from '../game/types'
import { Bi, RubyLine } from '../ui'

export interface Outcome {
  itemId: string
  skill: Skill
  result: ReviewResult
  hint: boolean
}

export function ActivityScreen({
  titleZh,
  titleEn,
  questions,
  showPy,
  showZy,
  toneScoring,
  rate,
  onFinish,
  onExit,
}: {
  titleZh: string
  titleEn: string
  questions: Question[]
  showPy: boolean
  showZy: boolean
  toneScoring: boolean
  rate: number
  onFinish: (outcomes: Outcome[], hints: number) => void
  onExit: () => void
}) {
  const [list, setList] = useState(questions)
  const [index, setIndex] = useState(0)
  const [marks, setMarks] = useState<(Outcome | null)[]>(() => questions.map(() => null))
  const [hintOn, setHintOn] = useState(false)
  const [input, setInput] = useState('')
  const [tries, setTries] = useState(0)
  const [msg, setMsg] = useState<{ zh: string; en: string; ok?: boolean } | null>(null)
  const [voice, setVoice] = useState<VoiceKind | null>(null)
  const [phase, setPhase] = useState<'card' | 'confirm'>('card')
  const [order, setOrder] = useState<string[]>([])
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [pickZh, setPickZh] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const hints = useRef(0)
  const q = list[index]
  const locked = !!marks[index]

  useEffect(() => {
    setInput('')
    setTries(0)
    setMsg(null)
    setPhase('card')
    setHintOn(false)
    setOrder([])
    setPairs({})
    setPickZh(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    if (!q) return
    if (q.hideHanzi || q.template === 'SPEAK' || q.template === 'LISTEN') {
      setVoice(speak(q.hanzi.replace(/[^\p{Script=Han}]/gu, '') || q.hanzi, rate))
    }
    // audioUrl is revoked above; don't retrigger on its change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, q?.id])

  function commit(result: ReviewResult, usedHint = hintOn) {
    if (!q || marks[index]) return
    if (usedHint) hints.current += 1
    const outcome: Outcome = { itemId: q.itemId, skill: q.skill, result, hint: usedHint }
    const nextMarks = [...marks]
    while (nextMarks.length < list.length) nextMarks.push(null)
    nextMarks[index] = outcome
    let nextList = list
    if (result === 'wrong' && !q.requeue) {
      nextList = [...list, { ...q, id: q.id + ':again', requeue: true }]
      nextMarks.push(null)
      setList(nextList)
    }
    setMarks(nextMarks)
    if (result === 'wrong') {
      setMsg({ zh: '再看一次正確答案。沒關係，待會還會遇到。', en: 'Here is the answer. No problem — it will come back once more.' })
    } else if (result === 'partial') {
      setMsg({ zh: `差一點！聲調是 ${q.pinyin}`, en: `Almost! The tones are ${q.pinyin}` })
    } else {
      chime('ok')
      setMsg({ zh: '答對了！', en: 'Correct!', ok: true })
    }
  }

  function go(delta: number) {
    const next = index + delta
    if (next < 0) return
    const answered = marks.filter(Boolean).length
    if (next >= list.length) {
      onFinish(marks.filter((m): m is Outcome => !!m), hints.current)
      return
    }
    if (delta > 0 && !marks[index] && answered >= 0) {
      /* stay until answered, except story intro */
    }
    setIndex(next)
  }

  if (!q) {
    return (
      <div className="play">
        <div className="card">
          <Bi zh="這一關還沒有題目。" en="This activity has no questions yet." />
          <button className="btn" onClick={onExit}>
            <Bi zh="回地圖" en="Back to the map" />
          </button>
        </div>
      </div>
    )
  }

  const total = list.length
  const grade = q.template === 'TYPE' ? gradePinyin(input, q.pinyin, toneScoring ? 'number' : 'none') : null

  function submitType() {
    if (!grade || locked) return
    if (grade.grade === 'incomplete') {
      setMsg({ zh: '再補幾個字母。', en: 'Add the missing letters.' })
      return
    }
    if (grade.grade === 'correct') {
      commit('correct')
      return
    }
    if (grade.grade === 'tone') {
      commit(toneScoring ? 'partial' : 'correct')
      return
    }
    const n = tries + 1
    setTries(n)
    if (n >= 3) commit('wrong')
    else setMsg({ zh: '看一下哪幾個字母不一樣，改一改再送出。', en: 'See which letters differ, fix them, and send again.' })
  }

  function submitChoice(correct: boolean) {
    if (locked) return
    commit(correct ? 'correct' : 'wrong')
  }

  return (
    <div className="play">
      <article className="card">
        <div className="kicker">{q.template}</div>
        <h2>
          <Bi zh={titleZh} en={titleEn} />
        </h2>
        <div className="progress" aria-hidden>
          <span style={{ width: `${(index / Math.max(1, total)) * 100}%` }} />
        </div>
        <p>
          <Bi zh={`第 ${index + 1} 題／共 ${total} 題`} en={`Question ${index + 1} of ${total}`} />
        </p>
        <p className="prompt">
          <Bi zh={q.promptZh} en={q.promptEn} />
        </p>
        {voice && voice !== 'zh-TW' && voice !== 'zh-TW-enhanced' && (
          <p className="note">
            <Bi
              zh="這台裝置沒有台灣國語語音，改用注音和拼音。有別的中文語音會先湊合。"
              en="No Taiwan Mandarin voice on this device. Zhuyin and pinyin stay on. Another Chinese voice is used if there is one."
            />
          </p>
        )}
        <div className="cluster">
          <button className="chip" onClick={() => setVoice(speak(q.hanzi.replace(/[^\p{Script=Han}]/gu, '') || q.hanzi, rate))}>
            🔊 <Bi zh="朗讀" en="Speak" />
          </button>
          <button className="chip" onClick={() => setVoice(speak(q.hanzi.replace(/[^\p{Script=Han}]/gu, '') || q.hanzi, Math.max(0.6, rate * 0.8)))}>
            <Bi zh="慢一點" en="Slower" />
          </button>
          <button
            className="chip"
            onClick={() => {
              setHintOn(true)
              setMsg({ zh: `提示：${q.zhuyin} ${q.pinyin}`, en: `Hint: ${q.zhuyin} ${q.pinyin}` })
            }}
          >
            <Bi zh="提示" en="Hint" />
          </button>
        </div>

        {q.template === 'FLASH' && phase === 'card' && (
          <FlashCard q={q} showPy={showPy} showZy={showZy} onKnow={() => setPhase('confirm')} onAgain={() => commit('wrong')} />
        )}
        {((q.template === 'FLASH' && phase === 'confirm') || q.template === 'RECOGNIZE' || q.template === 'LISTEN' || q.template === 'QUIZ') && (
          <ChoiceBlock q={q} showPy={showPy || hintOn} showZy={showZy || hintOn} locked={locked} onPick={submitChoice} english={q.template !== 'LISTEN' && !q.hideHanzi} />
        )}
        {q.template === 'TYPE' && (
          <div>
            {!q.hideHanzi && <RubyLine text={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy={showPy || hintOn} showZy={showZy || hintOn} big />}
            {q.hideHanzi && <p className="sub"><Bi zh="先聽，再打拼音。" en="Listen first, then type the pinyin." /></p>}
            <input
              className="field typebox"
              style={{ width: '100%', minHeight: 56 }}
              value={input}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="go"
              disabled={locked}
              aria-label="Pinyin"
              placeholder={toneScoring ? 'ni3 hao3' : 'ni hao'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitType()
              }}
            />
            <div className="cells" aria-live="polite">
              {grade?.cells.map((c, i) => (
                <span key={i} className={c.state}>
                  {c.ch}
                </span>
              ))}
            </div>
            {msg && <p className={msg.ok ? 'note ok' : 'note'}><Bi zh={(msg.ok ? '✓ ' : '↺ ') + msg.zh} en={msg.en} /></p>}
            <p className="sub">
              <Bi
                zh={toneScoring ? '數字標聲調，例如 ni3。v 可以代替 ü。' : '現在不用打聲調。'}
                en={toneScoring ? 'Mark tones with numbers, like ni3. v stands for ü.' : 'Tones are not scored right now.'}
              />
            </p>
            {!locked && (
              <button className="btn" onClick={submitType}>
                <Bi zh="送出" en="Check" />
              </button>
            )}
          </div>
        )}
        {q.template === 'STROKE' && <StrokePad hanzi={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy={showPy} showZy={showZy} locked={locked} onDone={() => commit('correct')} />}
        {q.template === 'SPEAK' && (
          <SpeakPad
            q={q}
            showPy={showPy}
            showZy={showZy}
            rate={rate}
            recording={recording}
            audioUrl={audioUrl}
            locked={locked}
            onRecord={async () => {
              setRecording(true)
              try {
                const blob = await recordClip(3000)
                if (audioUrl) URL.revokeObjectURL(audioUrl)
                setAudioUrl(URL.createObjectURL(blob))
              } catch {
                setMsg({ zh: '沒有麥克風也可以。聽完自己說一次，再按「我說了」。', en: 'No microphone is fine. Say it after the model, then tap “I said it.”' })
              } finally {
                setRecording(false)
              }
            }}
            onOk={() => commit('correct')}
          />
        )}
        {q.template === 'MATCH' && q.choices && (
          <MatchPad
            choices={q.choices}
            pairs={pairs}
            pickZh={pickZh}
            setPickZh={setPickZh}
            locked={locked}
            onPair={(zh, en) => {
              const next = { ...pairs, [zh]: en }
              setPairs(next)
              const all = q.choices!.every((c) => next[c.zh] === c.en)
              const done = q.choices!.every((c) => next[c.zh])
              if (done) commit(all ? 'correct' : 'wrong')
            }}
          />
        )}
        {q.template === 'STORY' && (
          <div>
            {(q.lines || []).map((line, i) => (
              <p key={i}>
                <RubyLine text={line.zh} pinyin={line.pinyin || ''} zhuyin={line.zhuyin || ''} showPy={showPy} showZy={showZy} />
                <br />
                <span className="sub">{line.en}</span>
              </p>
            ))}
            {q.choices && <ChoiceBlock q={{ ...q, hideHanzi: true, hanzi: '' }} showPy={false} showZy={false} locked={locked} onPick={submitChoice} english />}
          </div>
        )}
        {q.template === 'ORDER' && q.chunks && (
          <OrderPad chunks={q.chunks} order={order} setOrder={setOrder} locked={locked} onCheck={() => commit(order.join('，') === q.chunks!.join('，') ? 'correct' : 'wrong')} />
        )}

        {msg && q.template !== 'TYPE' && (
          <p className={msg.ok ? 'note ok' : 'note'}>
            <Bi zh={(msg.ok ? '✓ ' : '↺ ') + msg.zh} en={msg.en} />
            {locked && q.template !== 'STORY' && (
              <>
                {' '}
                <RubyLine text={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy showZy />
                <span className="sub"> {q.en}</span>
              </>
            )}
          </p>
        )}

        <div className="cluster" style={{ marginTop: 12 }}>
          <button className="btn ghost" disabled={index === 0} onClick={() => setIndex((n) => Math.max(0, n - 1))}>
            <Bi zh="上一題" en="Previous" />
          </button>
          <button className="btn" disabled={!locked} onClick={() => go(1)}>
            <Bi zh={index + 1 >= list.length ? '完成' : '下一題'} en={index + 1 >= list.length ? 'Finish' : 'Next'} />
          </button>
          <button className="btn ghost" onClick={onExit}>
            <Bi zh="離開" en="Leave" />
          </button>
        </div>
        {locked && index > 0 && (
          <p className="sub">
            <Bi zh="上一題只能回看。" en="Previous questions are just for looking back." />
          </p>
        )}
      </article>
    </div>
  )
}

function FlashCard({
  q,
  showPy,
  showZy,
  onKnow,
  onAgain,
}: {
  q: Question
  showPy: boolean
  showZy: boolean
  onKnow: () => void
  onAgain: () => void
}) {
  const [flip, setFlip] = useState(false)
  return (
    <div>
      <button className="rowbtn" style={{ minHeight: 140, justifyContent: 'center' }} onClick={() => setFlip((f) => !f)}>
        {!flip ? (
          <RubyLine text={q.hanzi} pinyin="" zhuyin="" showPy={false} showZy={false} big />
        ) : (
          <span>
            <RubyLine text={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy={showPy} showZy={showZy} big />
            <span className="sub">{q.en}</span>
          </span>
        )}
      </button>
      <div className="cluster" style={{ marginTop: 8 }}>
        <button className="btn" onClick={onKnow}>
          <Bi zh="會了" en="I know it" />
        </button>
        <button className="btn ghost" onClick={onAgain}>
          <Bi zh="再想想" en="Not yet" />
        </button>
      </div>
    </div>
  )
}

function ChoiceBlock({
  q,
  showPy,
  showZy,
  locked,
  onPick,
  english,
}: {
  q: Question
  showPy: boolean
  showZy: boolean
  locked: boolean
  onPick: (ok: boolean) => void
  english: boolean
}) {
  return (
    <div>
      {!q.hideHanzi && q.hanzi && <RubyLine text={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy={showPy} showZy={showZy} big />}
      <div className="grid2">
        {(q.choices || []).map((c) => (
          <button key={c.id} className="opt" disabled={locked} onClick={() => onPick(c.correct)}>
            {english ? <Bi zh={c.en || c.zh} en={c.zh && c.en ? '' : c.zh} /> : <span className="hz" style={{ fontFamily: 'var(--kai)', fontSize: '1.8rem' }}>{c.zh}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function StrokePad({
  hanzi,
  pinyin,
  zhuyin,
  showPy,
  showZy,
  locked,
  onDone,
}: {
  hanzi: string
  pinyin: string
  zhuyin: string
  showPy: boolean
  showZy: boolean
  locked: boolean
  onDone: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const writer = useRef<{ animateCharacter: () => Promise<void>; cancelQuiz: () => void } | null>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const [missing, setMissing] = useState(false)
  const draw = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    setMissing(false)
    el.innerHTML = ''
    const target = document.createElement('div')
    el.appendChild(target)
    const char = [...hanzi].find((ch) => /\p{Script=Han}/u.test(ch)) || hanzi
    fetch(`${import.meta.env.BASE_URL}strokes/${encodeURIComponent(char)}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('missing')
        return r.json()
      })
      .then((data) => {
        if (dead) return
        const w = HanziWriter.create(target, char, {
          width: 220,
          height: 220,
          padding: 8,
          showOutline: true,
          showCharacter: false,
          strokeColor: '#1C1C1C',
          outlineColor: '#E4D3C4',
          highlightColor: '#E8643C',
          drawingColor: '#1F7A3A',
          charDataLoader: (_c: string, onLoad: (d: unknown) => void) => onLoad(data),
        })
        writer.current = w
        w.quiz({
          showHintAfterMisses: 1,
          onMistake: () => undefined,
          onComplete: () => doneRef.current(),
        })
      })
      .catch(() => {
        if (!dead) setMissing(true)
      })
    return () => {
      dead = true
      try {
        writer.current?.cancelQuiz()
      } catch {
        /* already gone */
      }
    }
  }, [hanzi])

  return (
    <div>
      <RubyLine text={hanzi} pinyin={pinyin} zhuyin={zhuyin} showPy={showPy} showZy={showZy} big />
      <p className="sub">
        <Bi zh="筆順是參考動畫。如果和學校教的不一樣，聽老師的。" en="This stroke order is a guide. If school teaches it differently, follow your teacher." />
      </p>
      {!missing && (
        <>
          <div className="stroke-box" ref={host} />
          <button className="btn ghost" onClick={() => writer.current?.animateCharacter()}>
            <Bi zh="再看一次" en="Watch again" />
          </button>
        </>
      )}
      {missing && (
        <div>
          <p className="sub">
            <Bi zh="這個字還沒有筆順檔。請用手指沿著字描一次。" en="No stroke file for this character yet. Trace it with your finger." />
          </p>
          <canvas
            ref={draw}
            className="trace"
            width={320}
            height={180}
            onPointerDown={(e) => {
              const c = draw.current
              if (!c) return
              const ctx = c.getContext('2d')
              if (!ctx) return
              const r = c.getBoundingClientRect()
              ctx.strokeStyle = '#1F7A3A'
              ctx.lineWidth = 4
              ctx.lineCap = 'round'
              ctx.beginPath()
              ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
              const move = (ev: PointerEvent) => {
                ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top)
                ctx.stroke()
              }
              const up = () => {
                window.removeEventListener('pointermove', move)
                window.removeEventListener('pointerup', up)
              }
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
          />
          {!locked && (
            <button className="btn" onClick={onDone}>
              <Bi zh="我描好了" en="I traced it" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SpeakPad({
  q,
  showPy,
  showZy,
  recording,
  audioUrl,
  locked,
  onRecord,
  onOk,
}: {
  q: Question
  showPy: boolean
  showZy: boolean
  rate: number
  recording: boolean
  audioUrl: string | null
  locked: boolean
  onRecord: () => void
  onOk: () => void
}) {
  return (
    <div>
      <RubyLine text={q.hanzi} pinyin={q.pinyin} zhuyin={q.zhuyin} showPy={showPy} showZy={showZy} big />
      <p className="sub">{q.en}</p>
      <div className="cluster">
        <button className="btn" onClick={onRecord} disabled={recording || locked}>
          <Bi zh={recording ? '錄音中…' : '錄音'} en={recording ? 'Recording…' : 'Record'} />
        </button>
        {audioUrl && <audio controls src={audioUrl} />}
      </div>
      <p className="sub">
        <Bi zh="錄音只留在這台裝置上，不會上傳。" en="The recording stays on this device. It is not uploaded." />
      </p>
      {!locked && (
        <button className="btn ghost" onClick={onOk}>
          <Bi zh="我說了" en="I said it" />
        </button>
      )}
    </div>
  )
}

function MatchPad({
  choices,
  pairs,
  pickZh,
  setPickZh,
  locked,
  onPair,
}: {
  choices: { id: string; zh: string; en: string }[]
  pairs: Record<string, string>
  pickZh: string | null
  setPickZh: (z: string | null) => void
  locked: boolean
  onPair: (zh: string, en: string) => void
}) {
  const ens = [...choices.map((c) => c.en)].sort()
  return (
    <div className="grid2">
      <div className="list">
        {choices.map((c) => (
          <button key={c.id} className={`opt ${pickZh === c.zh ? 'pick' : ''}`} disabled={locked || !!pairs[c.zh]} onClick={() => setPickZh(c.zh)}>
            {c.zh}
            {pairs[c.zh] ? ` → ${pairs[c.zh]}` : ''}
          </button>
        ))}
      </div>
      <div className="list">
        {ens.map((en) => (
          <button
            key={en}
            className="opt"
            disabled={locked || !pickZh}
            onClick={() => {
              if (pickZh) {
                onPair(pickZh, en)
                setPickZh(null)
              }
            }}
          >
            {en}
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderPad({
  chunks,
  order,
  setOrder,
  locked,
  onCheck,
}: {
  chunks: string[]
  order: string[]
  setOrder: (v: string[]) => void
  locked: boolean
  onCheck: () => void
}) {
  const [bank] = useState(() => [...chunks].sort(() => Math.random() - 0.5))
  const left = bank.filter((c) => order.filter((o) => o === c).length < bank.filter((b) => b === c).length)
  return (
    <div>
      <div className="cluster">
        {order.map((c, i) => (
          <button key={c + i} className="chip" disabled={locked} onClick={() => setOrder(order.filter((_, j) => j !== i))}>
            {c}
          </button>
        ))}
      </div>
      <div className="cluster" style={{ marginTop: 8 }}>
        {left.map((c, i) => (
          <button key={c + i} className="chip" disabled={locked} onClick={() => setOrder([...order, c])}>
            {c}
          </button>
        ))}
      </div>
      {!locked && (
        <button className="btn" style={{ marginTop: 8 }} onClick={onCheck}>
          <Bi zh="排好了" en="Check order" />
        </button>
      )}
    </div>
  )
}
