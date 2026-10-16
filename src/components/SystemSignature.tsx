import { useId } from "react";

/** Architectural brand illustration; it does not represent sensor readings. */
export function SystemSignature() {
  const id = useId().replace(/:/g, "");
  return (
    <div className="system-signature" aria-hidden="true">
      <svg viewBox="0 0 320 190" fill="none">
        <defs>
          <linearGradient id={`${id}-rim`} x1="45" y1="25" x2="260" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4dcff" stopOpacity=".8" />
            <stop offset=".4" stopColor="#4068ad" stopOpacity=".18" />
            <stop offset=".75" stopColor="#4068ad" stopOpacity=".05" />
            <stop offset="1" stopColor="#c1d7f7" stopOpacity=".55" />
          </linearGradient>
          <linearGradient id={`${id}-glass`} x1="160" y1="50" x2="160" y2="139" gradientUnits="userSpaceOnUse">
            <stop stopColor="#82abe3" stopOpacity=".2" />
            <stop offset="1" stopColor="#82abe3" stopOpacity=".015" />
          </linearGradient>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#4c89d6" stopOpacity=".2" />
            <stop offset="1" stopColor="#4c89d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="111" rx="151" ry="75" fill={`url(#${id}-light)`} />
        <g className="signature-orbit" stroke={`url(#${id}-rim)`}>
          <ellipse cx="160" cy="104" rx="137" ry="60" />
          <ellipse cx="160" cy="94" rx="108" ry="47" />
          <ellipse cx="160" cy="84" rx="79" ry="34" />
          <path d="M23 104v10c0 33 61 60 137 60s137-27 137-60v-10" opacity=".3" />
          <path d="M52 94v9c0 26 48 47 108 47s108-21 108-47v-9" opacity=".3" />
        </g>
        <path d="m160 44 52 30v38l-52 30-52-30V74l52-30Z" fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} />
        <path d="m108 74 52 30 52-30M160 104v38" stroke="#5e8cc7" strokeOpacity=".3" />
        <path d="m141 76 19-11 19 11-19 11-19-11Zm0 10 19 11 19-11" stroke="#4068ad" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="38" cy="76" r="2.5" fill="#5d89c2" />
        <circle cx="260" cy="113" r="2" fill="#4068ad" />
        <path d="M7 35h27M20 22v26M288 156h25M301 144v24" stroke="#4068ad" strokeOpacity=".2" />
      </svg>
      <span>RENOVAX <i>/</i> NUEVA VIDA, NUEVA MISIÓN</span>
    </div>
  );
}
