
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
      {/* <LoadingSpinner size="lg" /> */}
      <LoaderIcon strokeWidth={5} size={125} color="#2563eb" />
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


export function LoaderIcon({ strokeWidth = 2, size = 40, color = '#2563eb' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block', background: 'none' }}
    >
      <g>
        <path
          d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
          strokeDasharray="42.76482137044271 42.76482137044271"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeLinecap="round"
          fill="none"
          style={{
            transform: 'scale(0.8)',
            transformOrigin: '50px 50px',
          }}
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;256.58892822265625"
            keyTimes="0;1"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}