/** A full-width card with a title, small text and an on/off switch. */
export function ToggleRow({ on, onToggle, name, short, color, testId }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} onClick={onToggle}
      className={`toggle-row ${on ? '' : 'off'}`} data-testid={testId}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {color && <span className="dot" style={{ background: color }} />}
        <span>
          <span className="name" style={{ display: 'block' }}>{name}</span>
          {short && <span className="short" style={{ display: 'block' }}>{short}</span>}
        </span>
      </span>
      <span className={`switch ${on ? 'on' : ''}`} />
    </button>
  );
}
