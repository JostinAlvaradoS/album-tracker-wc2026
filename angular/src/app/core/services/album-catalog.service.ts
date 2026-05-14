import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
} from '@angular/fire/firestore';
import { Observable, shareReplay } from 'rxjs';
import { Album, Section, Sticker } from '../models/album.model';

/**
 * Lee el catálogo del álbum desde albums/{albumId}.
 * El catálogo es estático, así que cacheamos con shareReplay
 * para no re-leerlo en cada navegación.
 */
@Injectable({ providedIn: 'root' })
export class AlbumCatalogService {
  private firestore = inject(Firestore);

  private albumCache = new Map<string, Observable<Album | undefined>>();
  private sectionsCache = new Map<string, Observable<Section[]>>();
  private stickersCache = new Map<string, Observable<Sticker[]>>();

  getAlbum(albumId: string): Observable<Album | undefined> {
    if (!this.albumCache.has(albumId)) {
      const ref = doc(this.firestore, `albums/${albumId}`);
      this.albumCache.set(
        albumId,
        (docData(ref) as Observable<Album | undefined>).pipe(
          shareReplay({ bufferSize: 1, refCount: false })
        )
      );
    }
    return this.albumCache.get(albumId)!;
  }

  getSections(albumId: string): Observable<Section[]> {
    if (!this.sectionsCache.has(albumId)) {
      const ref = collection(this.firestore, `albums/${albumId}/sections`);
      const q = query(ref, orderBy('order'));
      this.sectionsCache.set(
        albumId,
        (collectionData(q) as Observable<Section[]>).pipe(
          shareReplay({ bufferSize: 1, refCount: false })
        )
      );
    }
    return this.sectionsCache.get(albumId)!;
  }

  getStickers(albumId: string): Observable<Sticker[]> {
    if (!this.stickersCache.has(albumId)) {
      const ref = collection(this.firestore, `albums/${albumId}/stickers`);
      const q = query(ref, orderBy('order'));
      this.stickersCache.set(
        albumId,
        (collectionData(q) as Observable<Sticker[]>).pipe(
          shareReplay({ bufferSize: 1, refCount: false })
        )
      );
    }
    return this.stickersCache.get(albumId)!;
  }
}
