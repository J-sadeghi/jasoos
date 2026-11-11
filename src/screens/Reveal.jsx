import { Button } from '../components/Button.jsx';
import { ROLE_COLORS, isBlind } from '../game/rules.js';

export function Reveal({ t, num, game: g, nameOf, onReveal, onNext }) {
  const total = g.roles.length;
  const role = g.roles[g.turn];
  const blind = isBlind(role, g.jokerKnows);
  const desc = role === 'joker' ? (g.jokerKnows ? t.jokerDescKnows : t.jokerDescBlind) : t.roles[role][2];
  const pct = Math.round(((g.turn + (g.revealed ? 1 : 0)) / total) * 100);
  const last = g.turn + 1 >= total;

  return (
    <main className={`screen ${g.revealed && role === 'spy' ? 'spy' : ''}`} data-testid="reveal">
      <div className="progress-head with-exit">
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          <span>{t.dealing}</span>
          <span data-testid="progress">{num(g.turn + 1)} {t.of} {num(total)}</span>
        </div>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="center">
        {!g.revealed ? (
          <div className="pass" key={`pass-${g.turn}`}>
            <div className="muted" style={{ fontSize: 15 }}>{t.passTo}</div>
            <div className="who" data-testid="pass-name">{nameOf(g.turn)}</div>
            <button type="button" className="reveal-btn" onClick={onReveal} data-testid="show-role">
              <b>{t.showRole}</b>
              <small>{t.onlyYou}</small>
            </button>
          </div>
        ) : (
          <div className="shown" key={`shown-${g.turn}`}>
            <div style={{ fontSize: 14, color: 'rgba(23,19,15,.5)', display: 'flex', gap: 6 }}>
              <span>{nameOf(g.turn)}</span><span>—</span><span>{t.yourRole}</span>
            </div>
            <div className="role" style={{ color: ROLE_COLORS[role] }} data-testid="role-name" data-role={role}>{t.roles[role][0]}</div>
            <p className="desc">{desc}</p>
            <div className="card word-card">
              <small>{blind ? t.noWord : t.secretWord}</small>
              <b data-testid="word">{blind ? t.qqq : g.word}</b>
            </div>
            {g.tellSpies && (
              <div className="spy-count" data-testid="spy-count">{t.spiesInRound} {num(g.spyCount)}</div>
            )}
            <Button onClick={onNext} data-testid="next">{last ? t.startTalk : t.nextSeen}</Button>
          </div>
        )}
      </div>
    </main>
  );
}
