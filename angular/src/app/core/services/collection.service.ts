import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';
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

  /** Inicializa el documento de colección si no existe. */
  async ensureCollection(albumId: string, totalSlots: number): Promise<void> {
    const ref = doc(this.firestore, this.collectionPath(albumId));
    const snap = await getDoc(ref);
    if (!snap.exists()) {
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
   */
  async setStickerCount(albumId: string, stickerId: string, count: number) {
    const newCount = Math.max(0, Math.floor(count));

    const itemRef = doc(
      this.firestore,
      `${this.collectionPath(albumId)}/items/${stickerId}`
    );
    const colRef = doc(this.firestore, this.collectionPath(albumId));

    // Necesitamos el count anterior para calcular el delta de stats.
    const prevSnap = await getDoc(itemRef);
    const prevCount: number = prevSnap.exists()
      ? (prevSnap.data()['count'] as number)
      : 0;

    if (prevCount === newCount) return; // sin cambios

    const batch = writeBatch(this.firestore);

    if (newCount === 0) {
      batch.delete(itemRef);
    } else {
      batch.set(itemRef, {
        stickerId,
        count: newCount,
        updatedAt: serverTimestamp(),
      });
    }

    // Deltas para las stats
    const ownedDelta =
      (newCount > 0 ? 1 : 0) - (prevCount > 0 ? 1 : 0);
    const dupDelta =
      Math.max(0, newCount - 1) - Math.max(0, prevCount - 1);

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
  markOwned(albumId: string, stickerId: string) {
    return this.setStickerCount(albumId, stickerId, 1);
  }

  /** Quita un cromo del inventario (count = 0). */
  markMissing(albumId: string, stickerId: string) {
    return this.setStickerCount(albumId, stickerId, 0);
  }

  /** Suma una repe. */
  async addDuplicate(albumId: string, stickerId: string) {
    const itemRef = doc(
      this.firestore,
      `${this.collectionPath(albumId)}/items/${stickerId}`
    );
    const snap = await getDoc(itemRef);
    const current = snap.exists() ? (snap.data()['count'] as number) : 0;
    return this.setStickerCount(albumId, stickerId, current + 1);
  }

  /** Resta una unidad (de repe o hasta dejarlo en falta). */
  async removeOne(albumId: string, stickerId: string) {
    const itemRef = doc(
      this.firestore,
      `${this.collectionPath(albumId)}/items/${stickerId}`
    );
    const snap = await getDoc(itemRef);
    const current = snap.exists() ? (snap.data()['count'] as number) : 0;
    return this.setStickerCount(albumId, stickerId, current - 1);
  }
}
