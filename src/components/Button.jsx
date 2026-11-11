export function Button({ variant = 'dark', className = '', ...props }) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props} />;
}
