import { useRef, useState, useEffect } from "react";
import { Activity, LocateFixed, Volume2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import type { Sensors } from "@/hooks/useSensors";
import type { SensorStatus } from "@/types";
const status: Record<SensorStatus, string> = {
  inactive: "En espera",
  requesting: "Esperando señal…",
  active: "Lectura activa",
  denied: "Permiso denegado",
  unavailable: "Sin señal disponible",
  unsupported: "No compatible",
};
export function SensorReadout({
  sensors,
  compact = false,
}: {
  sensors: Sensors;
  compact?: boolean;
}) {
  const [soundState, setSoundState] = useState("Prueba de salida");
  const audio = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
    },
    [],
  );
  async function sound() {
    try {
      if (audio.current) await audio.current.close();
      const context = new AudioContext();
      audio.current = context;
      await context.resume();
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.32);
      oscillator.onended = () => {
        void context.close();
        if (audio.current === context) audio.current = null;
      };
      setSoundState("Prueba emitida");
    } catch {
      setSoundState("Audio no disponible");
    }
  }
  const gpsOn = ["active", "requesting"].includes(sensors.gpsStatus),
    motionOn = ["active", "requesting"].includes(sensors.motionStatus);
  return (
    <div className={`sensor-readout ${compact ? "compact" : ""}`}>
      <div className="sensor-line">
        <LocateFixed />
        <div>
          <strong>Ubicación GPS</strong>
          <small>{status[sensors.gpsStatus]}</small>
        </div>
        <Switch
          aria-label="Activar ubicación GPS"
          checked={gpsOn}
          onCheckedChange={(on) =>
            on ? sensors.startGPS() : sensors.stopGPS()
          }
        />
      </div>
      {sensors.location && (
        <div className="coordinate-readout">
          <span>
            LAT <b>{sensors.location.lat.toFixed(5)}°</b>
          </span>
          <span>
            LON <b>{sensors.location.lng.toFixed(5)}°</b>
          </span>
          <span>
            PRECISIÓN <b>± {Math.round(sensors.location.accuracy)} m</b>
          </span>
        </div>
      )}
      <div className="sensor-line">
        <Activity />
        <div>
          <strong>Acelerómetro</strong>
          <small>{status[sensors.motionStatus]}</small>
        </div>
        <Switch
          aria-label="Activar acelerómetro"
          checked={motionOn}
          onCheckedChange={(on) =>
            on ? void sensors.startMotion() : sensors.stopMotion()
          }
        />
      </div>
      <div className="axis-readout">
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis}>
            <span>{axis.toUpperCase()}</span>
            <div>
              <i
                style={{
                  width: `${Math.min(100, Math.abs(sensors.motion?.[axis] ?? 0) * 6)}%`,
                }}
              />
            </div>
            <b>{sensors.motion?.[axis].toFixed(2) ?? "—"}</b>
          </div>
        ))}
        <small>
          m/s²{" "}
          {sensors.motion?.includesGravity
            ? "· incluye gravedad"
            : "· aceleración local"}
        </small>
      </div>
      {!compact && (
        <div className="sensor-line">
          <Volume2 />
          <div>
            <strong>Altavoz</strong>
            <small aria-live="polite">{soundState}</small>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Probar altavoz"
            onClick={() => void sound()}
          >
            <Volume2 />
          </Button>
        </div>
      )}
    </div>
  );
}
