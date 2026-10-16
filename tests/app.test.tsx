import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../src/App";
vi.mock("../src/components/GeoMap", () => ({
  default: () => <div>Mapa de prueba</div>,
}));
vi.mock("../src/lib/firebase", () => ({
  firebaseReady: false,
  observeUser: (cb: (u: null) => void) => {
    cb(null);
    return () => {};
  },
  observeDevices: () => () => {},
  observeObservations: () => () => {},
  login: vi.fn(),
  logout: vi.fn(),
  markDeviceOffline: vi.fn(),
  publishDevice: vi.fn(),
  publishObservation: vi.fn(),
}));
beforeEach(() => {
  localStorage.clear();
  window.location.hash = "";
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: query.includes("reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
  });
  window.scrollTo = vi.fn();
});
afterEach(cleanup);
it("opens every operational module and saves a real local observation in the selected module", async () => {
  render(<App />);
  expect(screen.getAllByRole("img", { name: "Renovax" }).length).toBeGreaterThan(1);
  expect(screen.getByText("Una nueva vida para la tecnología.")).toBeTruthy();
  const nav = screen.getByRole("navigation", { name: "Navegación principal" });
  for (const name of [
    "Ríos y laderas",
    "Actividad sísmica",
    "Transporte y GPS",
    "Seguridad",
  ]) {
    fireEvent.click(within(nav).getByRole("button", { name }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(name),
    );
  }
  fireEvent.click(
    screen.getByRole("button", { name: "Registrar observación" }),
  );
  await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Cámara instalada junto al acceso. Prueba local." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar observación" }));
  await waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem("renovax-observations")!)[0].type,
    ).toBe("seguridad"),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("supports keyboard command navigation", async () => {
  render(<App />);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  const search = await screen.findByRole("textbox", { name: "Buscar módulo" });
  fireEvent.change(search, { target: { value: "bitacora" } });
  fireEvent.keyDown(search, { key: "Enter" });
  await waitFor(() =>
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "contexto de cada decisión",
    ),
  );
});
