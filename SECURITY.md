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

Si forkeaste este proyecto y vas a deployarlo:

1. **Configurá tu propia whitelist** (`NG_APP_ALLOWED_EMAILS` y
   `firestore.rules`). Si dejás todo abierto, cualquier cuenta de Google
   puede consumir tu cuota.
2. **Nunca commitees** `serviceAccountKey.json` ni `.env` — ya están en
   `.gitignore`, pero verificá antes del primer push.
3. **Revisá `firestore.rules`** antes de cada deploy. Es la única barrera
   real.
4. Considerá activar **Firebase App Check** si tu fork tiene más usuarios
   que un puñado de amigos.

## Histórico

| Fecha | Severidad | Resumen |
|---|---|---|
| — | — | Sin vulnerabilidades reportadas todavía. |
