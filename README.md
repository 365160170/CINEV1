# Cine de Dos

Videoteca privada para dos personas: se recomiendan películas, eligen qué ver y registran lo que vieron, cada quien con su propia nota.

React + Vite + TypeScript · Firebase Auth + Firestore · TMDB · GitHub Pages.

---

## 0. Probarla ya (modo demostración)

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Sin claves de Firebase la app arranca en **modo demostración**: los datos viven solo en tu navegador. Abre dos pestañas, entra como Persona A en una y Persona B en otra: lo que agregues en una aparece en la otra al instante.

---

## 1. Crear Firebase (10 min)

1. Entra a https://console.firebase.google.com → **Agregar proyecto** (Analytics no es necesario).
2. **Authentication → Comenzar → Correo/contraseña → Habilitar.**
3. **Authentication → Configuración → Acciones de usuario:** desactiva *Habilitar creación (registro)* si aparece. Nadie debe poder registrarse solo.
4. **Authentication → Usuarios → Agregar usuario** dos veces: tu correo y el de la otra persona, cada uno con su contraseña. Copia los dos **UID** que aparecen.
5. **Firestore Database → Crear base de datos** → modo producción → región `nam5` o la más cercana.
6. **Configuración del proyecto (engrane) → Tus apps → Web (`</>`)** → registra la app y copia `apiKey`, `authDomain`, `projectId`, `appId`.
7. **Authentication → Configuración → Dominios autorizados:** agrega `TU-USUARIO.github.io`.

## 2. Subir las reglas de seguridad

```bash
npm i -g firebase-tools
firebase login
firebase use --add          # elige tu proyecto
firebase deploy --only firestore:rules
```

## 3. Crear el espacio privado (una sola vez)

Opción A — script (recomendado):
1. Firebase → Configuración del proyecto → **Cuentas de servicio → Generar nueva clave privada**. Guarda el archivo como `service-account.json` en esta carpeta (ya está en `.gitignore`; **nunca lo subas**).
2. Ejecuta:
```bash
npm i -D firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/provision.mjs nuestro-cine UID_A UID_B "CINE DE DOS"
```
3. Borra `service-account.json` cuando termines.

Opción B — a mano en la consola de Firestore: crea la colección `spaces`, documento con ID `nuestro-cine` y campos `name` (string), `memberUids` (array con los dos UID), `createdByUid` (string), `createdAt` (timestamp).

## 4. TMDB (catálogo y pósters)

1. Crea cuenta en https://www.themoviedb.org → Ajustes → API → solicita una clave (uso personal / no comercial).
2. Copia el **Token de lectura de la API (v4)**.
3. Revisa los términos vigentes: https://www.themoviedb.org/api-terms-of-use. En GitHub Pages el token queda visible en el JavaScript público. Si los términos o tu tranquilidad lo piden, usa un proxy (p. ej. un Cloudflare Worker que reenvíe a `https://api.themoviedb.org/3` y agregue el token) y pon su URL en `VITE_TMDB_PROXY_URL` en lugar del token.

Sin TMDB la app funciona igual; solo se agregan películas a mano con un póster tipográfico.

## 5. Variables locales

```bash
cp .env.example .env.local
```
Llena los valores y corre `npm run dev`. Ya no verás el aviso de modo demostración.

## 6. Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube este proyecto (`.env.local` no se sube).
2. Repo → **Settings → Pages → Source: GitHub Actions.**
3. Repo → **Settings → Secrets and variables → Actions**:
   - **Variables:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_SPACE_ID`, y opcional `VITE_TMDB_PROXY_URL`.
   - **Secrets:** `VITE_TMDB_TOKEN` (si no usas proxy).
4. Haz push a `main`. En la pestaña **Actions** verás el despliegue; al terminar, tu app estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

> La `apiKey` de Firebase no es un secreto: identifica el proyecto. La seguridad real la dan Authentication y `firestore.rules`.

## 7. Probar desde dos celulares

1. Abre el enlace en ambos teléfonos y entra cada quien con su correo.
2. Elige nombre, color y forma de avatar.
3. Uno agrega «Interstellar»; el otro la ve aparecer sin recargar.
4. Instálala: iPhone → Compartir → *Agregar a inicio*. Android → menú → *Instalar app*.

---

## Seguridad

`firestore.rules` niega todo por defecto y solo deja entrar a los dos UID del espacio. Nadie puede agregarse al espacio, cambiar `memberUids`, suplantar a la otra persona, editar su perfil ni tocar su calificación.

Pruebas con el emulador (requiere Java):
```bash
npm run test:rules
```

## Modelo de datos

```
spaces/{spaceId}                      name, memberUids[2], createdByUid, createdAt
spaces/{spaceId}/members/{uid}        displayName, avatarPreset, accentColor   (perfil público, sin email)
spaces/{spaceId}/movies/{movieId}     tmdb_<id> o manual_<uuid>; status, watchedDate "YYYY-MM-DD", addedByUid…
spaces/{spaceId}/ratings/{movieId_uid} movieId, userUid, score 1–10
```

Diferencias respecto al brief, a propósito:
- Las calificaciones van en `spaces/{id}/ratings` (un solo listener en tiempo real) en vez de una subcolección por película.
- El perfil visible vive en `spaces/{id}/members/{uid}`: la otra persona nunca puede leer tu correo.
- `watchedDate` es día de calendario (no cambia si viajas de zona horaria).

## Pendiente (fase 2)

Elegir película al azar, favoritos, historial de re-vistas, calendario de próximas funciones.
