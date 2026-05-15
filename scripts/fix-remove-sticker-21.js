/**
 * Migración one-shot: elimina el slot #21 de los equipos del álbum wc2026.
 *
 * Estado inicial (prod): slotsPerTeam = 21 → 1042 stickers totales.
 * Estado final:         slotsPerTeam = 20 → 994 stickers totales.
 *
 * Asunción: ningún usuario tiene marcado un sticker {TEAM}21 porque
 * físicamente no existe la figurita. Por eso NO se tocan los items/
 * de los usuarios — solo se ajustan las stats denormalizadas (total
 * y missing) para que queden consistentes con el catálogo nuevo.
 *
 * Pasos:
 *   1) Borra los 48 stickers number=21 y special=false del catálogo
 *   2) Actualiza slotCount: 21 → 20 en cada section type=team
 *   3) Actualiza totalSlots: 1042 → 994 en el doc del álbum
 *   4) Por cada usuario con colección en este álbum, recalcula
 *      stats.total y stats.missing a partir del owned actual
 *
 * Uso:
 *   node fix-remove-sticker-21.js              # DRY RUN — solo reporta
 *   node fix-remove-sticker-21.js --apply      # ejecuta cambios reales
 */

const admin = require('firebase-admin');
const serviceAccount = require('../sa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const ALBUM_ID = 'wc2026';
const NEW_TOTAL_SLOTS = 994;
const NEW_SLOT_COUNT_PER_TEAM = 20;
const APPLY = process.argv.includes('--apply');

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function run() {
  console.log(
    APPLY
      ? '== MODO APPLY (los cambios se aplicarán) =='
      : '== MODO DRY-RUN (no se modifica nada, usá --apply para ejecutar) =='
  );
  console.log('');

  // ── 1) Stickers a borrar ───────────────────────────────────────────
  const stickerSnap = await db
    .collection(`albums/${ALBUM_ID}/stickers`)
    .where('number', '==', 21)
    .get();

  const toDelete = stickerSnap.docs.filter((d) => d.data().special !== true);
  const codes = toDelete.map((d) => d.id).sort();

  console.log(`[1] Stickers a eliminar del catálogo: ${codes.length}`);
  console.log('    ', codes.join(', '));
  console.log('');

  if (codes.length === 0) {
    console.log('Nada que migrar — no hay stickers number=21 en el catálogo.');
    return;
  }

  // ── 2) Secciones de equipos a actualizar ───────────────────────────
  const sectionsSnap = await db
    .collection(`albums/${ALBUM_ID}/sections`)
    .where('type', '==', 'team')
    .get();

  console.log(
    `[2] Secciones (equipos) que pasarán a slotCount=${NEW_SLOT_COUNT_PER_TEAM}: ${sectionsSnap.size}`
  );
  console.log('');

  // ── 3) Doc del álbum ───────────────────────────────────────────────
  const albumSnap = await db.doc(`albums/${ALBUM_ID}`).get();
  const oldTotalSlots = albumSnap.exists ? albumSnap.data().totalSlots : 'N/A';
  console.log(
    `[3] albums/${ALBUM_ID}.totalSlots: ${oldTotalSlots} → ${NEW_TOTAL_SLOTS}`
  );
  console.log('');

  // ── 4) Usuarios con colección en este álbum ────────────────────────
  // Nota: users/{uid} son docs "virtuales" (sólo existen como padre
  // de subcolecciones). Por eso usamos collectionGroup para encontrar
  // todas las "collections" y filtramos por id del álbum.
  const collsSnap = await db.collectionGroup('collections').get();
  const userOps = [];

  for (const collDoc of collsSnap.docs) {
    if (collDoc.id !== ALBUM_ID) continue;

    // El path es users/{uid}/collections/{albumId}
    const uid = collDoc.ref.parent.parent?.id ?? '(unknown)';
    const stats = collDoc.data().stats || {};
    const owned = Number(stats.owned ?? 0);
    const oldTotal = stats.total ?? null;
    const oldMissing = stats.missing ?? null;
    const newMissing = Math.max(0, NEW_TOTAL_SLOTS - owned);

    userOps.push({ uid, ref: collDoc.ref, oldTotal, oldMissing, owned, newMissing });
  }

  console.log(
    `[4] Docs collection escaneados: ${collsSnap.size} | con álbum ${ALBUM_ID}: ${userOps.length}`
  );
  userOps.forEach((u) => {
    console.log(
      `      ${u.uid}: total ${u.oldTotal} → ${NEW_TOTAL_SLOTS} | missing ${u.oldMissing} → ${u.newMissing} (owned=${u.owned})`
    );
  });
  console.log('');

  if (!APPLY) {
    console.log('[DRY-RUN] Revisá el plan arriba. Para aplicar:');
    console.log('  node fix-remove-sticker-21.js --apply');
    return;
  }

  // ─── APLICAR ───────────────────────────────────────────────────────
  console.log('Aplicando cambios...');

  // (1) borrar stickers en lotes de 500
  for (const group of chunk(codes, 500)) {
    const batch = db.batch();
    group.forEach((c) =>
      batch.delete(db.doc(`albums/${ALBUM_ID}/stickers/${c}`))
    );
    await batch.commit();
  }
  console.log(`  ✓ ${codes.length} stickers eliminados`);

  // (2) actualizar sections
  for (const group of chunk(sectionsSnap.docs, 500)) {
    const batch = db.batch();
    group.forEach((d) =>
      batch.update(d.ref, { slotCount: NEW_SLOT_COUNT_PER_TEAM })
    );
    await batch.commit();
  }
  console.log(`  ✓ ${sectionsSnap.size} sections actualizadas`);

  // (3) actualizar doc del álbum
  await db.doc(`albums/${ALBUM_ID}`).set(
    {
      totalSlots: NEW_TOTAL_SLOTS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`  ✓ Album doc actualizado (totalSlots=${NEW_TOTAL_SLOTS})`);

  // (4) actualizar stats de usuarios
  for (const group of chunk(userOps, 500)) {
    const batch = db.batch();
    group.forEach((u) => {
      batch.set(
        u.ref,
        { stats: { total: NEW_TOTAL_SLOTS, missing: u.newMissing } },
        { merge: true }
      );
    });
    await batch.commit();
  }
  console.log(`  ✓ ${userOps.length} usuarios actualizados`);

  console.log('\nMigración completa.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error en la migración:', err);
    process.exit(1);
  });
