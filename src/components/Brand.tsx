import { Wordmark } from "./Wordmark";

/** Text-only official RENOVAX wordmark; the independent R is for the favicon. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand brand-official${compact ? " is-compact" : ""}`}>
      <Wordmark className="navigation-wordmark" />
    </div>
  );
}
