import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import type { MotionReading } from "@/types";
export function SignalPlot({ reading }: { reading: MotionReading | null }) {
  const [samples, setSamples] = useState<MotionReading[]>([]);
  useEffect(() => {
    if (reading) setSamples((values) => [...values, reading].slice(-100));
    else setSamples([]);
  }, [reading]);
  const max = Math.max(
    10,
    ...samples.flatMap((p) => [Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)]),
  );
  return (
    <section className="signal-panel">
      <div className="instrument-heading">
        <div>
          <span className="micro">INSTRUMENTO / ACELERACIÓN</span>
          <h2>Movimiento, en tiempo real.</h2>
        </div>
        <span className="instrument-unit">m/s²</span>
      </div>
      <div className="signal-plot">
        <svg
          viewBox="0 0 800 280"
          preserveAspectRatio="none"
          role="img"
          aria-label={
            reading
              ? "Gráfica de aceleración de los ejes X, Y y Z"
              : "Sin lecturas del acelerómetro"
          }
        >
          <defs>
            <pattern
              id="signal-grid"
              width="40"
              height="35"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 35"
                fill="none"
                stroke="currentColor"
                strokeWidth=".7"
              />
            </pattern>
          </defs>
          <rect width="800" height="280" fill="url(#signal-grid)" />
          <path d="M0 140H800" stroke="currentColor" strokeDasharray="4 6" />
          {(["x", "y", "z"] as const).map((axis, index) => (
            <polyline
              key={axis}
              points={samples
                .map(
                  (s, i) => `${(i * 800) / 99},${140 - (s[axis] / max) * 120}`,
                )
                .join(" ")}
              fill="none"
              stroke={["#c4a5ff", "#8875a9", "#ece4f8"][index]}
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {!samples.length && (
          <div className="signal-empty">
            <Activity size={25} />
            <strong>Esperando una señal.</strong>
            <span>Activa el acelerómetro para comenzar.</span>
          </div>
        )}
        <span className="plot-label top">+{max.toFixed(0)}</span>
        <span className="plot-label middle">0</span>
        <span className="plot-label bottom">−{max.toFixed(0)}</span>
      </div>
      <div className="signal-values">
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis}>
            <span className="micro">EJE {axis.toUpperCase()}</span>
            <strong>{reading?.[axis].toFixed(2) ?? "—"}</strong>
          </div>
        ))}
        <div>
          <span className="micro">RESULTANTE</span>
          <strong>{reading?.magnitude.toFixed(2) ?? "—"}</strong>
        </div>
      </div>
      <p className="instrument-note">
        {reading?.includesGravity
          ? "Lectura con gravedad incluida. "
          : "Lectura local de movimiento. "}
        No determina la magnitud de un sismo ni emite alertas sísmicas.
      </p>
    </section>
  );
}
