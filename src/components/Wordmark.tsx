/**
 * Official RENOVAX lettering cropped from the original owner-supplied image.
 * viewBox clips only the symbol at the left, never the final X.
 * Original transparent square: 4500 × 4500 px.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`renovax-wordmark ${className}`.trim()}
      viewBox="1460 2000 2610 800"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Renovax"
    >
      <image href="/renovax-logo.png" x="0" y="0" width="4500" height="4500" />
    </svg>
  );
}
