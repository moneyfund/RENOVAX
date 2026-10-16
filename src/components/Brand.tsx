/** Original RENOVAX mark, added by the project owner to the repository. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand brand-official${compact ? " is-compact" : ""}`}>
      <span className="brand-image-frame" aria-hidden="true">
        <img src="/renovax-logo.png" alt="" decoding="async" />
      </span>
      <span className="sr-only">RENOVAX OS · Tecnología con propósito</span>
    </div>
  );
}
