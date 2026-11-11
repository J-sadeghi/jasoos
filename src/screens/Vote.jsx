import { Button } from '../components/Button.jsx';
import { NO_SPY } from '../game/rules.js';

export function Vote({ t, game: g, nameOf, onChoose, onConfirm }) {
  const has = g.choice != null;
  return (
    <main className="screen" data-testid="vote">
      <h1 className="h-title with-exit" style={{ margin: 0 }}>{t.voting}</h1>
      <p className="muted" style={{ fontSize: 14.5, margin: '4px 0 14px', lineHeight: 1.9 }}>{t.voteHelp}</p>
      {g.notice && <div className="notice" role="status" key={g.notice + g.immune.length} data-testid="notice">{t[g.notice]}</div>}
      <div className="stack" role="radiogroup" aria-label={t.voting}>
        {g.roles.map((_, i) => (
          <button type="button" key={i} role="radio" aria-checked={g.choice === i}
            className={`pick ${g.choice === i ? 'on' : ''}`} onClick={() => onChoose(i)} data-testid={`vote-${i}`}>
            <span>{nameOf(i)}</span>
            <small>{g.choice === i ? t.accused : ''}</small>
          </button>
        ))}
        <button type="button" role="radio" aria-checked={g.choice === NO_SPY}
          className={`pick nospy ${g.choice === NO_SPY ? 'on' : ''}`} onClick={() => onChoose(NO_SPY)} data-testid="vote-none">
          <span>{t.noSpy}</span>
        </button>
      </div>
      <div className="spacer" />
      <Button className={has ? '' : 'btn-disabled'} onClick={onConfirm} disabled={!has}
        style={{ marginTop: 16, flex: 'none', boxShadow: 'none', fontSize: 18 }} data-testid="confirm-vote">
        {has ? t.confirmVote : t.pickSomeone}
      </Button>
    </main>
  );
}
