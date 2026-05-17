// Plantilla de referencia. El archivo real environment.ts se genera
// automaticamente desde angular/.env via scripts/set-env.js
// (corre como prestart/prebuild). No importes este archivo en la app.
export const environment = {
  production: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  /** Id del documento en albums/{albumId}. Default: 'wc2026'. */
  albumId: 'wc2026',
  /** Whitelist de correos autorizados. Vacio = modo abierto. */
  allowedEmails: [] as string[],
};
