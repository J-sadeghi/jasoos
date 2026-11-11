import { Button } from '../components/Button.jsx';

const R = 45; // ring radius in the 100×100 svg
const C = 2 * Math.PI * R;

export function Round({ t, num, game: g, left, nameOf, onRoll, onPause, onVote }) {
  const running = g.timer.endAt != null;
  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const done = 1 - left / Math.max(1, g.timer.total);
  const [a, b] = g.ask;

  return (
    <main className="screen" data-testid="round">
      <div className="round-top">
        <span>{t.discussRound}</span>
        {g.tellSpies && <span className="spy-count" data-testid="spy-count">{t.spiesInRound} {num(g.spyCount)}</span>}
      </div>
      <div className="center" style={{ gap: 24 }}>
        <div className="ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="track" cx="50" cy="50" r={R} />
            <circle className="fill" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - done)} />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div className="clock" dir="ltr" role="timer" data-testid="clock">{num(mm)}:{num(String(ss).padStart(2, '0'))}</div>
            <div className="clock-hint">{left === 0 ? t.timeUp : running ? t.talking : t.paused}</div>
          </div>
        </div>
        <div className="card center-card">
          <small>{t.askTurn}</small>
          <div className="ask ask-anim" key={`${a}-${b}`} data-testid="ask">
            <span className="nm">{nameOf(a)}</span><span>{t.asksMid}</span><span className="nm">{nameOf(b)}</span>
            {t.asksEnd && <span>{t.asksEnd}</span>}
          </div>
          <Button variant="soft" onClick={onRoll} data-testid="roll">{t.nextDraw}</Button>
        </div>
        <p className="vague">{t.vague}</p>
      </div>
      <div className="btn-row">
        <Button variant="outline" onClick={onPause} data-testid="pause">{running ? t.pause : t.resume}</Button>
        <Button onClick={onVote} data-testid="to-vote" style={{ boxShadow: 'none' }}>{t.voteTime}</Button>
      </div>
    </main>
  );
}
