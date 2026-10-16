import { Component, StrictMode } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./styles.css";
import "./theme.css";
import "./network.css";
import App from "./App";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Never log coordinates, identity or private records. */
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-screen">
        <span className="micro">RENOVAX OS</span>
        <h1>No pudimos abrir este espacio.</h1>
        <p>
          Tus registros guardados permanecen en este dispositivo. Recarga para
          volver a intentarlo.
        </p>
        <button onClick={() => window.location.reload()}>
          Volver a cargar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
