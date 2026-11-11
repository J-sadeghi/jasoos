export function Guess({ t, game: g, nameOf, onGuess }) {
  const sep = t.dir === 'rtl' ? '، ' : ', ';
  return (
    <main className="screen" data-testid="guess">
      <div className="with-exit muted" style={{ fontSize: 14 }}>{t.spyCaught}</div>
      <h1 className="h-title" style={{ fontSize: 38, margin: '4px 0 6px', lineHeight: 1.25 }}>
        {nameOf(g.guessPlayer)}{sep}{t.guessQ}
      </h1>
      <p className="muted" style={{ fontSize: 14.5, marginTop: 0, marginBottom: 20, lineHeight: 1.9 }}>{t.guessHelp}</p>
      <div className="stack">
        {g.guessOpts.map((w) => (
          <button type="button" key={w} className="pick word" onClick={() => onGuess(w)} data-testid="guess-opt">{w}</button>
        ))}
      </div>
    </main>
  );
}
