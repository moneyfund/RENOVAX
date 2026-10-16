import { lazy, Suspense } from "react";
import { Cpu, Smartphone } from "lucide-react";
import { SensorReadout } from "@/components/SensorReadout";
import type { Sensors } from "@/hooks/useSensors";
import type { Workspace } from "@/hooks/useWorkspace";
import { isLiveDevice } from "@/lib/telemetry";
import { formatTime } from "@/lib/utils";
const CameraPanel = lazy(() => import("@/components/CameraPanel"));
export default function Devices({
  workspace,
  sensors,
}: {
  workspace: Workspace;
  sensors: Sensors;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="micro purple">HARDWARE / LABORATORIO</span>
          <h1>Una nueva misión para tu dispositivo.</h1>
          <p>Prueba sus capacidades y decide cómo conectarlo a tu entorno.</p>
        </div>
        <Cpu size={32} strokeWidth={1} />
      </div>
      <div className="device-workspace">
        <section className="device-sensors">
          <div className="section-heading">
            <div>
              <span className="micro">
                RVX / {workspace.deviceId.slice(0, 8).toUpperCase()}
              </span>
              <h2>Sensores locales</h2>
            </div>
          </div>
          <SensorReadout sensors={sensors} />
          <p className="instrument-note">
            Las lecturas necesitan permiso del navegador. Se detienen al pasar a
            segundo plano.
          </p>
        </section>
        <Suspense
          fallback={<div className="map-loading">Preparando cámara…</div>}
        >
          <CameraPanel />
        </Suspense>
      </div>
      <section className="log-section">
        <div className="section-heading">
          <div>
            <span className="micro">RED PRIVADA</span>
            <h2>Dispositivos registrados</h2>
          </div>
          <span className="micro">{workspace.devices.length} NODOS</span>
        </div>
        {workspace.devices.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Estado</th>
                  <th>Precisión GPS</th>
                  <th>Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {workspace.devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.name}</strong>
                      <small className="device-id">
                        {d.deviceId.slice(0, 8)}
                      </small>
                    </td>
                    <td>
                      <span className="storage-tag">
                        {isLiveDevice(d)
                          ? "Transmitiendo"
                          : "Sin señal reciente"}
                      </span>
                    </td>
                    <td>
                      {Number.isFinite(d.accuracy)
                        ? `± ${Math.round(d.accuracy)} m`
                        : "—"}
                    </td>
                    <td className="table-time">
                      {d.updatedAt ? formatTime(d.updatedAt) : "Pendiente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-log">
            <Smartphone size={25} />
            <div>
              <strong>Tu red comienza con el primer nodo.</strong>
              <p>
                Conecta tu cuenta y autoriza una transmisión desde Transporte y
                GPS.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
