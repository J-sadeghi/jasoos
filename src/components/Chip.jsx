export function Chip({ on, className = '', ...props }) {
  return <button type="button" aria-pressed={!!on} className={`chip ${on ? 'on' : ''} ${className}`} {...props} />;
}
