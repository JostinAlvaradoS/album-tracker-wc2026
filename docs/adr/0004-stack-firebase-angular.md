# ADR-0004: Stack — Firebase (Firestore + Auth + Hosting) con frontend Angular

- **Estado:** Aceptado
- **Fecha:** 2026-05-16
- **Deciders:** @jostinalvarados

## Contexto y problema

El proyecto es un tracker personal de cromos del Mundial 2026 pensado
para 2-3 usuarios (yo + amigos). Necesita:

- Persistencia compartida entre dispositivos (mismo usuario en celular
  + laptop).
- Login con Google (low-friction onboarding).
- Acceso restringido por whitelist a un puñado de cuentas.
- Funcionar offline / con red mala durante un cambio físico de cromos.
- **Costo cero** mientras los usuarios sean pocos.
- **Operación cero**: no quiero mantener servidores, hacer backups
  manuales, ni rotar certificados.

El alcance del backend es trivial: ~1.000 docs de catálogo estático,
hasta ~1.000 docs por usuario, escrituras incrementales pequeñas. **No
hay lógica de negocio que justifique un servidor propio.** La decisión
del stack se centra en qué BaaS (Backend-as-a-Service) o plataforma
cubre los requisitos con el menor costo y la menor complejidad.

## Drivers de la decisión

1. **Plan gratuito** que aguante la realidad de uso (2-3 usuarios
   activos durante 3 meses del Mundial, picos de actividad).
2. **Sin ops**: sin VPS, sin Kubernetes, sin pipelines CI complejos.
3. **Realtime sync** entre dispositivos sin polling.
4. **Offline-first**: la app tiene que funcionar mientras intercambias
   cromos en un parque con 1 raya de señal.
5. **Auth + DB + Hosting bajo un solo proveedor y SDK** para minimizar
   integraciones.
6. **Buena experiencia con Angular**: la decisión de frontend es Angular
   (ver § "Decisión del frontend" más abajo), así que el backend debería
   tener un SDK maduro para ese stack.

## Opciones consideradas

### A. Firebase: Firestore + Auth + Hosting

[firebase.google.com](https://firebase.google.com)

- **Bueno**: Free tier generoso para este caso de uso (50.000 reads/día,
  20.000 writes/día, 1 GB storage, 10 GB bandwidth/mes; Auth gratis hasta
  miles de MAU; Hosting con 360 MB/día y 10 GB storage).
- **Bueno**: Realtime listeners built-in (Watch API + WebSocket).
- **Bueno**: **Offline-first nativo** con `persistentLocalCache`
  (IndexedDB). Ver [ADR-0001](0001-firestore-caching-strategy.md).
- **Bueno**: Auth con Google es one-click en Firebase Console.
- **Bueno**: `AngularFire` es un wrapper oficial y maduro para Angular,
  con soporte de signals, RxJS y SSR.
- **Bueno**: Reglas declarativas (`firestore.rules`) — modelo de seguridad
  versionable.
- **Bueno**: Sin "pausa por inactividad" — los proyectos viven aunque
  pasen meses sin uso.
- **Malo**: NoSQL document model — queries complejas (joins, agregados)
  requieren modelar la data a propósito.
- **Malo**: Vendor lock-in más profundo que Postgres (el modelo no es
  portable a otra DB sin reescribir).
- **Malo**: El lenguaje de reglas tiene curva de aprendizaje.

### B. Supabase (Postgres + Auth + Realtime + Storage)

[supabase.com](https://supabase.com)

- **Bueno**: Postgres real (SQL familiar, joins, transactions, funciones,
  views). Si la app crece a queries complejos, no hay refactor de
  modelado.
- **Bueno**: Row Level Security (RLS) como modelo de seguridad —
  potente y familiar para devs con background SQL.
- **Bueno**: Open source — la imagen Docker corre self-hosted si algún
  día quiero salirme de la nube.
- **Bueno**: Auth con Google también disponible.
- **Bueno**: PostgREST genera REST endpoints automáticos para cada tabla.
- **Malo crítico**: **El plan Free pausa los proyectos tras 7 días de
  inactividad.** Para una app que se usa intensivo durante el Mundial y
  luego queda dormida por semanas (período entre torneos), esto rompe
  el flujo: hay que "despertar" el proyecto manualmente desde la
  consola cada vez. Inviable como "set and forget".
- **Malo**: Realtime requiere habilitar el motor de Realtime y publicar
  cada tabla; más fricción que Firestore listeners.
- **Malo**: **Offline-first no está incluido.** Hay que sumar librerías
  externas (RxDB, ElectricSQL, WatermelonDB) o construirlo a mano.
- **Malo**: Free tier de DB es 500 MB. Nuestro catálogo entero pesa
  ~232 KB en JSON; cómodo, pero el límite es más ajustado que el de
  Firestore en términos de storage si la cosa creciera.
- **Malo**: `supabase-js` no tiene un binding tan fluido para Angular
  como AngularFire; integración menos opinada.

### C. Serverless cloud-native (Vercel/Netlify + PlanetScale/Neon + Auth0 o Clerk)

Stack típico: frontend en Vercel/Netlify, DB serverless (PlanetScale,
Neon, Turso), auth en Auth0 o Clerk, edge functions para business logic.

- **Bueno**: Cada pieza es best-in-class para su responsabilidad.
- **Bueno**: Free tiers individuales son generosos en su propio dominio.
- **Bueno**: Sin vendor lock-in fuerte; piezas reemplazables.
- **Malo crítico**: **Hay que escribir el backend.** API endpoints para
  CRUD, validación, auth checks, rate limiting. La app no tiene lógica
  de negocio que justifique este esfuerzo.
- **Malo**: Realtime requiere infraestructura adicional (WebSockets,
  SSE, Pusher, Ably). Otro servicio que integrar.
- **Malo**: Offline-first: 100% DIY.
- **Malo**: 4-5 cuentas distintas (Vercel, DB, Auth0, Pusher...) — pesadilla
  operativa para algo trivial.
- **Malo**: Cold starts de funciones en escenarios de bajo tráfico.

### D. AWS / GCP serverless (Lambda + DynamoDB, Cloud Functions + Firestore)

- **Bueno**: Pay-per-use con free tiers anuales (Lambda: 1M invocaciones,
  DynamoDB: 25 RCU/WCU).
- **Bueno**: Escalabilidad infinita.
- **Malo crítico**: Curva de aprendizaje brutal para un side project
  (IAM, VPC, CloudFormation/Terraform).
- **Malo**: Configurar realtime y offline desde cero. DynamoDB Streams +
  AppSync para realtime, pero suma horas de setup.
- **Malo**: La consola es hostil comparada con Firebase Console.

### E. Pocketbase (single-binary BaaS, self-hosted)

[pocketbase.io](https://pocketbase.io)

- **Bueno**: Un solo binario Go con SQLite, Auth y Realtime.
- **Bueno**: Open source, super liviano.
- **Malo**: Requiere un VPS para correrlo. Costos: $5-10/mes mínimo, más
  ops (renovación SSL, backups, updates).
- **Malo**: Free tier no aplica — pagas por el server.
- **Malo**: Comunidad más chica, menos recursos de troubleshooting.

### F. Backend propio (Node/Express + Postgres en VPS)

- **Bueno**: Control total, sin lock-in.
- **Malo**: 100% ops. VPS, dominio, SSL, monitoring, backups, deploys.
- **Malo**: Tiempo de implementación 10-20× mayor para llegar al MVP.
- **Malo**: No es free; mínimo $5/mes de VPS.

## Decisión

Adoptamos la **opción A (Firebase: Firestore + Auth + Hosting)**.

El combo dispara todos los drivers a la vez:
- Plan Spark cubre 2-3 usuarios con sobra (ver
  [ADR-0001](0001-firestore-caching-strategy.md) — ~25 reads/día/usuario
  con caching, ~0.05% de la cuota).
- Operación cero: Firebase Console + `firebase deploy` y listo.
- Realtime + offline son features del SDK, no infraestructura aparte.
- Auth con Google es un toggle, no un proyecto.
- `AngularFire` da una integración pulida con Angular.
- No hay pausa por inactividad: la app puede quedar dormida un año y
  seguir respondiendo cuando vuelva el tráfico.

### Decisión del frontend (Angular)

Elegido en conjunto con el backend por tres razones:

1. **TypeScript estricto baked-in**: la app es chica pero tiene muchos
   tipos del modelo de Firestore; Angular fuerza buenas prácticas que
   en React o Vue dependerían de configuración manual de ESLint.
2. **`AngularFire` es first-class**: soporte oficial para signals,
   RxJS, SSR.
3. **Standalone components + signals** (Angular 17+) eliminan la mayor
   parte del boilerplate clásico (NgModules, decoradores extensos).

Trade-off aceptado: la comunidad de Angular es más chica que React; menos
contributors potenciales en un OSS. Para el alcance de este proyecto
(tracker personal), el ratio "calidad de tipos / fricción de setup" es
mejor con Angular.

## Consecuencias

### Positivas

- **Tiempo a MVP minimal**: el primer prototipo funcional (login, álbum
  con grid, mutaciones) corrió en horas, no días.
- **Costos $0 hasta ~2.000 usuarios diarios estimados** (ver
  [ADR-0001](0001-firestore-caching-strategy.md) para el cálculo).
- **Ops $0**: no hay servidor que mantener.
- **Offline real**: la app sigue funcionando bajando del subte.
- **Multi-dispositivo automático**: el SDK sincroniza vía Watch API.

### Negativas

- **Vendor lock-in con Firebase.** Si Google cambia las condiciones del
  plan Spark, o si quiero migrar a otra plataforma, el modelo NoSQL
  document no se exporta directo a una DB relacional. Mitigación: el
  `core/services/` actúa como repository layer, así que un eventual
  cambio de backend tocaría 3 archivos (`album-catalog.service.ts`,
  `collection.service.ts`, `auth.service.ts`), no la app entera.
- **NoSQL limita queries**: queries complejos requieren denormalización
  o índices compuestos. Para este proyecto no aplica.
- **Reglas de Firestore como lenguaje aparte**: hay que aprender la
  sintaxis y los matches. Mitigación: la superficie es chica (un
  `match` por cada path).
- **Comunidad de Angular más chica** que React/Vue: barrera levísima
  para contribuidores potenciales. Mitigación: convenciones claras en
  `CONTRIBUTING.md`.

## Tabla comparativa resumen

| Criterio | A. Firebase | B. Supabase | C. Vercel + PS + Auth0 | D. AWS Lambda + DDB | E. Pocketbase | F. Self-hosted |
|---|---|---|---|---|---|---|
| Costo a nuestra escala | **$0** | $0 (con pausas) | $0 base | $0 (cap. anual) | ~$5-10/mes | ~$5/mes |
| Pausa por inactividad | **No** | **Sí (7 días)** | No | No | No (auto-hospedado) | No |
| Realtime built-in | **Sí** | Sí (extra setup) | No | No (DIY) | Sí | No (DIY) |
| Offline-first built-in | **Sí (IndexedDB)** | No | No | No | No | No |
| Auth con Google | 1 click | 1 click | Auth0 / Clerk | Cognito (setup) | Sí | DIY |
| Lock-in | Alto | Bajo (Postgres) | Bajo | Alto (AWS) | Nulo | Nulo |
| Curva de setup (h) | **~1** | ~2 | ~6-8 | ~10+ | ~3-4 | ~10+ |
| SDK Angular maduro | **Sí (AngularFire)** | Genérico (supabase-js) | Genérico | Genérico | Limitado | Lo que armes |
| Ops | **Nada** | Nada | Mínimo | Medio | Server propio | Total |

(en **negrita** las ventajas decisivas de la opción elegida)

## Cuándo revisar esta decisión

- Si la app llega a **>2.000 usuarios diarios** y la cuota Spark se
  vuelve un cuello de botella → migrar a plan Blaze (pay-as-you-go) o
  reevaluar Supabase.
- Si aparece **necesidad de queries complejas** (joins de varias
  colecciones, agregados sobre toda la data) → considerar Supabase /
  Postgres.
- Si Firebase **anuncia cambios desfavorables** en el plan Spark
  (reducción de cuota, deprecación) → escenario de fallback con la
  capa de servicios actuando como repository.

## Referencias

- [Firebase pricing](https://firebase.google.com/pricing)
- [Supabase free tier — project pausing](https://supabase.com/docs/guides/platform/billing-on-supabase#pausing-projects-on-the-free-plan)
- [AngularFire](https://github.com/angular/angularfire)
- [ADR-0001 — Caching de Firestore](0001-firestore-caching-strategy.md) (cómo nos mantenemos dentro del free tier)
- [ADR-0003 — Whitelist dual](0003-whitelist-dual-client-rules.md) (cómo restringimos consumo de cuota por terceros)
