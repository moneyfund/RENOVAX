# RENOVAX — configuración segura de infraestructura

## 1. Reglas de Firestore y Storage

Este repositorio tiene las reglas necesarias para usuarios, organizaciones,
miembros, invitaciones, series de nodos, lecturas manuales, borradores de eventos,
zonas privadas y boletines públicos verificados. No se deben sustituir por
`allow read, write: if true`.

Desde una sesión de Firebase con permisos en `renovax-5fbf0`:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore,storage --project renovax-5fbf0
```

La compilación y el despliegue de Vercel **no publican** las reglas de Firebase.

## 2. Primer administrador de plataforma

No se usa correo privilegiado hardcodeado ni elevación de permisos en el navegador.
El claim `platformAdmin` se asigna solo por Admin SDK, utilizando credenciales
seguras desde una estación confiable:

```bash
cd ops
npm install
ADMIN_UID=UID_AUTORIZADO GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/credenciales.json npm run grant-admin
```

Nunca subas la cuenta de servicio al repositorio o a Vercel; si existe una
credencial de servicio, debe custodiarse y administrarse por IAM.

## 3. Cloud Functions (pendiente de despliegue)

`functions/index.mjs` implementa `approvePublicIncident`, la publicación
humana de un boletín corroborado, con rol plataforma y Firebase App Check.
La función de distribución a suscriptores geográficos se activa únicamente
tras publicarse un boletín aprobado y solo si existen tokens FCM registrados
con consentimiento. La implementación actual **no incluye** el registro
de tokens en clientes ni una interfaz de publicación para el administrador;
por tanto NO promete notificaciones push operativas todavía.

Para desplegarla es necesario un proyecto apto para Cloud Functions,
permisos IAM y App Check debidamente configurados:

```bash
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions --project renovax-5fbf0
```

No habilitar difusión comunitaria ni habilitar usuarios públicos como editores
de `publicIncidents`. La verificación de un sismo requiere redes/fuentes
sísmicas competentes; los umbrales hidrológicos necesitan sensores calibrados,
cuencas y zonas inundables verificadas. Un radio circular es solo aproximación
para interfaces y pilotos, no una delimitación física universal de riesgo.

## 4. Prueba de transporte con dos cuentas

1. Entrar a RENOVAX con Google, abrir **Mi red**, crear organización.
2. Crear el activo «Bus 01» de tipo Transporte.
3. Crear invitación como **operador** al correo Google del teléfono emisor.
4. Compartir enlace; receptor inicia sesión con ese correo y acepta invitación.
5. Propietario crea el nodo de Bus 01 asignando UID del operador.
6. En teléfono emisor: abrir RENOVAX → Mi red → GPS activado → Emitir GPS.
7. En teléfono del propietario: abrir Mi red para ver el nodo compartido.

La PWA requiere pantalla encendida y primer plano para emisión fiable;
sin una app nativa el navegador puede suspender ubicación en segundo plano.

## 5. Observaciones y alertas

Las lecturas del módulo Mi red se guardan bajo `organizations/{orgId}/readings`.
Los usuarios autorizados las comparten dentro de la organización. Una lectura
manual nunca se convierte automáticamente en alerta a terceros.
`publicIncidents` es solo lectura desde cliente; publicar requiere
la Cloud Function con claim administrativo y validación humana.
Los usuarios pueden guardar zonas privadas para resaltar coincidencias
con boletines aprobados. Push en tiempo real queda pendiente de consentimiento
Web Push, VAPID y registro de tokens.

No guardar más información de la necesaria. Las localizaciones, direcciones
residenciales y los identificadores de notificación merecen retención limitada
y acceso mínimo. Definir obligaciones legales, consentimiento, caducidad y
borrado antes de un lanzamiento público.
