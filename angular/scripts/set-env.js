/**
 * Lee angular/.env y genera src/environments/environment.ts antes de
 * build/serve. Asi el .env queda fuera de git, pero el bundle final
 * lleva los valores reales.
 *
 * Se invoca automaticamente via "prestart" y "prebuild" en package.json.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const requiredKeys = [
  'NG_APP_FIREBASE_API_KEY',
  'NG_APP_FIREBASE_AUTH_DOMAIN',
  'NG_APP_FIREBASE_PROJECT_ID',
  'NG_APP_FIREBASE_STORAGE_BUCKET',
  'NG_APP_FIREBASE_MESSAGING_SENDER_ID',
  'NG_APP_FIREBASE_APP_ID',
];

const missing = requiredKeys.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    '\n[set-env] Faltan variables en angular/.env:\n  - ' +
      missing.join('\n  - ') +
      '\nCopia angular/.env.example a angular/.env y rellena los valores.\n'
  );
  process.exit(1);
}

const albumId = (process.env.NG_APP_ALBUM_ID || 'wc2026').trim();

const allowedEmails = (process.env.NG_APP_ALLOWED_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.mkdirSync(path.dirname(target), { recursive: true });

const contents = `// Archivo GENERADO por scripts/set-env.js a partir de .env.
// No editar a mano, no versionar.
export const environment: {
  production: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  albumId: string;
  allowedEmails: string[];
} = {
  production: ${process.env.NODE_ENV === 'production'},
  firebase: {
    apiKey: ${JSON.stringify(process.env.NG_APP_FIREBASE_API_KEY)},
    authDomain: ${JSON.stringify(process.env.NG_APP_FIREBASE_AUTH_DOMAIN)},
    projectId: ${JSON.stringify(process.env.NG_APP_FIREBASE_PROJECT_ID)},
    storageBucket: ${JSON.stringify(process.env.NG_APP_FIREBASE_STORAGE_BUCKET)},
    messagingSenderId: ${JSON.stringify(process.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID)},
    appId: ${JSON.stringify(process.env.NG_APP_FIREBASE_APP_ID)},
  },
  albumId: ${JSON.stringify(albumId)},
  allowedEmails: ${JSON.stringify(allowedEmails)},
};
`;

fs.writeFileSync(target, contents, 'utf8');
console.log(
  '[set-env] environment.ts generado',
  '\n  projectId   :', process.env.NG_APP_FIREBASE_PROJECT_ID,
  '\n  albumId     :', albumId,
  '\n  whitelist   :', allowedEmails.length === 0 ? '(abierta)' : `${allowedEmails.length} email(s)`
);
