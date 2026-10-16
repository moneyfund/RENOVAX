import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  MotionConfig,
} from "motion/react";
import {
  ArrowUpRight,
  Command,
  Search,
  Menu,
  ChevronRight,
  CircleDot,
  X,
  Check,
  Globe2,
  Radio,
  WifiOff,
  ArrowRight,
  Layers2,
  Sun,
  Moon,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { GoogleMark } from "@/components/GoogleMark";
import { firebaseReady } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { ObservationDialog } from "@/components/ObservationDialog";
import { ObservationList } from "@/components/ObservationList";
import { Overview, ModuleWorkspace } from "@/pages/Operations";
import { NAV, getPage, isModule, TITLES } from "@/data";
import { useSensors } from "@/hooks/useSensors";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePWA } from "@/hooks/usePWA";
import type { PageId } from "@/types";
const Devices = lazy(() => import("@/pages/Devices"));
const Settings = lazy(() => import("@/pages/Settings"));
const NetworkPage = lazy(() => import("@/pages/Network"));
const AlertsPage = lazy(() => import("@/pages/Alerts"));
const AdminPage = lazy(() => import("@/pages/Admin");
type ThemeMode = "dark" | "light";
function initialTheme(): ThemeMode {
  try {
    return localStorage.getItem("renovax-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
function Clock() {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time className="system-clock" dateTime={date.toISOString()}>
      {date.toLocaleTimeString("en-GB", {
        timeZone: "America/Managua",
        hour12: false,
      })}
      <span>CST</span>
    </time>
  );
}
function Navigation({
  page,
  navigate,
}: {
  page: PageId;
  navigate: (p: PageId) => void;
}) {
  return (
    <nav aria-label="Navegación principal" className="navigation">
      {NAV.map((n, index) => (
        <div key={n.id}>
          {index === 0 && <div className="nav-label">ESPACIO DE TRABAJO</div>}
          {index === 1 && (
            <div className="nav-label">
              MÓDULOS OPERATIVOS <span>04</span>
            </div>
          )}
          {index === 5 && <div className="nav-label">SISTEMA</div>}
          <button
            className={page === n.id ? "active" : ""}
            onClick={() => navigate(n.id)}
            aria-current={page === n.id ? "page" : undefined}
          >
            <n.icon size={17} strokeWidth={1.6} />
            <span>{n.title}</span>
            {page === n.id && <i />}
          </button>
        </div>
      ))}
    </nav>
  );
}
export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [page, setPage] = useState<PageId>(getPage),
    [navOpen, setNavOpen] = useState(false),
    [commandOpen, setCommandOpen] = useState(false),
    [query, setQuery] = useState(""),
    [statusOpen, setStatusOpen] = useState(false),
    [newOpen, setNewOpen] = useState(false),
    [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    main = useRef<HTMLElement>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", theme === "dark" ? "#1b1c22" : "#4068ad",
    );
    try { localStorage.setItem("renovax-theme", theme); } catch {
      // Reading and toggling the theme must also work in private browsing.
    }
  }, [theme]);
  const sensors = useSensors(),
    workspace = useWorkspace(sensors, notify),
    pwa = usePWA(notify);
  const navigate = useCallback((next: PageId) => {
    window.location.hash = next;
    setPage(next);
    setNavOpen(false);
    setCommandOpen(false);
    setQuery("");
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
  }, []);
  useEffect(() => {
    const hash = () => setPage(getPage());
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useEffect(() => {
    document.title = `${TITLES[page]} · RENOVAX OS`;
  }, [page]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const normalized = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const commands = NAV.filter((n) =>
    n.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(normalized),
  );
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={300}>
          <div className="app-shell">
            <a
              href="#workspace"
              className="skip-link"
              onClick={(e) => {
                e.preventDefault();
                main.current?.focus();
              }}
            >
              Saltar al contenido
            </a>
            <aside className="sidebar">
              <button
                className="brand-button"
                onClick={() => navigate("resumen")}
                aria-label="RENOVAX OS · Centro de control"
              >
                <Brand />
              </button>
              <div className="workspace-identity">
                <div>
                  <Layers2 size={16} />
                </div>
                <span>
                  Espacio personal<small>Centro de operaciones</small>
                </span>
                <span className="workspace-key">01</span>
              </div>
              <Navigation page={page} navigate={navigate} />
              <div className="sidebar-mission">
                <div className="micro">
                  <span className="status-dot" />
                  UNA NUEVA MISIÓN
                </div>
                <p>
                  La tecnología no termina.
                  <br />
                  <strong>Se transforma.</strong>
                </p>
                <span className="mission-line" />
              </div>
              <button
                className="sidebar-account"
                onClick={() => navigate("configuracion")}
              >
                <span className="account-avatar">
                  {workspace.user?.photoURL ? (
                    <img src={workspace.user.photoURL} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    workspace.user?.displayName?.slice(0, 1).toUpperCase() ?? "R"
                  )}
                </span>
                <span>
                  {workspace.user?.displayName || workspace.user?.email?.split("@")[0] || "Operador local"}
                  <small>
                    {workspace.user ? "Cuenta Google verificada" : workspace.authReady ? "Sin cuenta conectada" : "Cargando perfil…"}
                  </small>
                </span>
                <ChevronRight size={14} />
              </button>
            </aside>
            <div className="main-shell">
              <header className="topbar">
                <div className="breadcrumb">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mobile-menu"
                    aria-label="Abrir navegación"
                    onClick={() => setNavOpen(true)}
                  >
                    <Menu />
                  </Button>
                  <span className="breadcrumb-product">RENOVAX OS</span>
                  <ChevronRight size={13} />
                  <span>{TITLES[page]}</span>
                </div>
                <div className="topbar-actions">
                  <button
                    type="button"
                    className="theme-toggle"
                    role="switch"
                    aria-label="Modo oscuro"
                    aria-checked={theme === "dark"}
                    title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                    <span>{theme === "dark" ? "Claro" : "Oscuro"}</span>
                  </button>
                  <button
                    className="command-trigger"
                    aria-label="Buscar módulo"
                    aria-keyshortcuts="Control+k Meta+k"
                    onClick={() => setCommandOpen(true)}
                  >
                    <Search size={14} />
                    <span>Buscar módulo</span>
                    <kbd>Ctrl K</kbd>
                  </button>
                  {!workspace.user && workspace.authReady && firebaseReady && (
                    <Button
                      variant="outline"
                      className="header-google"
                      disabled={workspace.authBusy || !workspace.authReady}
                      onClick={() => void workspace.signIn()}
                      aria-label="Iniciar sesión con Google"
                    >
                      <GoogleMark />
                      <span>{workspace.authBusy ? "Conectando…" : "Entrar con Google"}</span>
                    </Button>
                  )}
                  <Clock />
                  <Tooltip label="Estado del sistema">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Ver estado del sistema"
                      onClick={() => setStatusOpen(true)}
                    >
                      {workspace.online ? <CircleDot /> : <WifiOff />}
                    </Button>
                  </Tooltip>
                </div>
              </header>
              {!workspace.online && (
                <div className="offline-banner" role="status">
                  <WifiOff size={14} />
                  Sin conexión. Puedes seguir guardando observaciones en este
                  dispositivo.
                </div>
              )}
              {pwa.update && (
                <div className="update-banner">
                  <span>Hay una nueva versión de RENOVAX lista.</span>
                  <Button size="sm" onClick={pwa.applyUpdate}>
                    Actualizar ahora
                  </Button>
                </div>
              )}
              <main id="workspace" ref={main} tabIndex={-1} className="content">
                <AnimatePresence mode="wait" initial={false}>
                  <m.div
                    key={page}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
                  >
                    <Suspense
                      fallback={
                        <div className="page-loading">
                          <span className="loader" />
                          Abriendo espacio de trabajo…
                        </div>
                      }
                    >
                      {page === "resumen" ? (
                        <Overview
                          workspace={workspace}
                          sensors={sensors}
                          navigate={navigate}
                          onNew={() => setNewOpen(true)}
                        />
                      ) : isModule(page) ? (
                        <ModuleWorkspace
                          key={page}
                          id={page}
                          workspace={workspace}
                          sensors={sensors}
                          onNew={() => setNewOpen(true)}
                        />
                      ) : page === "dispositivos" ? (
                        <Devices workspace={workspace} sensors={sensors} />
                      ) : page === "configuracion" ? (
                        <Settings workspace={workspace} pwa={pwa} />
                      ) : page === "red" ? (
                        <NetworkPage workspace={workspace} sensors={sensors} notify={notify} />
                      ) : page === "alertas" ? (
                        <AlertsPage workspace={workspace} notify={notify} />
                      ) : page === "admin" ? (
                        <AdminPage workspace={workspace} />
                      ) : (
                        <>
                          <div className="page-heading">
                            <div>
                              <span className="micro purple">
                                MEMORIA OPERATIVA
                              </span>
                              <h1>El contexto de cada decisión.</h1>
                              <p>
                                Tus observaciones de campo, ordenadas y
                                disponibles cuando las necesitas.
                              </p>
                            </div>
                            <Button onClick={() => setNewOpen(true)}>
                              Nueva observación
                              <ArrowRight />
                            </Button>
                          </div>
                          <ObservationList
                            records={workspace.observations}
                            full
                            onNew={() => setNewOpen(true)}
                          />
                        </>
                      )}
                    </Suspense>
                  </m.div>
                </AnimatePresence>
                <footer className="system-footer">
                  <span>
                    <span className="footer-mark">R/X</span>RENOVAX OS{" "}
                    <span className="footer-dot">·</span>v0.3
                  </span>
                  <span>
                    ENTORNO EXPERIMENTAL<span className="footer-dot">/</span>
                    NICARAGUA
                  </span>
                  <span>
                    <Globe2 size={12} />
                    DISEÑADO PARA UNA SEGUNDA VIDA
                  </span>
                </footer>
              </main>
            </div>
          </div>
          <Dialog open={navOpen} onOpenChange={setNavOpen}>
            <DialogContent className="mobile-drawer">
              <DialogTitle className="sr-only">Navegación RENOVAX</DialogTitle>
              <DialogDescription className="sr-only">
                Selecciona un módulo o configuración.
              </DialogDescription>
              <Brand />
              <Navigation page={page} navigate={navigate} />
            </DialogContent>
          </Dialog>
          <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
            <DialogContent className="command-dialog">
              <DialogTitle className="sr-only">
                Ir a un espacio de trabajo
              </DialogTitle>
              <DialogDescription className="sr-only">
                Busca un módulo y selecciona su nombre para abrirlo.
              </DialogDescription>
              <div className="command-input">
                <Search size={20} />
                <input
                  aria-label="Buscar módulo"
                  placeholder="¿Dónde quieres trabajar?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commands[0])
                      navigate(commands[0].id);
                  }}
                />
              </div>
              <div className="command-results">
                <span className="micro">ESPACIOS DE TRABAJO</span>
                {commands.map((n) => (
                  <button key={n.id} onClick={() => navigate(n.id)}>
                    <n.icon size={18} />
                    <span>{n.title}</span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
                {!commands.length && <p>No hay módulos con ese nombre.</p>}
              </div>
              <div className="command-footer">
                <Command size={12} />
                Navega con Tab · Enter para abrir<span>Esc para cerrar</span>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
            <DialogContent>
              <span className="micro purple">ESTADO / ESTA SESIÓN</span>
              <DialogTitle className="dialog-title">
                Tu sistema, a la vista.
              </DialogTitle>
              <DialogDescription className="dialog-description">
                Estado actual de conexión y permisos.
              </DialogDescription>
              <dl className="status-list">
                <div>
                  <dt>Conexión de red</dt>
                  <dd>{workspace.online ? "Disponible" : "Sin conexión"}</dd>
                </div>
                <div>
                  <dt>Cuenta privada</dt>
                  <dd>{workspace.user ? "Conectada" : "Sin iniciar sesión"}</dd>
                </div>
                <div>
                  <dt>Datos remotos</dt>
                  <dd>
                    {workspace.syncError
                      ? "Error de lectura"
                      : workspace.user
                        ? "Suscripción abierta"
                        : "Inactivos"}
                  </dd>
                </div>
                <div>
                  <dt>Ubicación GPS</dt>
                  <dd>
                    {sensors.gpsStatus === "active"
                      ? "Lectura activa"
                      : "Sin lectura activa"}
                  </dd>
                </div>
                <div>
                  <dt>Transmisión</dt>
                  <dd>
                    {workspace.sharing ? "Autorizada y activa" : "Desactivada"}
                  </dd>
                </div>
              </dl>
              <p className="setting-hint">
                <Radio size={15} />
                Los nodos sin actualización reciente dejan de mostrarse como
                activos.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusOpen(false);
                  navigate("configuracion");
                }}
              >
                Abrir configuración
                <ArrowUpRight />
              </Button>
            </DialogContent>
          </Dialog>
          <ObservationDialog
            key={isModule(page) ? page : "ambiental"}
            open={newOpen}
            onOpenChange={setNewOpen}
            initialModule={isModule(page) ? page : "ambiental"}
            workspace={workspace}
            sensors={sensors}
          />
          <AnimatePresence>
            {toast && (
              <m.div
                role="status"
                className="toast"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Check size={16} />
                <span>{toast}</span>
                <button
                  onClick={() => setToast("")}
                  aria-label="Cerrar mensaje"
                >
                  <X size={15} />
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </TooltipProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
