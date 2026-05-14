/**
 * Importa catalog.json a Firestore.
 *
 * Antes de escribir, BORRA secciones y stickers viejos del catálogo
 * para que un cambio de orden / cantidad no deje docs huérfanos.
 * Las colecciones de cada usuario (users/...) NO se tocan.
 *
 * Requisitos:
 *   npm install firebase-admin
 *   sa.json en la raíz del proyecto (Firebase Console > Cuentas de servicio).
 *
 * Uso:  node import-to-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('../sa.json');
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteCollection(collRef) {
  let total = 0;
  while (true) {
    const snap = await collRef.limit(500).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < 500) break;
  }
  return total;
}

async function importCatalog() {
  const albumId = catalog.album.id;
  const albumRef = db.collection('albums').doc(albumId);

  // 0. Limpiar catálogo anterior (no toca users/*)
  console.log('Limpiando catálogo anterior...');
  const delSec  = await deleteCollection(albumRef.collection('sections'));
  const delStk  = await deleteCollection(albumRef.collection('stickers'));
  console.log(`  ${delSec} secciones y ${delStk} stickers eliminados.`);

  // 1. Documento del álbum
  await albumRef.set({
    ...catalog.album,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Álbum "${albumId}" actualizado.`);

  // 2. Secciones
  let batch = db.batch();
  catalog.sections.forEach((section) => {
    batch.set(albumRef.collection('sections').doc(section.id), section);
  });
  await batch.commit();
  console.log(`${catalog.sections.length} secciones importadas.`);

  // 3. Stickers en lotes de 500
  const BATCH_SIZE = 500;
  let imported = 0;
  for (let i = 0; i < catalog.stickers.length; i += BATCH_SIZE) {
    const chunk = catalog.stickers.slice(i, i + BATCH_SIZE);
    const b = db.batch();
    chunk.forEach((sticker) => {
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
