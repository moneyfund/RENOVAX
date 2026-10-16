import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LockKeyhole, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import { MODULES } from "@/data";
import type { ModuleId, Observation } from "@/types";
import type { Workspace } from "@/hooks/useWorkspace";
import type { Sensors } from "@/hooks/useSensors";
import { isFreshLocation } from "@/lib/telemetry";
export function ObservationDialog({
  open,
  onOpenChange,
  initialModule,
  workspace,
  sensors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModule: ModuleId;
  workspace: Workspace;
  sensors: Sensors;
}) {
  const [type, setType] = useState<ModuleId>(initialModule),
    [level, setLevel] = useState<Observation["level"]>("observación"),
    [note, setNote] = useState(""),
    [attachLocation, setAttachLocation] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const location = sensors.location;
      if (attachLocation && (sensors.gpsStatus !== "active" || !isFreshLocation(location))) {
        throw new Error("Activa el GPS y espera una lectura reciente para asociarla al registro.");
      }
      await workspace.save(type, level, note, attachLocation && isFreshLocation(location)
        ? { lat: location.lat, lng: location.lng, accuracy: location.accuracy } : undefined);
      setNote("");
      setAttachLocation(false);
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
    >
      <DialogContent>
        <span className="micro purple">REGISTRO DE CAMPO / NUEVA ENTRADA</span>
        <DialogTitle className="dialog-title">
          Cada observación cuenta.
        </DialogTitle>
        <DialogDescription className="dialog-description">
          Registra lo que puedes verificar. Este registro no genera una alerta
          automática.
        </DialogDescription>
        <form onSubmit={(e) => void submit(e)} className="observation-form">
          <div className="form-two">
            <label>
              Módulo
              <Select
                label="Módulo del registro"
                value={type}
                onValueChange={(v) => setType(v as ModuleId)}
                options={MODULES.map((m) => ({ value: m.id, label: m.title }))}
              />
            </label>
            <label>
              Clasificación
              <Select
                label="Clasificación del registro"
                value={level}
                onValueChange={(v) => setLevel(v as Observation["level"])}
                options={[
                  { value: "observación", label: "Observación" },
                  { value: "revisión", label: "Requiere revisión" },
                  { value: "prueba", label: "Prueba controlada" },
                ]}
              />
            </label>
          </div>
          <label htmlFor="observation-note">Descripción</label>
          <textarea
            id="observation-note"
            required
            minLength={1}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="¿Qué observaste? Incluye el lugar y los detalles relevantes."
            rows={5}
          />
          <div className="observation-geotag">
            <label className="geo-checkbox">
              <input type="checkbox" checked={attachLocation} onChange={(e) => setAttachLocation(e.target.checked)} />
              <MapPin size={16} />
              <span>Adjuntar ubicación al registro <small>Opcional · solo visible para tu cuenta</small></span>
            </label>
            {attachLocation && (sensors.gpsStatus !== "active" || !isFreshLocation(sensors.location)) && (
              <Button type="button" size="sm" variant="outline" onClick={() => void sensors.startGPS()}>Activar GPS</Button>
            )}
            {attachLocation && sensors.gpsStatus === "active" && isFreshLocation(sensors.location) && (
              <span className="micro">PRECISIÓN ± {Math.round(sensors.location.accuracy)} m</span>
            )}
          </div>
          <div className="form-note">
            <span>
              <LockKeyhole size={12} />
              {workspace.user && workspace.online
                ? "Tu cuenta privada"
                : "Solo en este dispositivo"}
            </span>
            <span>{note.length} / 500</span>
          </div>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <Button
              variant="ghost"
              type="button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !note.trim()}>
              {busy ? "Guardando…" : "Guardar observación"}
              <ArrowRight />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
