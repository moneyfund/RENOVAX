import { useEffect, useState } from "react";
import type { InstallPrompt, Notify } from "@/types";
export function usePWA(notify: Notify) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [registration, setRegistration] =
      useState<ServiceWorkerRegistration | null>(null),
    [update, setUpdate] = useState(false);
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );
  useEffect(() => {
    const install = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => {
      setPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", done);
    let disposed = false;
    const hadController = Boolean(navigator.serviceWorker?.controller);
    let reloading = false;
    const controllerChanged = () => {
      if (!disposed && hadController && !reloading) {
        reloading = true;
        window.location.reload();
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    }
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          if (disposed) return;
          setRegistration(reg);
          if (reg.waiting) setUpdate(true);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (
                !disposed &&
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setUpdate(true);
            });
          });
        })
        .catch(() => {
          if (!disposed) notify("No se pudo preparar el modo sin conexión.");
        });
    }
    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", done);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
      }
    };
  }, [notify]);
  async function install() {
    if (installed) {
      notify("RENOVAX ya está abierto como aplicación.");
      return;
    }
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else
      notify(
        "En el menú del navegador elige “Instalar aplicación” o “Añadir a pantalla de inicio”.",
      );
  }
  function applyUpdate() {
    if (!registration?.waiting) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  return { installed, install, update, applyUpdate };
}
export type PWA = ReturnType<typeof usePWA>;
