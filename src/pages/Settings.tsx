import {
  Database,
  Download,
  ShieldCheck,
  LogOut,
  ArrowUpRight,
  CloudOff,
  HardDrive,
  Radio,
} from "lucide-react";
import type { Workspace } from "@/hooks/useWorkspace";
import type { PWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { firebaseReady } from "@/lib/firebase";
export default function Settings({
  workspace,
  pwa,
}: {
  workspace: Workspace;
  pwa: PWA;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="micro purple">SISTEMA / PREFERENCIAS</span>
          <h1>El control también está en los detalles.</h1>
          <p>Tu identidad, tus datos y la forma en que operas.</p>
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-label">
          <Database size={21} />
          <h2>Identidad y conexión</h2>
          <p>Una cuenta privada para tus registros y dispositivos.</p>
        </div>
        <section className="settings-section">
          <div className="settings-status">
            <span className="micro">FIREBASE / FIRESTORE</span>
            <span className="pill">
              {workspace.syncError
                ? "Revisar conexión"
                : workspace.user
                  ? "Cuenta conectada"
                  : firebaseReady
                    ? "Listo para conectar"
                    : "Configuración pendiente"}
            </span>
          </div>
          <dl>
            <div>
              <dt>Cuenta</dt>
              <dd>{workspace.user?.email ?? "Sin sesión iniciada"}</dd>
            </div>
            <div>
              <dt>Almacenamiento</dt>
              <dd>
                {workspace.user
                  ? "Colecciones privadas por usuario"
                  : "Este dispositivo"}
              </dd>
            </div>
            <div>
              <dt>Telemetría</dt>
              <dd>
                {workspace.sharing
                  ? "Transmitiendo con autorización"
                  : "Desactivada"}
              </dd>
            </div>
          </dl>
          {!firebaseReady && (
            <p className="setting-hint">
              La integración está preparada. Falta asociar el proyecto de
              Firebase para habilitar cuentas y sincronización.
            </p>
          )}
          {workspace.syncError && (
            <p className="inline-error">
              No se pudieron leer los datos privados. Verifica las reglas y los
              índices de Firestore.
            </p>
          )}
          <div className="settings-actions">
            <Button
              disabled={!firebaseReady || workspace.authBusy}
              onClick={() =>
                void (workspace.user ? workspace.signOut() : workspace.signIn())
              }
            >
              {workspace.user ? <LogOut /> : <ShieldCheck />}
              {workspace.authBusy
                ? "Conectando…"
                : workspace.user
                  ? "Cerrar sesión"
                  : "Conectar con Google"}
            </Button>
            <a
              className="text-link"
              href="https://github.com/moneyfund/RENOVAX#firebase-opcional"
              target="_blank"
              rel="noreferrer"
            >
              Guía de conexión
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
        <div className="settings-label">
          <Download size={21} />
          <h2>Siempre a mano</h2>
          <p>Instala tu centro de control como aplicación.</p>
        </div>
        <section className="settings-section">
          <h3>RENOVAX, en su propio espacio.</h3>
          <p>
            Acceso directo, una ventana dedicada y registros locales disponibles
            sin conexión tras la primera carga.
          </p>
          <div className="offline-features">
            <span>
              <HardDrive size={16} />
              Interfaz y bitácora local
            </span>
            <span>
              <CloudOff size={16} />
              El mapa requiere conexión
            </span>
          </div>
          <Button variant="outline" onClick={() => void pwa.install()}>
            <Download />
            {pwa.installed ? "Aplicación instalada" : "Instalar RENOVAX OS"}
          </Button>
          {pwa.update && (
            <Button className="ml-2" onClick={pwa.applyUpdate}>
              Actualizar aplicación
            </Button>
          )}
        </section>
        <div className="settings-label">
          <ShieldCheck size={21} />
          <h2>Privacidad y alcance</h2>
          <p>Permisos claros. Operación consciente.</p>
        </div>
        <section className="settings-section policy">
          <div>
            <ShieldCheck size={18} />
            <p>
              <strong>Los sensores se activan contigo.</strong> Cámara, GPS y
              acelerómetro solicitan acceso cuando tú lo indicas. La cámara y
              las capturas no se envían a servidores.
            </p>
          </div>
          <div>
            <Radio size={18} />
            <p>
              <strong>El GPS solo se comparte con autorización.</strong> La
              transmisión es privada y funciona en primer plano. No continúa
              automáticamente después de cerrar o suspender la aplicación.
            </p>
          </div>
          <div>
            <CloudOff size={18} />
            <p>
              <strong>Un entorno experimental.</strong> Las ubicaciones demo son
              ilustrativas. Las lecturas no sustituyen instrumentos calibrados
              ni sistemas oficiales de emergencia.
            </p>
          </div>
        </section>
      </div>
      <div className="version-strip">
        <strong>
          RENOVAX OS <span>0.2.0</span>
        </strong>
        <span>React + TypeScript</span>
        <span>Local first · PWA</span>
        <span>Diseñado para una segunda vida.</span>
      </div>
    </>
  );
}
