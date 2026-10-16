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

## Configuración RENOVAX Firebase (16 de octubre de 2026)

El proyecto de producción usa **Firebase `renovax-5fbf0`**. Las variables públicas del SDK web están configuradas en Vercel (production, preview y development), sin valores sensibles almacenados en este repositorio. El módulo `src/lib/firebase.ts` prepara Firebase Authentication, Firestore y `getAuthorizedStorage()` para Cloud Storage. La medición de Analytics **no se activa** de forma automática.

La conexión requiere publicar desde Firebase las reglas de **Firestore** y **Storage**, más los índices de Firestore. El despliegue de Vercel no publica reglas de Firebase. Para instalarlas desde una sesión autenticada con permisos en Firebase:

```bash
npx firebase-tools login
npx firebase-tools use renovax-5fbf0
npx firebase-tools deploy --only firestore,storage --project renovax-5fbf0
```

El archivo `storage.rules` restringe el espacio futuro `users/{uid}/captures/*` a su propietario, y acepta únicamente archivos de imagen menores a 10 MB. No existe carga automática de fotografías ni grabaciones. Después de publicar las reglas, iniciar sesión en Configuración y verificar el acceso a Firestore en un dispositivo real.

La PWA ahora solicita el HTML primero a la red y usa la copia local **solo cuando no hay conexión**. Las versiones nuevas toman el control automáticamente y recargan la interfaz; los recursos estáticos versionados permanecen en caché para uso sin conexión.

## Cartografía geoespacial — conexión operativa

Las vistas **Centro de control**, **Ríos y laderas**, **Actividad sísmica**, **Transporte y GPS** y **Seguridad** muestran mapas de Nicaragua con Leaflet y fuentes Carto, OpenStreetMap o Esri World Imagery (atribuciones visibles). Los mapas requieren conectividad para las teselas y no transmiten coordenadas por sí mismos.

«Mis datos» muestra únicamente registros de observación que incluyeron ubicación mediante el consentimiento individual «Adjuntar ubicación al registro», y dispositivos GPS recientes privados, restringidos al módulo de movilidad. Los puntos de ejemplo se consultan por separado en «Muestras» y nunca se presentan como mediciones. Los registros anteriores sin GPS permanecen intactos y no aparecen en el mapa hasta que se creen nuevos con coordenadas.

**IMPORTANTE: publicar de nuevo `firestore.rules` en Firebase** tras actualizar: se añadió `position` opcional y validado para guardar registros georreferenciados. Si las reglas anteriores permanecen activas, las observaciones con ubicación no se podrán subir; la aplicación conserva entonces una copia local. Los registros sin ubicación mantienen el formato anterior y siguen siendo válidos.

## Solución: fondo de mapa mostraba `API KEY REQUIRED`

La capa CARTO `dark_all` fue retirada de RENOVAX al exigir clave en las teselas.
Las opciones **Oscuro** y **Calles** ahora usan cartografía estándar de
OpenStreetMap con atribución; **Oscuro** aplica el tratamiento grafito/lila
solamente a las imágenes del mapa mediante CSS y no altera los marcadores.
**Satélite** emplea Esri World Imagery con su atribución visible.

La cartografía depende de conectividad y de las condiciones de los proveedores.
No se incluyen claves de terceros. Las teselas no se almacenan en la caché PWA,
y para una operación comercial de gran escala será necesario contratar un servicio
con capacidad y términos de uso adecuados.

## Cartografía en colores originales

Se eliminó el oscurecimiento artificial de las teselas (incluyendo el filtro global gris y los filtros de Calles y Satélite). La vista predeterminada ahora es **Calles**, con colores naturales de OpenStreetMap; **Satélite** también se muestra sin filtros. El diseño dark premium de RENOVAX continúa aplicándose a los controles y paneles, no a la cartografía. No hay una opción «Oscuro» en el selector.

## Interfaz RENOVAX · Azul y blanco

Identidad clara **#4068AD** y blanco, con fondo atmosférico azul muy suave, barra lateral azul, paneles semitransparentes y botones de vidrio con contraste accesible. Se elimina el tema negro/lila del shell. La navegación y los módulos mantienen su funcionalidad; no se alteran las reglas de Firebase, permisos GPS ni políticas de Storage.

Animaciones: se conserva **Motion para React** ya incluido, utilizando transiciones físicas moderadas para las secciones y tarjetas de módulos, respetando la preferencia del sistema para reducir movimiento. No se añade otra dependencia porque ya contamos con esta biblioteca y Radix UI. El acceso rápido desde la barra superior y el panel Configuración utilizan la identidad oficial de Google en SVG local; el inicio de sesión continúa utilizando Firebase Authentication.

## Sesiones de Google y estabilidad de sensores

El usuario puede seleccionar una cuenta con Google; Firebase Auth restaura su identidad entre sesiones y completa los resultados de redirección si el navegador bloqueó ventanas emergentes. El nombre, correo e imagen de perfil se toman de la cuenta autenticada y se muestran sin crear una colección `users` adicional. Los listeners Firestore se vinculan por UID y los registros locales anónimos no se presentan dentro de sesiones autenticadas: esta separación evita visualizar registros de otra cuenta que haya usado el navegador. Las observaciones se ordenan en cliente, eliminando la exigencia de un índice compuesto para una consulta básica de datos por UID.

El GPS ya no se cancela por permanecer inmóvil: el servicio `watchPosition` sigue activo con permiso explícito y solicita un refresco adicional después de 40 segundos; ante fallos temporales reintenta. El acelerómetro conserva su listener, aunque indique pausa si no se reciben eventos durante 20 segundos. Solo se apagan al desactivarlos manualmente, perder el permiso o pasar la aplicación a segundo plano. La telemetría **nunca publica una posición vencida**; para funcionar en segundo plano o mantener nodos activos se requeriría una aplicación nativa con permisos apropiados.

### Hero principal simplificado

El inicio muestra exclusivamente el logotipo oficial cargado por el propietario (`/renovax-logo.png`) y la frase **«Una nueva vida para la tecnología.»** dentro de una superficie azul #4068AD con iluminación ambiental, profundidad y contraste alto. Se eliminan del hero el encabezado genérico, las leyendas, los botones y la ilustración de circuito anterior. Las acciones de registro y navegación siguen accesibles en los módulos, bitácora y menú. Responsive para móviles y escritorio; movimiento reducido respetado.

### Logo sin emblema y selector de apariencia

La navegación y el hero usan el mismo **wordmark oficial de RENOVAX** del PNG original, recortado de forma vectorial mediante SVG `viewBox` para ocultar solo el emblema «R». La X final no se corta y el logotipo conserva su proporción a cualquier tamaño. El favicon conserva la R histórica de la marca. Se añade selector accesible en la barra superior con persistencia local (`renovax-theme`), modo oscuro grafito/rojo eléctrico de inicio y modo claro azul/blanco a voluntad. Se cambia la apariencia mediante CSS; Firebase, GPS, telemetría y permisos quedan intactos.
