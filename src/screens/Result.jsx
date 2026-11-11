import { Button } from '../components/Button.jsx';
import { ROLE_COLORS, RESULT_COLORS, resultTextKey } from '../game/rules.js';

export function Result({ t, game: g, nameOf, onHome, onAgain }) {
  const [title, kicker] = t.res[resultTextKey(g.result, g.spyCount)];
  return (
    <main className="screen" data-testid="result" data-result={g.result}>
      <div className="result-head">
        <small data-testid="result-kicker">{kicker}</small>
        <h1 style={{ color: RESULT_COLORS[g.result] }} data-testid="result-title">{title}</h1>
      </div>
      <div className="card center-card final">
        <small>{t.secretWord}</small>
        <b data-testid="final-word">{g.word}</b>
      </div>
      <div className="label">{t.rolesTitle}</div>
      <div className="stack" style={{ gap: 8 }}>
        {g.roles.map((r, i) => (
          <div className="final-row" key={i} data-testid="final-row">
            <span>{nameOf(i)}</span>
            <span style={{ color: ROLE_COLORS[r] }}>{t.roles[r][0]}</span>
          </div>
        ))}
      </div>
      <div className="spacer" />
      <div className="btn-row">
        <Button variant="outline" onClick={onHome} data-testid="home">{t.home}</Button>
        <Button onClick={onAgain} style={{ boxShadow: 'none', fontSize: 18 }} data-testid="again">{t.nextRound}</Button>
      </div>
    </main>
  );
}
