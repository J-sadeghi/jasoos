import { useState } from 'react';
import { Button } from '../components/Button.jsx';
import { Chip } from '../components/Chip.jsx';
import { Stepper } from '../components/Stepper.jsx';
import { ToggleRow } from '../components/ToggleRow.jsx';
import { SPECIALS, ROLE_COLORS, MIN_PLAYERS, MAX_PLAYERS, clamp, planSpecials } from '../game/rules.js';
import { TIME_PRESETS, MIN_MINUTES, MAX_MINUTES } from '../game/settings.js';
import { fill } from '../i18n/index.js';

export function Setup({ t, num, lang, settings: s, update, poolSize, onBack, onStart }) {
  const [editNames, setEditNames] = useState(false);
  const cats = t.cats;
  const selected = s.cats[lang];

  const setPlayers = (players) => update((p) => ({
    ...p,
    players: clamp(players, MIN_PLAYERS, MAX_PLAYERS),
    spies: Math.min(p.spies, clamp(players, MIN_PLAYERS, MAX_PLAYERS)), // fewer players than spies → lower spies
  }));
  const setSpies = (spies) => update((p) => ({ ...p, spies: clamp(spies, 0, p.players) }));
  const setMinutes = (m) => update((p) => ({ ...p, minutes: clamp(m, MIN_MINUTES, MAX_MINUTES) }));
  const setName = (i, v) => update((p) => { const names = [...p.names]; names[i] = v; return { ...p, names }; });
  const setCats = (list) => update((p) => ({ ...p, cats: { ...p.cats, [lang]: [...list].sort((a, b) => a - b) } }));

  const allOn = selected.length === cats.length;
  const toggleAll = () => setCats(allOn ? [0] : cats.map((_, i) => i));
  const toggleCat = (i) => {
    const next = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i];
    setCats(next.length ? next : [i]); // at least one category stays selected
  };

  const { skipped } = planSpecials(s.players, s.spies, s.on);
  const specialsNote = skipped.length
    ? fill(s.spies === 1 ? t.noteSkipOne : t.noteSkip, {
      players: num(s.players), spies: num(s.spies), roles: skipped.map((k) => t.roles[k][0]).join(t.listSep),
    })
    : t.noteOk;

  return (
    <main className="screen">
      <button type="button" className="back" onClick={onBack} data-testid="back">{t.back}</button>
      <h1 className="h-title">{t.setup}</h1>

      {/* players */}
      <div className="label">{t.playerCount}</div>
      <div className="card stepper-card">
        <Stepper testId="players" label={t.playerCount} value={num(s.players)}
          onDec={() => setPlayers(s.players - 1)} onInc={() => setPlayers(s.players + 1)}
          decDisabled={s.players <= MIN_PLAYERS} incDisabled={s.players >= MAX_PLAYERS} />
      </div>
      <button type="button" className="dashed" onClick={() => setEditNames((v) => !v)} data-testid="edit-names">
        {editNames ? t.closeNames : t.editNames}
      </button>
      {editNames && (
        <div className="names">
          {Array.from({ length: s.players }, (_, i) => (
            <label className="name-row" key={i}>
              <span className="name-num">{num(i + 1)}</span>
              <input value={s.names[i] || ''} onChange={(e) => setName(i, e.target.value)} maxLength={24}
                placeholder={`${t.player} ${num(i + 1)}`} dir="auto" enterKeyHint="next" autoComplete="off"
                data-testid={`name-${i}`} />
            </label>
          ))}
          <button type="button" className="link-btn" onClick={() => update((p) => ({ ...p, names: [] }))}>{t.resetNames}</button>
        </div>
      )}

      {/* spies */}
      <div className="label">{t.spyCount}</div>
      <div className="card stepper-card">
        <Stepper testId="spies" label={t.spyCount} value={num(s.spies)}
          onDec={() => setSpies(s.spies - 1)} onInc={() => setSpies(s.spies + 1)}
          decDisabled={s.spies <= 0} incDisabled={s.spies >= s.players} />
      </div>
      <div style={{ marginTop: 9 }}>
        <ToggleRow testId="tell-spies" on={s.tellSpies} name={t.tellSpies} short={t.tellSpiesHelp}
          onToggle={() => update((p) => ({ ...p, tellSpies: !p.tellSpies }))} />
      </div>

      {/* categories */}
      <div className="row-label">
        <div className="label">{t.wordCategory}</div>
        <div className="hint" data-testid="cat-count">
          {num(poolSize)} {t.catCountA} {num(selected.length)} {t.catCountB}
        </div>
      </div>
      <div className="chips">
        <Chip on={allOn} onClick={toggleAll} data-testid="cat-all">{t.allCats}</Chip>
        {cats.map((c, i) => (
          <Chip key={c.name} on={selected.includes(i)} onClick={() => toggleCat(i)} data-testid={`cat-${i}`}>{c.name}</Chip>
        ))}
      </div>

      {/* time */}
      <div className="label">{t.discussTime}</div>
      <div className="times">
        {TIME_PRESETS.map((m) => (
          <button type="button" key={m} className={`time ${m === s.minutes ? 'on' : ''}`} aria-pressed={m === s.minutes}
            onClick={() => setMinutes(m)} data-testid={`time-${m}`}>
            <b>{num(m)}</b><small>{t.minutes}</small>
          </button>
        ))}
      </div>
      <div className={`card custom ${TIME_PRESETS.includes(s.minutes) ? '' : 'on'}`}>
        <div style={{ paddingInlineStart: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t.customTime}</div>
          <div className="hint" style={{ marginTop: 2 }}>{t.customHint}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stepper small testId="minutes" label={t.customTime} value={num(s.minutes)}
            onDec={() => setMinutes(s.minutes - 1)} onInc={() => setMinutes(s.minutes + 1)}
            decDisabled={s.minutes <= MIN_MINUTES} incDisabled={s.minutes >= MAX_MINUTES} />
        </div>
      </div>

      {/* special roles */}
      <div className="label">{t.specialRoles}</div>
      <div className="stack">
        {SPECIALS.map((k) => (
          <ToggleRow key={k} testId={`role-${k}`} on={s.on[k]} name={t.roles[k][0]} short={t.roles[k][1]} color={ROLE_COLORS[k]}
            onToggle={() => update((p) => ({ ...p, on: { ...p.on, [k]: !p.on[k] } }))} />
        ))}
      </div>
      {s.on.joker && (
        <div className="card sub-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{t.jokerKnowsQ}</div>
          <div className="hint" style={{ marginBottom: 10, color: 'rgba(23,19,15,.5)' }}>{t.jokerKnowsHelp}</div>
          <div className="pair">
            <Chip on={s.jokerKnows} onClick={() => update((p) => ({ ...p, jokerKnows: true }))} data-testid="joker-knows">{t.jokerYes}</Chip>
            <Chip on={!s.jokerKnows} onClick={() => update((p) => ({ ...p, jokerKnows: false }))} data-testid="joker-blind">{t.jokerNo}</Chip>
          </div>
        </div>
      )}
      <div className="hint" style={{ marginTop: 8 }} data-testid="specials-note">{specialsNote}</div>

      {/* extras */}
      <div className="label">{t.options}</div>
      <ToggleRow testId="sound" on={s.sound} name={t.sound} short={t.soundHelp}
        onToggle={() => update((p) => ({ ...p, sound: !p.sound }))} />

      <div className="spacer" />
      <Button variant="accent" onClick={onStart} style={{ marginTop: 18, flex: 'none' }} data-testid="start">{t.startDeal}</Button>
    </main>
  );
}
