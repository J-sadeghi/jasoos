import { Button } from '../components/Button.jsx';
import { Chip } from '../components/Chip.jsx';
import { Footer } from '../components/Footer.jsx';
import { LANGS } from '../i18n/index.js';

export function Home({ t, lang, onLang, onSetup, onRules }) {
  return (
    <main className="screen home">
      <div className="langs">
        {Object.entries(LANGS).map(([k, L]) => (
          <Chip key={k} on={k === lang} onClick={() => onLang(k)} lang={k} data-testid={`lang-${k}`}>{L.label}</Chip>
        ))}
      </div>
      <div className="brand">
        <div className="logo" aria-hidden="true"><span /></div>
        <h1>{t.title}</h1>
        <p className="tagline">{t.tagline}</p>
      </div>
      <div className="home-actions">
        <Button onClick={onSetup} data-testid="new-game">{t.newGame}</Button>
        <Button variant="outline" onClick={onRules} data-testid="rules">{t.rules}</Button>
        <Footer t={t} />
      </div>
    </main>
  );
}
