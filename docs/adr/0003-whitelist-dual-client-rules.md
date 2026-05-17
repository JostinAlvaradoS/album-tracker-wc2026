# ADR-0003: Whitelist dual — cliente (UX) + reglas Firestore (autoridad)

- **Estado:** Aceptado
- **Fecha:** 2026-05-16
- **Deciders:** @jostinalvarados

## Contexto y problema

La app permite que cualquier cuenta de Google se autentique vía Firebase
Auth. Como es un tracker personal/familiar (2-3 usuarios esperados), no
queremos que terceros entren y consuman cuota del plan Spark, aun cuando
no puedan ver datos ajenos.

Necesitamos restringir el acceso a un conjunto explícito de correos
electrónicos, pero a la vez **soportar forks OSS** donde otros operadores
configuren su propia lista o decidan dejar la app abierta.

Una whitelist puramente en cliente es trivial de bypasear (modificar el
JS desde DevTools). Una whitelist puramente en reglas de Firestore es
segura pero genera mala UX: el usuario logra autenticarse, navega a
`/album`, y todas sus operaciones fallan con `permission-denied` sin
contexto.

## Drivers de la decisión

1. **Autoridad real en el servidor**: el cliente no decide acceso.
2. **UX clara cuando el acceso se deniega**: mensaje accionable, no
   errores crípticos.
3. **Configurable por fork** sin tocar código (env vars).
4. **Bajo costo operacional**: agregar/sacar usuarios debe ser una sola
   acción, no dos sincronizaciones manuales propensas a error.
5. **Modo abierto para demos**: dejar la app sin whitelist debe ser
   trivial (vaciar config = open access).

## Opciones consideradas

### A. Solo reglas de Firestore (sin chequeo cliente)

- **Bueno**: una sola fuente de verdad, máxima seguridad.
- **Malo**: el usuario logra `signInWithPopup`, navega a `/album`,
  y cada read falla. Genera consola con errores y la UI muestra un
  estado "loading" eterno o data vacía.
- **Malo**: no hay forma de mostrar un mensaje "no estás autorizado"
  sin un round-trip que también fallaría.

### B. Solo whitelist en cliente

- **Bueno**: UX perfecta, mensajes claros.
- **Malo**: trivial de bypasear con DevTools. Un atacante modifica el
  bundle JS, evita el `signOut` post-login y empieza a consumir cuota
  del proyecto Firebase. No bloquea reads de datos ajenos (eso siempre
  va a fallar por las reglas que validan `uid == request.auth.uid`),
  pero sí permite **agotar la cuota** del operador.

### C. Whitelist en custom claims de Firebase Auth

- **Bueno**: una sola fuente, propagada al token JWT, evaluable en
  reglas Firestore (`request.auth.token.allowlisted == true`).
- **Bueno**: el cliente puede leer el claim del token y mostrar UX.
- **Malo**: setear claims requiere Admin SDK (Cloud Function o script
  manual). Agregar un amigo deja de ser un cambio de config y pasa a
  ser una operación.
- **Malo**: overkill para 2-3 usuarios.

### D. Whitelist en doc Firestore `config/access`

- **Bueno**: una sola fuente, gestionable desde Firebase Console UI.
- **Bueno**: cliente y reglas leen del mismo lugar.
- **Malo**: las reglas que hacen `exists()` o `get()` sobre otro doc
  cuentan como reads adicionales en cada operación → costoso.
- **Malo**: requiere reglas más complejas y un doc public-readable.

### E. Whitelist dual: variable de entorno (cliente) + lista hardcoded en `firestore.rules` (servidor)

- **Bueno**: cero overhead — cliente lee config local, reglas evalúan
  sin lecturas adicionales.
- **Bueno**: el cliente da UX correcta (`UnauthorizedEmailError` con
  `signOut` inmediato y mensaje específico).
- **Bueno**: las reglas son la autoridad real; el cliente nunca decide.
- **Bueno**: modo abierto = `NG_APP_ALLOWED_EMAILS=""` y `isAllowlisted()`
  ajustada — útil para forks demo.
- **Malo**: dos archivos a mantener en sync manual.

## Decisión

Adoptamos la **opción E**.

### Capa cliente (UX, no autoridad)

`environment.allowedEmails` se popula desde `NG_APP_ALLOWED_EMAILS` (env
var, comma-separated). Se inyecta a `AuthService` vía
`ALLOWED_EMAILS` InjectionToken:

```ts
// core/services/auth.service.ts
async loginWithGoogle(): Promise<void> {
  const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
  if (this.isOpenAccess) return;
  const email = cred.user.email?.toLowerCase() ?? '';
  if (!this.allowedEmails.has(email)) {
    await signOut(this.auth);
    throw new UnauthorizedEmailError(email);
  }
}
```

Si `ALLOWED_EMAILS` está vacío → `isOpenAccess = true`, la app no aplica
filtro. Útil para forks que prefieren abrir el acceso.

### Capa servidor (autoridad)

`firestore.rules` define la función `isAllowlisted()` que valida el email
en el token de auth contra una lista hardcoded:

```
function isAllowlisted() {
  return request.auth != null
    && request.auth.token.email_verified == true
    && request.auth.token.email in [
      'jostinalvaradosarmiento@gmail.com'
    ];
}
```

Todas las reglas de lectura/escritura usan `isAllowlisted()` como
precondición. Es **imposible** que un cliente acceda a datos o consuma
escrituras sin estar en la lista del servidor, independientemente del
bundle JS.

## Consecuencias

### Positivas

- **Autoridad clara**: si las dos listas divergen, el servidor manda.
  Un email solo en cliente "ve" la UI pero no opera; un email solo en
  servidor opera pero recibe el `signOut` post-login (efectivamente
  inutilizable hasta que se agregue al cliente).
- **UX inmediata** cuando el acceso se deniega: mensaje
  "La cuenta X no está autorizada. Pídeselo al admin."
- **Cero reads adicionales** por operación (vs. opción D).
- **Modo abierto** para forks demo: `NG_APP_ALLOWED_EMAILS=""` +
  `isAllowlisted()` simplificada a `request.auth != null`.

### Negativas

- **Sincronización manual** entre `.env` y `firestore.rules`. Si se
  agrega un email solo en uno, el comportamiento es inconsistente.
  Mitigaciones:
  - Documentado en README, CLAUDE.md y comentario explícito en
    `auth.service.ts` y `firestore.rules`.
  - El comentario del token en `core/config/app.tokens.ts` enfatiza
    que la autoridad es Firestore.
- **No escalable a decenas de usuarios**: cada cambio requiere redeploy
  de reglas. Para 2-3 usuarios es trivial; para más, migrar a opción C
  (custom claims) o D (doc Firestore).
- **Email como identidad**: si un atacante consigue crear una cuenta
  Google con un email permitido, accede. Mitigación: el flag
  `email_verified` se exige en las reglas; Google solo lo marca true
  para sus cuentas propias.

## Cuándo revisar esta decisión

- Si el número de usuarios autorizados pasa de **~10**.
- Si se agrega un proveedor de auth distinto a Google.
- Si se necesita revocar acceso "en caliente" sin redeploy de reglas
  (caso de uso: kick de un usuario que abusa).

## Referencias

- [Firebase Auth custom claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore security rules — `request.auth.token`](https://firebase.google.com/docs/firestore/security/rules-conditions#user_data)
- `firestore.rules` — implementación servidor
- `core/services/auth.service.ts` + `core/config/app.tokens.ts` — implementación cliente
- `SECURITY.md` — modelo de amenazas
