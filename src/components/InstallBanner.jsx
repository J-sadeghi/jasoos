import { Button } from './Button.jsx';

export function InstallBanner({ t, kind, onDismiss, onInstall }) {
  if (!kind) return null;
  return (
    <div className="install" role="region" aria-label={t.installTitle} data-testid="install-banner">
      <div className="install-head">
        <div>
          <h2>{t.installTitle}</h2>
          <p>{t.installBody}</p>
        </div>
        <button type="button" className="close" onClick={onDismiss} aria-label="×" data-testid="install-close">×</button>
      </div>
      {kind === 'ios' && <div className="tip"><i>↑</i><div>{t.iosHint}</div></div>}
      {kind === 'generic' && <div className="tip"><i>⋮</i><div>{t.androidHint}</div></div>}
      {kind === 'android' && <Button onClick={onInstall}>{t.installBtn}</Button>}
    </div>
  );
}
