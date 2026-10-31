import type { ReactNode } from 'react'
import type { Avatar, Pet } from './game/types'

export function Bi({ zh, en, className = '' }: { zh: ReactNode; en: ReactNode; className?: string }) {
  return (
    <span className={`bi ${className}`}>
      <span className="bi-zh">{zh}</span>
      <span className="bi-en">{en}</span>
    </span>
  )
}

const HAN = /\p{Script=Han}/u

export function RubyLine({
  text,
  pinyin = '',
  zhuyin = '',
  showPy,
  showZy,
  big = false,
}: {
  text: string
  pinyin?: string
  zhuyin?: string
  showPy: boolean
  showZy: boolean
  big?: boolean
}) {
  const pys = pinyin.split(/\s+/).filter((t) => t && !/^[,.。，！？、：；「」『』]$/.test(t) && !/^[A-Z]/.test(t))
  const zys = zhuyin.split(/\s+/).filter((t) => /[ㄅ-ㄩ]/.test(t))
  let i = 0
  const nodes: ReactNode[] = []
  for (const ch of [...text]) {
    if (!HAN.test(ch)) {
      nodes.push(
        <span key={nodes.length} className="punct">
          {ch}
        </span>,
      )
      continue
    }
    const py = pys[i] || ''
    const zy = zys[i] || ''
    i++
    nodes.push(
      <span key={nodes.length} className={big ? 'ruby big' : 'ruby'}>
        <span className={showPy ? 'py' : 'py off'}>{py || ' '}</span>
        <span className={showZy ? 'zy' : 'zy off'}>{zy || ' '}</span>
        <span className="hz">{ch}</span>
      </span>,
    )
  }
  return <span className="rubyline">{nodes}</span>
}

export function AvatarFace({ avatar, size = 150 }: { avatar: Avatar; size?: number }) {
  const back = avatar.facing === 'back'
  const tops: Record<string, string> = {
    explorer: '#2F8F9D',
    chef: '#F7F1EA',
    artist: '#E8643C',
    scientist: '#E7F3D8',
    musician: '#2C3A5A',
  }
  const top = tops[avatar.identity] || tops.explorer
  const ink = avatar.identity === 'chef' || avatar.identity === 'scientist' ? '#1C1C1C' : '#fff'
  return (
    <svg width={size} height={size} viewBox="0 0 160 170" aria-hidden>
      <ellipse cx="80" cy="156" rx="36" ry="10" fill="#E8643C" opacity="0.85" />
      <path d="M80 18 L92 34 H68 Z" fill="#E8643C" />
      <circle cx="80" cy="62" r="28" fill={avatar.skin} />
      {avatar.hair !== 'bangs' && !back && <path d="M54 58c2-22 52-26 54 2-8-10-44-12-54-2z" fill={avatar.hairColor} />}
      {avatar.hair === 'bob' && <path d="M52 64c0 22 8 28 12 28 2-16 6-22 16-22s14 8 16 22c4 0 12-8 12-28-10 8-46 8-56 0z" fill={avatar.hairColor} />}
      {avatar.hair === 'pony' && <path d="M96 40c18 8 22 36 10 48" stroke={avatar.hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />}
      {avatar.hair === 'bun' && <circle cx="104" cy="40" r="10" fill={avatar.hairColor} />}
      {avatar.hair === 'braids' && (
        <>
          <path d="M58 70c-2 20 2 28 6 32" stroke={avatar.hairColor} strokeWidth="6" fill="none" />
          <path d="M102 70c2 20-2 28-6 32" stroke={avatar.hairColor} strokeWidth="6" fill="none" />
        </>
      )}
      {avatar.hair === 'spikes' && <path d="M58 52l6-14 8 12 8-16 8 16 8-12 6 14" fill={avatar.hairColor} />}
      {avatar.hair === 'curly' && <path d="M50 66c8-20 20-8 24-18 6 12 16 0 28 16 4 16-8 20-26 16-16 2-30-2-26-14z" fill={avatar.hairColor} />}
      {avatar.hair === 'bangs' && <path d="M52 58c6-16 50-18 56 2-8 8-16-2-28-2s-20 10-28 0z" fill={avatar.hairColor} />}
      {avatar.hair === 'short' && <path d="M54 56c4-16 48-18 52 2-6 4-46 4-52-2z" fill={avatar.hairColor} />}
      {!back && (
        <>
          <circle cx="70" cy="64" r="3" fill="#1C1C1C" />
          <circle cx="90" cy="64" r="3" fill="#1C1C1C" />
          <path d="M74 74c4 4 8 4 12 0" stroke="#1C1C1C" strokeWidth="2" fill="none" strokeLinecap="round" />
          {avatar.blush && (
            <>
              <ellipse cx="62" cy="72" rx="5" ry="3" fill="#F2A3A3" opacity="0.8" />
              <ellipse cx="98" cy="72" rx="5" ry="3" fill="#F2A3A3" opacity="0.8" />
            </>
          )}
        </>
      )}
      {back && <path d="M58 70c8 10 36 10 44 0" stroke={avatar.hairColor} strokeWidth="6" fill="none" />}
      <path d="M58 104c0-12 10-16 22-16s22 4 22 16v28H58z" fill={top} />
      <path d="M70 118h20v14H70z" fill={ink} opacity="0.25" />
      <path d="M62 132h14v16H62zM84 132h14v16H84z" fill="#3D4A68" />
      {avatar.hat === 'hat:cap' && <path d="M52 48h40l8 8H48z" fill="#1C1C1C" />}
      {avatar.hat === 'hat:bow' && <path d="M70 40l10 8 10-8-10 4z" fill="#E8643C" />}
      {avatar.hat === 'hat:panda' && (
        <>
          <circle cx="62" cy="46" r="8" fill="#1C1C1C" />
          <circle cx="98" cy="46" r="8" fill="#1C1C1C" />
          <circle cx="80" cy="44" r="12" fill="#F7F1EA" />
        </>
      )}
      {avatar.hat === 'hat:crown' && <path d="M58 46l6-12 8 8 8-12 8 12 8-8 6 12z" fill="#F2C14E" />}
      <text x="80" y="14" textAnchor="middle" fontSize="11" fill="#E8643C" fontFamily="ui-monospace, monospace">
        {avatar.nickname || '我'}
      </text>
    </svg>
  )
}

export function PetFace({ pet, size = 120 }: { pet: Pet; size?: number }) {
  if (pet.stage === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
        <ellipse cx="60" cy="70" rx="34" ry="40" fill="#F4E7CF" stroke="#E0C9A0" strokeWidth="3" />
        <path d="M60 32c8 10 8 18 0 26-8-8-8-16 0-26z" fill="#E8D7B8" />
        <circle cx="48" cy="68" r="3" fill="#C47B12" />
        <circle cx="72" cy="74" r="2" fill="#C47B12" />
      </svg>
    )
  }
  const s = pet.stage === 2 ? 1 : 0.82
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <g transform={`translate(${60 - 60 * s} ${70 - 70 * s}) scale(${s})`}>
        <ellipse cx="60" cy="96" rx="28" ry="8" fill="#000" opacity="0.08" />
        <ellipse cx="78" cy="78" rx="22" ry="16" fill="#8D5A3C" />
        <ellipse cx="46" cy="70" rx="24" ry="20" fill="#C48A62" />
        <circle cx="40" cy="62" r="14" fill="#E8B48A" />
        <circle cx="34" cy="60" r="2" fill="#1C1C1C" />
        <ellipse cx="28" cy="66" rx="6" ry="4" fill="#F2A3A3" />
        <path d="M70 86c10 8 18 4 22-2" stroke="#6B4A2A" strokeWidth="3" fill="none" />
        {pet.stage === 2 && <circle cx="92" cy="40" r="6" fill="#F2C14E" />}
      </g>
    </svg>
  )
}

export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${n} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'on' : 'off'}>
          ★
        </span>
      ))}
    </span>
  )
}
