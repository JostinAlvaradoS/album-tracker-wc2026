# Política de Seguridad

## Reportar una vulnerabilidad

Si encontraste una vulnerabilidad de seguridad, **no abras un issue público**.
Repórtala en privado a:

📧 **jostinalvaradosarmiento@gmail.com**

Incluye:

- Descripción clara del problema.
- Pasos para reproducir (idealmente un PoC mínimo).
- Impacto estimado (qué puede hacer un atacante).
- Versiones afectadas o commit de referencia.

Tiempo de respuesta esperado: **48–72 horas** para acuse de recibo. La
remediación depende de la gravedad.

## Qué está in-scope

Aceptamos reportes sobre:

- **Bypass de autenticación o whitelist.** Por ejemplo, lograr iniciar sesión
  con un email no autorizado, o leer datos sin estar autenticado.
- **Bypass de reglas de Firestore.** Lograr leer/escribir documentos fuera
  de los permisos definidos en `firestore.rules`.
- **Inyección o XSS** en la UI Angular.
- **Filtración de secretos** (service account, tokens) en el código o git
  history.
- **Vulnerabilidades en dependencias** críticas no parcheadas.

## Qué NO consideramos vulnerabilidades

- **Defacement cosmético** de la UI mediante DevTools en la propia sesión
  del atacante.
- **Rate-limit o cuotas de Firebase.** El plan Spark tiene límites diarios
  conocidos; agotarlos no es una vulnerabilidad.
- **Reportes automatizados de scanners** sin contexto ni PoC.
- **Funcionalidad ausente** (ej. "no hay 2FA"). Eso es feature request.
- **Ataques que requieren acceso físico** al dispositivo del usuario.

## Modelo de amenazas

Este proyecto es un tracker personal de cromos. La superficie de ataque es
chica:

- **Datos sensibles:** Ninguno. La colección de cromos de un usuario no es
  PII relevante.
- **Activos principales:** La integridad de la colección del usuario y la
  cuota de Firebase del operador del fork.
- **Adversarios esperados:** Usuarios no autorizados intentando leer/escribir
  datos ajenos, o agotar la cuota del proyecto Firebase.

La línea de defensa principal son las **reglas de Firestore** en
`firestore.rules`. La whitelist en cliente (`AuthService`) es solo UX —
nunca confiar en ella para autorización.

## Forks

Si forkeaste este proyecto y vas a deployarlo, el setup mínimo de
seguridad se hace **todo desde Firebase Console**, sin necesidad de
entrar a Google Cloud Console ni configurar IAM. Tres pasos:

### Setup mínimo (5 minutos, todo en Firebase Console)

1. **Configurá tu whitelist** en dos lugares (mantenelos sincronizados):
   - `angular/.env` → `NG_APP_ALLOWED_EMAILS=tu@gmail.com,amigo@gmail.com`
   - `firestore.rules` → la lista de emails dentro de `isAllowlisted()`

2. **Deployea las reglas** antes de exponer la app:

       firebase deploy --only firestore:rules

   Esta es la **única barrera real**. Sin esto, cualquiera podría
   leer/escribir datos.

3. **Higienizá Firebase Console** (1 click cada uno):
   - **Authentication → Sign-in method** → habilitá solo Google,
     deshabilitá Anonymous si está activo.
   - **Authentication → Settings → Authorized domains** → confirmá
     que solo estén `localhost`, `<proyecto>.web.app`,
     `<proyecto>.firebaseapp.com`. Quitá cualquier dominio extra.

### Higiene del repo

- **Nunca commitees** `serviceAccountKey.json` ni `.env` — ya están en
  `.gitignore`, pero verifica antes del primer push.
- **Revisá `firestore.rules`** antes de cada deploy. Es lo único que
  separa tu Firestore de un acceso externo.

### Hardening opcional (solo si quieres ir más allá)

Estos pasos requieren entrar a Google Cloud Console y entender un poco
más de IAM. **No son necesarios** para que la app sea segura, pero
agregan capas extra para escenarios específicos:

- **HTTP referrer restrictions** sobre la API key (GCP → Credentials).
  Útil si llegás a usar Cloud Functions, Cloud Storage u otros servicios
  fuera de Auth + Firestore.
- **Firebase App Check** (Firebase Console, requiere configurar
  reCAPTCHA en GCP). Útil si tu fork tiene más usuarios que un puñado
  de amigos y quieres verificar que los requests vienen de tu app real.

Si solo usas Auth + Firestore + Hosting (el stack default), Firebase
Console solo te alcanza.

## Histórico

| Fecha | Severidad | Resumen |
|---|---|---|
| — | — | Sin vulnerabilidades reportadas todavía. |
