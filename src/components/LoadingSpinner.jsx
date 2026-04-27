export function LoadingSpinner({ size = 'md', label = '', className = '' }) {
  const sizeClass = size === 'sm' ? 'loading-spinner-sm' : size === 'lg' ? 'loading-spinner-lg' : 'loading-spinner-md';
  const classes = ['loading-spinner', sizeClass, className].filter(Boolean).join(' ');
  return (
    <span className="loading-spinner-wrap" role="status" aria-live="polite">
      <span className={classes} aria-hidden="true" />
      {label ? <span className="loading-spinner-label">{label}</span> : null}
    </span>
  );
}

export function LoadingPanel({ title, message }) {
  return (
    <div className="loading-panel">
      <LoadingSpinner size="lg" />
      {title ? <h2>{title}</h2> : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}

export function InlineLoadingState({ title = 'Loading', message = '' }) {
  return (
    <div className="inline-loading-state">
      <LoadingSpinner size="lg" />
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
