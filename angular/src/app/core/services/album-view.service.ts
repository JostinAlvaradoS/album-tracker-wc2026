import { inject, Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { AlbumCatalogService } from './album-catalog.service';
import { CollectionService } from './collection.service';
import {
  AlbumProgress,
  CollectionItem,
  SectionProgress,
  SectionView,
  StickerStatus,
  StickerView,
} from '../models/album.model';

/**
 * Une el catálogo (estático) con el inventario del usuario (dinámico)
 * y produce una estructura lista para renderizar: secciones con sus
 * cromos, cada uno con su estado (missing | owned | duplicate).
 */
@Injectable({ providedIn: 'root' })
export class AlbumViewService {
  private catalog = inject(AlbumCatalogService);
  private collection = inject(CollectionService);

  private statusOf(count: number): StickerStatus {
    if (count <= 0) return 'missing';
    if (count === 1) return 'owned';
    return 'duplicate';
  }

  /** Secciones del álbum con sus cromos y el estado de cada uno. */
  getAlbumView(albumId: string): Observable<SectionView[]> {
    return combineLatest([
      this.catalog.getSections(albumId),
      this.catalog.getStickers(albumId),
      this.collection.getItems(albumId),
    ]).pipe(
      map(([sections, stickers, items]) => {
        const countById = new Map<string, number>(
          items.map((i: CollectionItem) => [i.stickerId, i.count])
        );

        const stickersBySection = new Map<string, StickerView[]>();
        for (const s of stickers) {
          const count = countById.get(s.code) ?? 0;
          const view: StickerView = {
            ...s,
            count,
            status: this.statusOf(count),
          };
          const arr = stickersBySection.get(s.sectionId) ?? [];
          arr.push(view);
          stickersBySection.set(s.sectionId, arr);
        }

        return sections.map((section): SectionView => {
          const sectionStickers = (
            stickersBySection.get(section.id) ?? []
          ).sort((a, b) => a.number - b.number);
          return {
            ...section,
            stickers: sectionStickers,
            ownedCount: sectionStickers.filter((s) => s.count > 0).length,
          };
        });
      })
    );
  }

  /** Solo los cromos que faltan, planos, para la lista de faltas. */
  getMissing(albumId: string): Observable<StickerView[]> {
    return this.getAlbumView(albumId).pipe(
      map((sections) =>
        sections.flatMap((s) => s.stickers).filter((s) => s.status === 'missing')
      )
    );
  }

  /** Solo los cromos repetidos, para la pantalla de cambios. */
  getDuplicates(albumId: string): Observable<StickerView[]> {
    return this.getAlbumView(albumId).pipe(
      map((sections) =>
        sections
          .flatMap((s) => s.stickers)
          .filter((s) => s.status === 'duplicate')
      )
    );
  }

  /**
   * Estadísticas derivadas: progreso global y desglose por sección.
   * Se calcula a partir de la vista combinada, así siempre está
   * sincronizado con lo que el usuario marca en el álbum.
   */
  getProgress(albumId: string): Observable<AlbumProgress> {
    return this.getAlbumView(albumId).pipe(
      map((sections) => {
        const sectionProgress: SectionProgress[] = sections.map((sec) => {
          const total = sec.stickers.length;
          const owned = sec.ownedCount;
          const duplicates = sec.stickers.reduce(
            (sum, s) => sum + Math.max(0, s.count - 1),
            0
          );
          return {
            id: sec.id,
            name: sec.name,
            type: sec.type,
            owned,
            total,
            duplicates,
            percent: total ? Math.round((owned / total) * 100) : 0,
            complete: total > 0 && owned === total,
          };
        });

        const owned = sectionProgress.reduce((s, p) => s + p.owned, 0);
        const total = sectionProgress.reduce((s, p) => s + p.total, 0);
        const duplicates = sectionProgress.reduce(
          (s, p) => s + p.duplicates,
          0
        );

        return {
          owned,
          missing: total - owned,
          total,
          percent: total ? Math.round((owned / total) * 100) : 0,
          duplicates,
          totalStickersOwned: owned + duplicates,
          sectionsComplete: sectionProgress.filter((p) => p.complete).length,
          sectionsTotal: sectionProgress.length,
          // ordenado de más completo a menos, para la lista
          sections: [...sectionProgress].sort(
            (a, b) => b.percent - a.percent
          ),
        };
      })
    );
  }
}
