import { ROLE_ORDER, ROLE_COLORS } from '../game/rules.js';
import { CREDIT } from '../config.js';
import { versionText } from '../components/Footer.jsx';

export function Rules({ t, onBack }) {
  return (
    <main className="screen">
      <button type="button" className="back" onClick={onBack} data-testid="back">{t.back}</button>
      <h1 className="h-title" style={{ fontSize: 38, marginBottom: 8 }}>{t.rolesTitle}</h1>
      <div className="stack" style={{ gap: 12 }}>
        {ROLE_ORDER.map((k) => (
          <section key={k} className="card role-card">
            <h3><i style={{ background: ROLE_COLORS[k] }} />{t.roles[k][0]}</h3>
            <p>{t.roles[k][2]}</p>
          </section>
        ))}
      </div>
      <h2 className="h-sub">{t.flowTitle}</h2>
      <p className="flow">{t.flowText}</p>
      <p className="flow" data-testid="flow2">{t.flowText2}</p>
      <div className="rules-foot"><span>{CREDIT}</span><span>{versionText(t)}</span></div>
    </main>
  );
}
