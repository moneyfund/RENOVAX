import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Download, Scan, X, Aperture } from "lucide-react";
import { Button } from "./ui/button";
export default function CameraPanel() {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    generation = useRef(0);
  const [state, setState] = useState<"off" | "requesting" | "on">("off"),
    [error, setError] = useState(""),
    [snapshot, setSnapshot] = useState("");
  const stop = useCallback(() => {
    generation.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setState("off");
  }, []);
  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Cámara no disponible en este navegador. Usa un dispositivo compatible con HTTPS.",
      );
      return;
    }
    const request = ++generation.current;
    setState("requesting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      if (generation.current !== request) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
      if (generation.current !== request) {
        s.getTracks().forEach((track) => track.stop());
        return;
      }
      setState("on");
    } catch (e) {
      if (generation.current !== request) return;
      stop();
      setError(
        (e as Error).name === "NotAllowedError"
          ? "Autoriza la cámara desde los permisos del navegador."
          : "No se pudo abrir la cámara. Comprueba que otra aplicación no la esté usando.",
      );
    }
  };
  function capture() {
    if (!video.current?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video.current, 0, 0);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, [stop]);
  return (
    <section className="camera-panel">
      <div className="camera-frame">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          className={state === "on" ? "visible" : ""}
          aria-label="Vista en vivo de la cámara local"
        />
        {state !== "on" && (
          <div className="camera-placeholder">
            <Aperture size={42} strokeWidth={1} />
            <h3>
              {state === "requesting"
                ? "Solicitando acceso"
                : "Tu cámara. Tu control."}
            </h3>
            <p>Activa una vista local de tu entorno.</p>
          </div>
        )}
        <div className="camera-label">
          <span className={state === "on" ? "status-dot" : ""} />
          {state === "on" ? "VISTA LOCAL" : "CÁMARA / EN ESPERA"}
        </div>
        <div className="camera-corner tl" />
        <div className="camera-corner br" />
      </div>
      <div className="camera-toolbar">
        <Button
          variant={state === "on" ? "outline" : "default"}
          onClick={state === "off" ? () => void start() : stop}
        >
          {state === "off" ? <Camera /> : <CameraOff />}
          {state === "off"
            ? "Activar cámara"
            : state === "requesting"
              ? "Cancelar"
              : "Desactivar"}
        </Button>
        <Button variant="outline" onClick={capture} disabled={state !== "on"}>
          <Scan />
          Capturar
        </Button>
        <span className="micro">SIN TRANSMISIÓN</span>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {snapshot && (
        <div className="snapshot">
          <img src={snapshot} alt="Captura local de la cámara" />
          <div>
            <strong>Captura lista</strong>
            <small>Solo en este dispositivo</small>
            <a href={snapshot} download="renovax-captura.jpg">
              <Download size={13} /> Descargar imagen
            </a>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSnapshot("")}
            aria-label="Descartar captura"
          >
            <X />
          </Button>
        </div>
      )}
    </section>
  );
}
