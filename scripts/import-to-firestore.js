/**
 * Importa catalog.json a Firestore.
 *
 * Requisitos:
 *   npm install firebase-admin
 *   Descarga serviceAccountKey.json desde:
 *     Firebase Console > Configuración del proyecto > Cuentas de servicio
 *     > Generar nueva clave privada
 *   Colócalo junto a este script (NO lo subas a git).
 *
 * Uso:  node import-to-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importCatalog() {
  const albumId = catalog.album.id;
  const albumRef = db.collection('albums').doc(albumId);

  // 1. Documento del álbum
  await albumRef.set({
    ...catalog.album,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Álbum "${albumId}" creado.`);

  // 2. Secciones
  let batch = db.batch();
  catalog.sections.forEach((section) => {
    batch.set(albumRef.collection('sections').doc(section.id), section);
  });
  await batch.commit();
  console.log(`${catalog.sections.length} secciones importadas.`);

  // 3. Stickers — en lotes de 500 (límite de Firestore por batch)
  const BATCH_SIZE = 500;
  let imported = 0;
  for (let i = 0; i < catalog.stickers.length; i += BATCH_SIZE) {
    const chunk = catalog.stickers.slice(i, i + BATCH_SIZE);
    const b = db.batch();
    chunk.forEach((sticker) => {
      // el ID del documento es el código del cromo: MEX1, ARG13, etc.
      b.set(albumRef.collection('stickers').doc(sticker.code), sticker);
    });
    await b.commit();
    imported += chunk.length;
    console.log(`  ${imported}/${catalog.stickers.length} stickers...`);
  }

  console.log('\nImportación completa.');
  console.log(`Total de cromos en el catálogo: ${catalog.stickers.length}`);
}

importCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error en la importación:', err);
    process.exit(1);
  });
