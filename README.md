# RENOVAX OS · 0.2

Centro de control experimental para dar una nueva misión a teléfonos recuperados. Interfaz grafito/lila con React 19, TypeScript estricto, Tailwind CSS 4, componentes shadcn/ui adaptados sobre Radix UI y Motion. Conserva las cuatro operaciones de la versión anterior y su modelo privado de Firebase.

**Producción:** https://renovax-rho.vercel.app

## Operaciones

| Módulo            | Función disponible                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Ríos y laderas    | Mapa, referencias demo, observaciones manuales y cámara local.                                                                             |
| Actividad sísmica | Acelerómetro X/Y/Z, gráfica de las últimas 100 muestras y registro de observaciones. La lectura con gravedad se identifica explícitamente. |
| Transporte y GPS  | Ubicación local y transmisión privada cada 15 segundos con autorización adicional. Los nodos caducan tras 90 segundos sin actualización.   |
| Seguridad         | Cámara con permiso, captura y descarga locales. No se graba ni se transmite video automáticamente.                                         |

La consola incluye navegación por URL, paleta **Ctrl/⌘ K**, navegación móvil con foco controlado, bitácora exportable en JSON, laboratorio de sensores y configuración. Los registros locales e identificadores existentes se conservan. Los datos demo se distinguen de los nodos reales mediante un selector independiente.

RENOVAX es una PWA con experiencia de centro de control; no reemplaza Android/iOS ni accede al firmware. Las lecturas son experimentales y no constituyen alertas certificadas de sismos, inundaciones o deslizamientos.

## Desarrollo

Node.js **22.12+** (Vercel usa 24.x), npm y el archivo de bloqueo incluido.

```bash
npm ci
npm run dev
npm run verify
```

`verify` ejecuta TypeScript estricto, build de producción, pruebas de integración/unidad y validación de la caché generada. `npm run build` produce `dist/`; no se debe publicar un directorio de desarrollo.

## Firebase (opcional)

Sin variables de entorno, la aplicación funciona en modo local y no inicializa el SDK remoto. No hay claves ni cuentas de servicio incorporadas.

1. Crea o selecciona el proyecto Firebase y habilita Cloud Firestore en producción.
2. Habilita Google en Authentication y añade `renovax-rho.vercel.app` a los dominios autorizados.
3. Añade en Vercel las seis variables públicas `VITE_FIREBASE_*` de `.env.example`. `apiKey`, `authDomain`, `projectId` y `appId` son necesarios para habilitar el enlace. Nunca uses credenciales administrativas en variables `VITE_*`.
4. Publica las reglas y el índice incluidos, desde Firebase Console o con las herramientas oficiales:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore
```

5. Reconstruye la aplicación después de configurar las variables. Desde Configuración, conecta la cuenta y, desde Transporte y GPS, activa el GPS y autoriza la transmisión.

El índice `ownerUid + createdAt` permite cargar las últimas 100 observaciones privadas. Se limita la suscripción de dispositivos a 200 nodos por cuenta. Las reglas validan propiedad, esquema, coordenadas y longitud de registros. La publicación de estas reglas e índices requiere acceso al proyecto Firebase y es independiente del despliegue en Vercel.

```text
devices/{ownerUid}_{installationId}
  ownerUid, deviceId, name, module: "transporte", status
  lat, lng, accuracy, motion, updatedAt: serverTimestamp

observations/{recordId}
  ownerUid, type, level, note, localTime, source: "manual"
  deviceId, createdAt: serverTimestamp
```

Los registros locales se guardan en `renovax-observations` (máximo 100) y conservan el ID de `renovax-install-id`. Si falla una escritura remota se conserva una copia local; la misma ID evita duplicarla en la interfaz cuando llega la confirmación. Las copias creadas con sesión quedan asociadas a esa cuenta y se ocultan al cerrarla. El almacenamiento del navegador no es cifrado: en equipos compartidos se requiere una política de acceso al dispositivo. No se suben automáticamente los registros locales previos.

## Sensores y privacidad

- Ningún permiso se solicita al abrir la consola. GPS, movimiento y cámara se activan mediante controles explícitos.
- El GPS se descarta tras 60 segundos sin lectura. La señal del acelerómetro se actualiza como máximo a 10 Hz y caduca sin eventos recientes.
- Al pasar a segundo plano se detienen los sensores y la transmisión. Al cerrar la vista de cámara se liberan todas sus pistas, incluso si el permiso termina de resolverse después.
- El envío GPS se serializa para que una escritura pendiente no vuelva a dejar el nodo online después de detenerlo. Si no puede escribirse el estado offline, la caducidad de 90 segundos evita presentarlo indefinidamente como activo.
- El acelerómetro y la compatibilidad con permisos varían según navegador y equipo. El modo de captura continua en segundo plano requeriría un agente nativo.

## PWA y rendimiento

El build genera `dist/sw.js` con una lista versionada de recursos locales: HTML, estilos, fuentes, iconos y módulos JavaScript. Funciona sin conexión tras completar la primera instalación. No intercepta ni guarda respuestas de Firebase, teselas externas o APIs privadas. La activación limpia solo cachés de RENOVAX, preserva otras aplicaciones y ofrece un aviso de actualización.

Fuentes alojadas localmente; mapa, cámara, ajustes y SDK Firebase se cargan por módulos. El paquete Firestore tiene un aviso de tamaño en Vite, pero se importa únicamente con configuración Firebase; no bloquea el arranque local. La PWA precarga esos archivos para disponer de la interfaz offline. No se incluyen analítica, videos decorativos ni fuentes externas.

## Estructura

```text
src/App.tsx                 shell, navegación y diálogos globales
src/components/ui/          componentes shadcn/ui adaptados, basados en Radix
src/components/             mapa, cámara, instrumentos y registros
src/pages/                  operaciones, dispositivos y configuración
src/hooks/                  permisos, sincronización y ciclo de vida PWA
src/lib/                    Firebase, almacenamiento y validación de telemetría
src/types.ts                contratos TypeScript
src/styles.css              tokens de diseño y responsive
scripts/build-sw.mjs        caché versionada a partir del build real
scripts/verify-build.mjs    verificación de instalación y privacidad de caché
tests/                      pruebas de comportamiento y regresión
firestore.rules             reglas privadas y validación del esquema
```

Se incluyen CSP, protección contra framing, MIME sniffing y política explícita de permisos. `@grpc/grpc-js`, dependencia transitiva de Firebase para Node, se fija en 1.14.5 para excluir versiones vulnerables; no se utiliza como transporte en el navegador.

## Validación y publicación

Las pruebas cubren navegación de los cuatro módulos, paleta de comandos, guardado local, persistencia anterior, datos inválidos, caducidad GPS, permisos de movimiento, rechazo/cierre de cámara y orden de escrituras de telemetría. La verificación del build comprueba recursos offline, iconos, actualización de cachés y exclusión de respuestas privadas.

Los permisos y sensores se simulan en las pruebas. Aún requieren validación física en Android/iOS y una cuenta Firebase configurada. En esta revisión no se dispuso de una superficie autorizada de navegador para QA visual; el responsive se implementó con breakpoints de 480, 760, 1030, 1250 y 1600 px.

Vercel está vinculado a `main`. Publicar un único commit revisado desencadena un único build de producción; no se debe crear además un despliegue manual del mismo commit.
