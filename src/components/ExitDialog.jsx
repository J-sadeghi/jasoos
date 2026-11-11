import { Button } from './Button.jsx';

export function ExitButton({ t, onClick }) {
  return <button type="button" className="exit" onClick={onClick} data-testid="exit">{t.home}</button>;
}

export function ExitDialog({ t, onCancel, onConfirm }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="exit-q" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 id="exit-q">{t.abandonQ}</h2>
        <p>{t.abandonHelp}</p>
        <div className="btn-row">
          <Button variant="outline" onClick={onCancel} data-testid="keep-playing" autoFocus>{t.keepPlaying}</Button>
          <Button onClick={onConfirm} data-testid="confirm-exit">{t.home}</Button>
        </div>
      </div>
    </div>
  );
}
