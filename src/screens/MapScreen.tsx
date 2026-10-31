import { useEffect, useRef, useState } from 'react'
import { THEME_COLORS } from '../game/sample'
import { growthStage, islandScore, templatesFor, unlockInfo } from '../game/questions'
import type { Avatar, Island, Pet, Template } from '../game/types'
import { ACTIVITY_LIST } from '../game/questions'
import { AvatarFace, Bi, PetFace, Stars } from '../ui'

const SLOTS = [
  [500, 390], [690, 300], [340, 280], [620, 540], [280, 470],
  [820, 430], [200, 300], [860, 250], [430, 620], [740, 640],
  [160, 560], [920, 560],
]

function hex(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return [cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.62]
  })
}

export function MapScreen({
  islands,
  stars,
  selectedId,
  onSelect,
  onPlay,
  onAdventure,
  avatar,
  pet,
  tod,
  search,
  setSearch,
  leftOpen,
  rightOpen,
  setLeftOpen,
  setRightOpen,
}: {
  islands: Island[]
  stars: Record<string, number>
  selectedId: string | null
  onSelect: (id: string) => void
  onPlay: (island: Island, template: Template) => void
  onAdventure: () => void
  avatar: Avatar
  pet: Pet
  tod: string
  search: string
  setSearch: (s: string) => void
  leftOpen: boolean
  rightOpen: boolean
  setLeftOpen: (v: boolean) => void
  setRightOpen: (v: boolean) => void
}) {
  const vp = useRef<HTMLDivElement>(null)
  const [cam, setCam] = useState({ x: 40, y: 20, z: 0.82, anim: false })
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
  const moved = useRef(false)

  function fit(z = 0.82) {
    const r = vp.current?.getBoundingClientRect()
    if (!r) return
    setCam({ x: r.width / 2 - 500 * z, y: r.height / 2 - 390 * z, z, anim: true })
  }
  function focus(index: number) {
    const r = vp.current?.getBoundingClientRect()
    if (!r) return
    const [sx, sy] = SLOTS[index % SLOTS.length]
    const z = 1.12
    setCam({ x: r.width / 2 - sx * z, y: r.height / 2 - sy * z, z, anim: true })
  }
  useEffect(() => {
    fit(0.82)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!selectedId) return
    const i = islands.findIndex((isl) => isl.id === selectedId)
    if (i >= 0) focus(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const selected = islands.find((i) => i.id === selectedId) || null
  const shown = search.trim()
    ? islands.filter((isl) => {
        const blob = [isl.titleZh, isl.titleEn, String(isl.number)].join(' ').toLowerCase()
        return blob.includes(search.trim().toLowerCase()) || JSON.stringify(isl.lesson).toLowerCase().includes(search.trim().toLowerCase())
      })
    : islands

  return (
    <div className="stage">
      <aside className={`panel side ${leftOpen ? 'open' : ''}`}>
        {selected ? (
          <IslandPanel island={selected} islands={islands} stars={stars} onPlay={onPlay} />
        ) : (
          <>
            <div className="kicker">WELCOME</div>
            <h2>
              <Bi zh="點一座島" en="Tap an island" />
            </h2>
            <p className="sub">
              <Bi zh="或按下面的「今天的冒險」。" en="Or press Today’s adventure below." />
            </p>
          </>
        )}
      </aside>
      <div className="mapwrap">
        <div
          className="viewport"
          ref={vp}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            moved.current = false
            drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }
          }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const dx = e.clientX - drag.current.x
            const dy = e.clientY - drag.current.y
            if (Math.hypot(dx, dy) > 6) moved.current = true
            setCam((c) => ({ ...c, x: drag.current!.cx + dx, y: drag.current!.cy + dy, anim: false }))
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onWheel={(e) => {
            e.preventDefault()
            setCam((c) => ({ ...c, z: Math.min(1.6, Math.max(0.45, c.z * (e.deltaY > 0 ? 0.92 : 1.08))), anim: false }))
          }}
        >
          <div className={`world ${cam.anim ? 'anim' : ''}`} style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})` }}>
            <svg width="1000" height="760" aria-hidden>
              <defs>
                <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={tod === 'night' ? '#1e3a6e' : '#7ec8d4'} />
                  <stop offset="1" stopColor={tod === 'night' ? '#132848' : '#2f8f9d'} />
                </linearGradient>
              </defs>
              <rect width="1000" height="760" fill="url(#sea)" />
              {islands.map((isl, i) => {
                if (i === 0) return null
                const [x1, y1] = SLOTS[(i - 1) % SLOTS.length]
                const [x2, y2] = SLOTS[i % SLOTS.length]
                return <line key={isl.id + 'b'} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E9DCC0" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
              })}
              {islands.map((isl, i) => {
                const [x, y] = SLOTS[i % SLOTS.length]
                const theme = THEME_COLORS[isl.theme] || THEME_COLORS.sea
                const { got, max } = islandScore(isl, stars)
                const stage = growthStage(got, max)
                const lock = !unlockInfo(isl, islands, stars).ok
                const sand = hex(x, y, 86).map((p) => p.join(',')).join(' ')
                const land = hex(x, y - 8, 70).map((p) => p.join(',')).join(' ')
                return (
                  <g key={isl.id} opacity={lock ? 0.55 : 1} onClick={() => { if (!moved.current) onSelect(isl.id) }}>
                    <polygon points={sand} fill="#E9DCC0" />
                    <polygon points={land} fill={theme.land} />
                    {stage >= 1 && <House x={x - 16} y={y - 8} roof={theme.roof} />}
                    {stage >= 2 && <House x={x + 18} y={y + 4} roof={theme.roof} />}
                    {stage >= 3 && <circle cx={x + 30} cy={y - 28} r="8" fill="#5BAA6A" />}
                    {stage >= 4 && <rect x={x - 6} y={y - 46} width="10" height="28" fill={theme.roof} />}
                    {tod === 'night' && <circle cx={x} cy={y - 20} r="3" fill="#F2C14E" />}
                  </g>
                )
              })}
            </svg>
            {avatar && selected && islands.findIndex((i) => i.id === selected.id) >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: SLOTS[islands.findIndex((i) => i.id === selected.id) % SLOTS.length][0] - 36,
                  top: SLOTS[islands.findIndex((i) => i.id === selected.id) % SLOTS.length][1] - 78,
                }}
              >
                <AvatarFace avatar={avatar} size={72} />
              </div>
            )}
            <div style={{ position: 'absolute', left: 80, top: 80 }}>
              <PetFace pet={pet} size={72} />
            </div>
            {islands.map((isl, i) => {
              const [x, y] = SLOTS[i % SLOTS.length]
              const { got, max } = islandScore(isl, stars)
              const starN = max ? Math.round((got / max) * 3) : 0
              const lock = !unlockInfo(isl, islands, stars).ok
              return (
                <button
                  key={isl.id}
                  className={`map-label ${selectedId === isl.id ? 'on' : ''}`}
                  style={{ left: x, top: y - 78 }}
                  onClick={() => onSelect(isl.id)}
                >
                  <span>
                    <span className="num">{String(isl.number).padStart(2, '0')}</span>
                    {lock ? '🔒 ' : ''}
                    {isl.titleZh}
                  </span>
                  <small>{isl.titleEn}</small>
                  <Stars n={starN} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="cluster" style={{ position: 'absolute', left: 10, bottom: 10 }}>
          <button className="iconbtn" onClick={() => setLeftOpen(!leftOpen)}>
            <Bi zh="這一島" en="This island" />
          </button>
          <button className="iconbtn" onClick={() => setRightOpen(!rightOpen)}>
            <Bi zh="清單" en="List" />
          </button>
          <button className="iconbtn" onClick={() => fit(0.78)}>
            <Bi zh="全景" en="Overview" />
          </button>
        </div>
      </div>
      <aside className={`panel side ${rightOpen ? 'open' : ''}`}>
        <div className="kicker">ISLAND INDEX</div>
        <h2>
          <Bi zh="島嶼清單" en="Island list" />
        </h2>
        <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋字、拼音、島名 / Search" aria-label="Search islands" />
        <div className="list" style={{ marginTop: 8 }}>
          {shown.map((isl) => {
            const { got, max } = islandScore(isl, stars)
            const lock = !unlockInfo(isl, islands, stars).ok
            return (
              <button key={isl.id} className={`rowbtn ${selectedId === isl.id ? 'on' : ''}`} onClick={() => onSelect(isl.id)}>
                <span>
                  <span className="num">{String(isl.number).padStart(2, '0')}</span>
                  <Bi zh={isl.titleZh} en={isl.titleEn} />
                </span>
                <span>{lock ? '🔒' : <Stars n={max ? Math.round((got / max) * 3) : 0} />}</span>
              </button>
            )
          })}
        </div>
        <button className="btn wide" style={{ marginTop: 12 }} onClick={onAdventure}>
          <Bi zh="今天的冒險" en="Today’s adventure" />
        </button>
      </aside>
    </div>
  )
}

function House({ x, y, roof }: { x: number; y: number; roof: string }) {
  return (
    <g>
      <rect x={x - 10} y={y - 8} width="22" height="16" fill="#FFF7F0" />
      <path d={`M${x - 14} ${y - 8} L${x + 1} ${y - 20} L${x + 16} ${y - 8}`} fill={roof} />
    </g>
  )
}

function IslandPanel({
  island,
  islands,
  stars,
  onPlay,
}: {
  island: Island
  islands: Island[]
  stars: Record<string, number>
  onPlay: (island: Island, template: Template) => void
}) {
  const lock = unlockInfo(island, islands, stars)
  const { got, max } = islandScore(island, stars)
  const items = (island.lesson.characters?.length || 0) + (island.lesson.words?.length || 0)
  return (
    <>
      <div className="kicker">ISLAND {String(island.number).padStart(2, '0')}</div>
      <h2>
        <Bi zh={island.titleZh} en={island.titleEn} />
      </h2>
      <p className="sub">
        <Bi zh={`${items} 個字詞 · ${got}/${max} 星`} en={`${items} items · ${got}/${max} stars`} />
      </p>
      {!lock.ok ? (
        <p className="note">
          <Bi zh={`再拿 ${lock.need} 顆星就能解鎖`} en={`Earn ${lock.need} more stars to unlock`} />
        </p>
      ) : (
        <div className="list">
          {templatesFor(island.lesson).map((id) => {
            const meta = ACTIVITY_LIST.find((a) => a.id === id)!
            const n = stars[`${island.id}:${id}`] || 0
            return (
              <button key={id} className="rowbtn" onClick={() => onPlay(island, id)}>
                <Bi zh={meta.zh} en={meta.en} />
                <Stars n={n} />
              </button>
            )
          })}
        </div>
      )}
      {island.parentCreated && (
        <p className="sub">
          <Bi zh="📘 家長加入的課" en="Added by a parent" />
        </p>
      )}
    </>
  )
}

