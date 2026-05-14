# Panini World Cup 2026 — Gestor de cromos

App para administrar qué cromos tienes, cuáles te faltan y cuáles tienes
repetidos. **Angular 18 (standalone) + Firestore + Firebase Auth.**

Proyecto verificado: compila sin errores con `ng build`.

## Estructura del álbum (tu edición)

- **48 selecciones × 21 slots** = 1.008 cromos
  - slot 1 = escudo (foil), slot 13 = foto del equipo, resto = jugadores
  - código por cromo: `MEX1`, `MEX13`, `ARG21`, etc.
- **34 cromos especiales** (ninguno foil)
  - `00` Logo Panini
  - `FWC1`–`FWC8` emblemas, mascota, lema, balón, trofeo, países anfitriones
  - `FWC9`–`FWC19` selecciones campeonas (ajusta el país de cada slot)
  - `CC1`–`CC14` Coca-Cola
- **Total: 1.042 slots**

## Modelo de datos en Firestore

    albums/wc2026                          (doc del álbum)
    albums/wc2026/sections/{id}            (48 equipos + 3 secciones especiales)
    albums/wc2026/stickers/{code}          (1.042 docs, ID = código del cromo)

    users/{uid}/collections/wc2026         (doc con stats denormalizadas)
    users/{uid}/collections/wc2026/items/{stickerId}
                                           (1 doc SOLO por cromo poseído;
                                            count: 1 = pegado, >=2 = con repes)

Un cromo sin documento en `items` = no lo tienes. Evita crear 1.042
documentos vacíos al iniciar.

## Setup paso a paso

### 0. Crear proyecto en Firebase

1. Crea un proyecto en https://console.firebase.google.com
2. Activa **Firestore Database** (modo producción).
3. Activa **Authentication** > Sign-in method > habilita
   **Google** y **Anónimo**.

### 1. Generar e importar el catálogo

    cd scripts
    npm install
    node generate-catalog.js          # genera catalog.json

Descarga `serviceAccountKey.json` desde:
Firebase Console > Configuración del proyecto > Cuentas de servicio >
Generar nueva clave privada. Colócalo en `scripts/` (NO lo subas a git).

    node import-to-firestore.js       # sube las 1.042 fichas a Firestore

### 2. Reglas de seguridad

Copia el contenido de `firestore.rules` en
Firebase Console > Firestore > Reglas, y publica.

### 3. App Angular

    cd angular
    npm install
    cp .env.example .env              # rellena los valores reales

Saca los valores de Firebase Console > Configuración del proyecto >
Tus apps > SDK config. El archivo `.env` está en `.gitignore`, así que
nunca se sube al repo. En el primer `npm start` / `npm run build` se
genera automáticamente `src/environments/environment.ts` con esos
valores (vía `scripts/set-env.js`).

    npm start                         # http://localhost:4200

## Uso

- **/login** — entra con Google (colección sincronizada entre
  dispositivos) o como invitado (atada a ese navegador).
- **/album** — grid completo. Click izquierdo = alterna falta/pegado.
  Click derecho = suma una repe.
- **/faltas** — lista de lo que falta, agrupada por sección, copiable
  para compartir.
- **/repes** — gestión de repetidos con botones +/−, lista copiable
  para organizar cambios.

## Estructura de archivos

    scripts/
      generate-catalog.js     Genera catalog.json (edita aquí la estructura)
      import-to-firestore.js  Sube el catálogo a Firestore (Admin SDK)
      catalog.json            Catálogo generado (1.042 cromos)
    firestore.rules           Reglas de seguridad
    angular/
      src/app/
        core/
          models/             Interfaces del dominio
          services/           Catálogo, inventario, vista, auth
          guards/             authGuard
        features/
          login/              Pantalla de login
          album-view/         Grid del álbum
          missing-list/       Lista de faltas
          duplicates/         Gestión de repes

## Personalización pendiente

- Nombres reales de jugadores: salen como "Jugador 1, 2...".
  Edítalos en `scripts/generate-catalog.js` y regenera.
- `FWC9`–`FWC19`: asigna el país campeón de cada slot.
- Si los escudos de selección NO son foil en tu edición, cambia
  `foil: kind === 'emblem'` por `foil: false` en generate-catalog.js.

## Siguiente iteración (no incluido)

- Pantalla de estadísticas con gráficos de progreso.
- Búsqueda/filtro de cromos por código.
- Modo intercambio entre coleccionistas.
# album-tracker-wc2026
