# RENOVAX OS · Mission Control

**RENOVAX v0.1.0 alpha** — Consola PWA para reutilizar teléfonos reacondicionados como nodos experimentales de observación. Diseño oscuro/lila, mapa geoespacial, interfaces móviles, pruebas de sensores y conexión privada opcional con Firebase.

> **Aviso de seguridad:** Es un prototipo. Los puntos geográficos son **muestras ilustrativas**, no mediciones reales. No puede detectar o predecir terremotos de manera fiable ni reemplazar sistemas oficiales de emergencias. No utilizar para decisiones críticas.

## Módulos

- **Ríos y laderas:** localización de puntos conceptuales y bitácora de observaciones de campo. La estimación de niveles de agua y desplazamientos requerirá cámaras fijas calibradas, algoritmos validados y/o sensores externos.
- **Actividad sísmica:** acceso, cuando el navegador lo permite, a `DeviceMotionEvent` (aceleración en ejes X/Y/Z); no existe clasificación sísmica ni alerta temprana certificada.
- **Transporte y GPS:** `navigator.geolocation.watchPosition` con permiso explícito. Con sesión iniciada y autorización adicional, comparte la posición de este dispositivo en Firestore. **Solo primer plano:** el seguimiento se interrumpe o degrada cuando el sistema suspende la PWA.
- **Seguridad:** visualización y captura *local* de cámara con `getUserMedia`; se pueden guardar observaciones manuales. No hay vigilancia remota ni subida de imagen automática.

## Desarrollo

Requiere Node.js 20.19+.

```bash
npm install
npm run dev
npm run build
```

## Firebase (opcional)

1. Crear un proyecto Firebase y una base de datos Cloud Firestore en modo producción.
2. En **Authentication → Sign-in method**, habilitar Google. Añadir el dominio de Vercel a **Authorized domains**.
3. Publicar las reglas de `firestore.rules` desde Firebase Console → Firestore Database → Rules. Ajustar reglas y arquitectura antes de cualquier acceso multiusuario compartido.
4. Copiar `.env.example` a `.env.local` y completar con la **configuración pública** del SDK web de Firebase. En Vercel, establecer las mismas variables `VITE_FIREBASE_*` antes del build.
5. Abrir Configuración dentro de RENOVAX, iniciar sesión con Google, autorizar el GPS y activar manualmente compartir telemetría en Movilidad.

**Modelo de datos actual**

```text
devices/{ownerUid}_{installationId}
  ownerUid: string
  deviceId: string
  name: string
  module: "transporte"
  status: "online" // último estado declarado por el emisor; no implica heartbeat vigente
  lat, lng, accuracy: number
  motion: number | null
  updatedAt: Firestore serverTimestamp

observations/{autoId}
  ownerUid: string
  type: "ambiental" | "sismico" | "transporte" | "seguridad"
  level: "observación" | "revisión" | "prueba"
  note: string
  localTime: ISO8601
  source: "manual"
  deviceId: string
  createdAt: Firestore serverTimestamp
```

Las reglas restringen consultas a documentos propiedad del usuario autenticado. La plataforma no incluye todavía roles administrativos compartidos, organizaciones ni ingestion escalable. La política de retención y consentimiento debe diseñarse para producción.

## Estructura

```text
src/App.jsx                 consola, navegación y operaciones
src/components/GeoMap.jsx   mapa Leaflet / Carto / OpenStreetMap
src/components/SensorConsole.jsx  cámara, GPS, movimiento, altavoz
src/firebase.js             configuración y operaciones Firestore
src/data.js                 puntos y módulos DEMO
src/styles.css              sistema de diseño responsive
public/manifest.webmanifest PWA instalable
public/sw.js                cache básico de shell
firestore.rules             reglas iniciales privadas por usuario
```

## Limitaciones de plataforma

- Una **PWA no es un sistema operativo**: opera bajo iOS/Android y con los permisos del navegador; no dispone de acceso completo a firmware, sensores de bajo nivel ni ejecución continua garantizada en segundo plano.
- Para uso continuo, sobre todo GPS, alarmas sonoras, medición sísmica o cámaras, conviene una aplicación Android nativa (agente/kiosco) más adelante, con servicio foreground, políticas de energía y gestión remota, manteniendo esta web como consola.
- Altavoz: emite una señal de prueba breve con Web Audio solo al presionar el botón. Micrófono: no se solicita.
- Los mapas requieren conexión para cargar teselas. La PWA cachea únicamente recursos básicos de instalación; no existe todavía modo offline completo.
- Los puntos de muestra están identificados explícitamente como DEMO; nunca se generan alertas reales sobre ellos.
- Para alertas por desastre deben incorporarse fuentes oficiales, procesos de calibración, detección robusta, confirmación humana, redundancia y procedimientos de alerta validados.

## Despliegue Vercel

Vincular el repositorio con Vercel usando el framework **Vite**, comando `npm run build` y salida `dist`. Un único push a `main` desencadena el despliegue automático. Usar variables de entorno para Firebase; **no almacenar secretos ni cuentas de servicio dentro de Vite**.

## Activar conexión real con Firebase en Vercel

RENOVAX arranca en **modo local** si faltan variables de Firebase. Para conectar datos reales añade en **Vercel → Project → Settings → Environment Variables** las seis claves `VITE_FIREBASE_*` descritas en `.env.example`. Son parámetros públicos del SDK web, **no** la clave privada de una cuenta de servicio. Configura Firebase Authentication (Google), agrega el dominio de producción a los autorizados y habilita Firestore en modo producción.

Para instalar reglas iniciales y la definición de índices después de seleccionar el proyecto Firebase:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore
```

La configuración real y la publicación de reglas en Firebase requieren el ID/configuración del proyecto y permisos de su propietario. Ningún teléfono ni sensor escribe automáticamente sin autenticación y autorización expresa.

**Ciclo de vida GPS:** al detener la transmisión RENOVAX marca el nodo como `offline`. Si se pierde GPS o pasan más de 60 s sin posición, la transmisión se suspende; el mapa solo enseña nodos con actualización reciente, no estados antiguos interpretados como activos.
