export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M9 30V10h13c6 0 9 3 9 7s-3 7-9 7H16m6 0 10 10" />
        <path d="m29 8 5 5" className="brand-spark" />
      </svg>
      {!compact && (
        <span>
          RENOVAX<span className="brand-os">OS</span>
          <small>TECNOLOGÍA CON PROPÓSITO</small>
        </span>
      )}
    </div>
  );
}
