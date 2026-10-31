import { HAIR, HAIR_COLORS, SKINS, SHOP, buyItem } from '../game/progress'
import type { Avatar, Save } from '../game/types'
import { AvatarFace, Bi } from '../ui'

const HAIR_ZH: Record<string, [string, string]> = {
  short: ['短髮', 'Short'],
  bob: ['鮑伯頭', 'Bob'],
  pony: ['馬尾', 'Ponytail'],
  bun: ['丸子頭', 'Bun'],
  braids: ['辮子', 'Braids'],
  spikes: ['刺刺頭', 'Spikes'],
  curly: ['捲髮', 'Curly'],
  bangs: ['瀏海', 'Bangs'],
}

export function CreateScreen({ save, onSave, onDone }: { save: Save; onSave: (s: Save) => void; onDone: () => void }) {
  const avatar: Avatar = save.avatar || {
    nickname: '',
    hair: 'bob',
    hairColor: HAIR_COLORS[0],
    skin: SKINS[0],
    blush: true,
    identity: 'explorer',
    hat: null,
    facing: 'front',
  }
  function patch(p: Partial<Avatar>) {
    onSave({ ...save, avatar: { ...avatar, ...p } })
  }
  return (
    <div className="center">
      <div className="card" style={{ width: 'min(860px, 100%)' }}>
        <div className="kicker">MY CHARACTER</div>
        <h1>
          <Bi zh="捏一個自己" en="Make your character" />
        </h1>
        <div className="grid2">
          <div>
            <AvatarFace avatar={{ ...avatar, nickname: avatar.nickname || '我' }} />
            <button className="chip" onClick={() => patch({ facing: avatar.facing === 'front' ? 'back' : 'front' })}>
              <Bi zh={avatar.facing === 'front' ? '看背面' : '看正面'} en={avatar.facing === 'front' ? 'Turn around' : 'Face me'} />
            </button>
          </div>
          <div>
            <label className="field">
              <Bi zh="名字（只存在這台裝置）" en="Name (stays on this device)" />
              <input value={avatar.nickname} maxLength={12} onChange={(e) => patch({ nickname: e.target.value })} />
            </label>
            <h3>
              <Bi zh="髮型" en="Hair" />
            </h3>
            <div className="chips">
              {HAIR.map((h) => (
                <button key={h} className={`chip ${avatar.hair === h ? 'on' : ''}`} onClick={() => patch({ hair: h })}>
                  <Bi zh={HAIR_ZH[h][0]} en={HAIR_ZH[h][1]} />
                </button>
              ))}
            </div>
            <h3>
              <Bi zh="髮色" en="Hair color" />
            </h3>
            <div className="swatches">
              {HAIR_COLORS.map((c) => (
                <button key={c} className={`swatch ${avatar.hairColor === c ? 'on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => patch({ hairColor: c })} />
              ))}
            </div>
            <h3>
              <Bi zh="膚色" en="Skin" />
            </h3>
            <div className="swatches">
              {SKINS.map((c) => (
                <button key={c} className={`swatch ${avatar.skin === c ? 'on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => patch({ skin: c })} />
              ))}
            </div>
            <button className={`chip ${avatar.blush ? 'on' : ''}`} onClick={() => patch({ blush: !avatar.blush })}>
              <Bi zh="腮紅" en="Blush" />
            </button>
            <h3>
              <Bi zh="身分造型" en="Look" />
            </h3>
            <div className="chips">
              <button className={`chip ${avatar.identity === 'explorer' ? 'on' : ''}`} onClick={() => patch({ identity: 'explorer' })}>
                <Bi zh="小探險家" en="Explorer" />
              </button>
              {SHOP.filter((s) => s.slot === 'identity').map((s) => (
                <button
                  key={s.id}
                  className={`chip ${avatar.identity === s.value ? 'on' : ''}`}
                  onClick={() => {
                    if (!s.value) return
                    if (!save.owned.includes(s.id)) {
                      const bought = buyItem({ ...save, avatar }, s.id)
                      if (bought.error) return
                      onSave(bought.save)
                    } else patch({ identity: s.value })
                  }}
                >
                  <Bi zh={`${s.zh}${save.owned.includes(s.id) ? '' : ` · ${s.cost}🐚`}`} en={s.en} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <h3>
          <Bi zh="帽子" en="Hats" />
        </h3>
        <div className="list">
          <button className="shop" onClick={() => patch({ hat: null })}>
            <Bi zh="不戴帽子" en="No hat" />
          </button>
          {SHOP.filter((s) => s.slot === 'hat').map((s) => (
            <button
              key={s.id}
              className="shop"
              onClick={() => {
                const bought = buyItem({ ...save, avatar }, s.id)
                if (bought.error === 'shells') return
                onSave(bought.save)
              }}
            >
              <Bi zh={s.zh} en={s.en} />
              <span>{save.owned.includes(s.id) ? (avatar.hat === s.id ? '✓' : '') : `${s.cost} 🐚`}</span>
            </button>
          ))}
        </div>
        <button className="btn wide" style={{ marginTop: 16 }} disabled={!avatar.nickname.trim()} onClick={onDone}>
          <Bi zh="出發" en="Let’s go" />
        </button>
      </div>
    </div>
  )
}
