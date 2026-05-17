import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDocFromCache,
  getDocFromServer,
  increment,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import {
  CollectionItem,
  CollectionStats,
  UserCollection,
} from '../models/album.model';

/**
 * Gestiona el inventario del usuario:
 *   users/{uid}/collections/{albumId}            -> doc con stats
 *   users/{uid}/collections/{albumId}/items/{id} -> un doc por cromo poseído
 *
 * Diseño: un cromo SIN documento = no se tiene. Solo se crea el
 * documento cuando count >= 1. Esto evita 1000+ escrituras al iniciar.
 */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private get uid(): string {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Usuario no autenticado');
    return uid;
  }

  private collectionPath(albumId: string): string {
    return `users/${this.uid}/collections/${albumId}`;
  }

  /** Stream del documento de colección (incluye stats denormalizadas). */
  getCollection(albumId: string): Observable<UserCollection | undefined> {
    const ref = doc(this.firestore, this.collectionPath(albumId));
    return docData(ref) as Observable<UserCollection | undefined>;
  }

  /** Stream de todos los cromos que el usuario posee. */
  getItems(albumId: string): Observable<CollectionItem[]> {
    const ref = collection(
      this.firestore,
      `${this.collectionPath(albumId)}/items`
    );
    return collectionData(ref, { idField: 'stickerId' }) as Observable<
      CollectionItem[]
    >;
  }

  /**
   * Inicializa el documento de colección si no existe.
   * Lee primero del caché local (0 reads en red si ya fue leído antes).
   */
  async ensureCollection(albumId: string, totalSlots: number): Promise<void> {
    const ref = doc(this.firestore, this.collectionPath(albumId));
    let exists = false;
    try {
      const cached = await getDocFromCache(ref);
      exists = cached.exists();
    } catch {
      const server = await getDocFromServer(ref);
      exists = server.exists();
    }
    if (!exists) {
      const stats: CollectionStats = {
        owned: 0,
        missing: totalSlots,
        duplicates: 0,
        total: totalSlots,
      };
      await setDoc(ref, {
        albumId,
        startedAt: serverTimestamp(),
        stats,
      });
    }
  }

  /**
   * Fija la cantidad EXACTA de un cromo.
   * count = 0 -> borra el documento (no lo tiene)
   * count = 1 -> pegado
   * count >= 2 -> tiene (count - 1) repes
   * Actualiza stats denormalizadas en la misma operación atómica.
   *
   * `prevCount` lo pasa el caller desde el listener ya activo: evita una
   * lectura adicional a Firestore por cada mutación.
   */
  async setStickerCount(
    albumId: string,
    stickerId: string,
    newCount: number,
    prevCount: number
  ) {
    const safeNew = Math.max(0, Math.floor(newCount));
    const safePrev = Math.max(0, Math.floor(prevCount));

    if (safePrev === safeNew) return;

    const itemRef = doc(
      this.firestore,
      `${this.collectionPath(albumId)}/items/${stickerId}`
    );
    const colRef = doc(this.firestore, this.collectionPath(albumId));

    const batch = writeBatch(this.firestore);

    if (safeNew === 0) {
      batch.delete(itemRef);
    } else {
      batch.set(itemRef, {
        stickerId,
        count: safeNew,
        updatedAt: serverTimestamp(),
      });
    }

    const ownedDelta = (safeNew > 0 ? 1 : 0) - (safePrev > 0 ? 1 : 0);
    const dupDelta =
      Math.max(0, safeNew - 1) - Math.max(0, safePrev - 1);

    batch.set(
      colRef,
      {
        stats: {
          owned: increment(ownedDelta),
          missing: increment(-ownedDelta),
          duplicates: increment(dupDelta),
        },
      },
      { merge: true }
    );

    await batch.commit();
  }

  /** Marca un cromo como pegado (count = 1). */
  markOwned(albumId: string, stickerId: string, prevCount: number) {
    return this.setStickerCount(albumId, stickerId, 1, prevCount);
  }

  /** Quita un cromo del inventario (count = 0). */
  markMissing(albumId: string, stickerId: string, prevCount: number) {
    return this.setStickerCount(albumId, stickerId, 0, prevCount);
  }

  /** Suma una repe. */
  addDuplicate(albumId: string, stickerId: string, currentCount: number) {
    return this.setStickerCount(
      albumId,
      stickerId,
      currentCount + 1,
      currentCount
    );
  }

  /** Resta una unidad (de repe o hasta dejarlo en falta). */
  removeOne(albumId: string, stickerId: string, currentCount: number) {
    return this.setStickerCount(
      albumId,
      stickerId,
      currentCount - 1,
      currentCount
    );
  }
}
