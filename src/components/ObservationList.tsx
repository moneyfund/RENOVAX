import { FileText, Download, ArrowUpRight } from "lucide-react";
import type { Observation } from "@/types";
import { MODULES } from "@/data";
import { formatTime } from "@/lib/utils";
import { downloadRecords } from "@/lib/storage";
import { Button } from "./ui/button";
export function ObservationList({
  records,
  full = false,
  onMore,
  onNew,
}: {
  records: Observation[];
  full?: boolean;
  onMore?: () => void;
  onNew: () => void;
}) {
  return (
    <section className="log-section">
      <div className="section-heading">
        <div>
          <span className="micro">
            REGISTRO / {String(records.length).padStart(2, "0")}
          </span>
          <h2>{full ? "Observaciones de campo" : "Actividad reciente"}</h2>
        </div>
        {full ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!records.length}
            onClick={() => downloadRecords(records)}
          >
            <Download />
            Exportar JSON
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onMore}>
            Ver bitácora
            <ArrowUpRight />
          </Button>
        )}
      </div>
      {records.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Observación</th>
                <th>Origen</th>
                <th>Fecha · Nicaragua</th>
              </tr>
            </thead>
            <tbody>
              {(full ? records : records.slice(0, 4)).map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className="table-module">
                      {MODULES.find((m) => m.id === o.type)?.short}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`log-level ${o.level === "revisión" ? "review" : ""}`}
                    >
                      {o.level}
                    </span>
                    <p>{o.note}</p>
                  </td>
                  <td>
                    <span className="storage-tag">
                      {o.cloud ? "Cuenta privada" : "Este dispositivo"}
                    </span>
                  </td>
                  <td className="table-time">{formatTime(o.localTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-log">
          <FileText size={23} strokeWidth={1.3} />
          <div>
            <strong>Una bitácora en blanco. Muchas posibilidades.</strong>
            <p>Tus observaciones aparecerán aquí, con su fecha y origen.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onNew}>
            Crear registro
            <ArrowUpRight />
          </Button>
        </div>
      )}
    </section>
  );
}
