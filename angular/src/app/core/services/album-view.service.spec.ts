import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AlbumViewService } from './album-view.service';
import { AlbumCatalogService } from './album-catalog.service';
import { CollectionService } from './collection.service';
import { Section, Sticker, CollectionItem } from '../models/album.model';

function section(id: string, name: string, type: Section['type'] = 'team'): Section {
  return { id, name, type, slotCount: 0, order: 0 };
}
function sticker(over: Partial<Sticker> = {}): Sticker {
  return {
    code: 'X1',
    number: 1,
    sectionId: 'sec',
    sectionName: 'Sec',
    kind: 'player',
    label: 'Jugador',
    special: false,
    foil: false,
    order: 0,
    ...over,
  };
}
function item(stickerId: string, count: number): CollectionItem {
  return { stickerId, count };
}

describe('AlbumViewService', () => {
  let service: AlbumViewService;
  let catalogMock: Partial<AlbumCatalogService>;
  let collectionMock: Partial<CollectionService>;

  beforeEach(() => {
    catalogMock = {
      getAlbum: jest.fn(),
      getSections: jest.fn().mockReturnValue(of([section('arg', 'Argentina')])),
      getStickers: jest.fn().mockReturnValue(
        of([
          sticker({ code: 'ARG1', number: 1, sectionId: 'arg' }),
          sticker({ code: 'ARG2', number: 2, sectionId: 'arg' }),
          sticker({ code: 'ARG3', number: 3, sectionId: 'arg' }),
        ])
      ),
    };
    collectionMock = {
      getItems: jest.fn().mockReturnValue(
        of<CollectionItem[]>([
          item('ARG1', 1), // pegado
          item('ARG2', 3), // pegado + 2 repes
        ])
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        AlbumViewService,
        { provide: AlbumCatalogService, useValue: catalogMock },
        { provide: CollectionService, useValue: collectionMock },
      ],
    });

    service = TestBed.inject(AlbumViewService);
  });

  describe('getAlbumView', () => {
    it('marca cromo sin item como missing', async () => {
      const sections = await firstValueFrom(service.getAlbumView('wc2026'));
      const arg3 = sections[0].stickers.find((s) => s.code === 'ARG3')!;
      expect(arg3.count).toBe(0);
      expect(arg3.status).toBe('missing');
    });

    it('marca cromo con count=1 como owned', async () => {
      const sections = await firstValueFrom(service.getAlbumView('wc2026'));
      const arg1 = sections[0].stickers.find((s) => s.code === 'ARG1')!;
      expect(arg1.count).toBe(1);
      expect(arg1.status).toBe('owned');
    });

    it('marca cromo con count>=2 como duplicate', async () => {
      const sections = await firstValueFrom(service.getAlbumView('wc2026'));
      const arg2 = sections[0].stickers.find((s) => s.code === 'ARG2')!;
      expect(arg2.count).toBe(3);
      expect(arg2.status).toBe('duplicate');
    });

    it('ownedCount cuenta pegados + duplicados', async () => {
      const sections = await firstValueFrom(service.getAlbumView('wc2026'));
      expect(sections[0].ownedCount).toBe(2);
    });
  });

  describe('getMissing', () => {
    it('devuelve solo los cromos faltantes', async () => {
      const missing = await firstValueFrom(service.getMissing('wc2026'));
      expect(missing).toHaveLength(1);
      expect(missing[0].code).toBe('ARG3');
    });
  });

  describe('getDuplicates', () => {
    it('devuelve solo los cromos con repes', async () => {
      const dups = await firstValueFrom(service.getDuplicates('wc2026'));
      expect(dups).toHaveLength(1);
      expect(dups[0].code).toBe('ARG2');
      expect(dups[0].count).toBe(3);
    });
  });

  describe('getProgress', () => {
    it('agrega owned, missing y duplicates correctamente', async () => {
      const progress = await firstValueFrom(service.getProgress('wc2026'));
      expect(progress.owned).toBe(2);
      expect(progress.missing).toBe(1);
      expect(progress.total).toBe(3);
      expect(progress.duplicates).toBe(2); // ARG2: count 3 → 2 repes
    });

    it('calcula percent redondeado', async () => {
      const progress = await firstValueFrom(service.getProgress('wc2026'));
      expect(progress.percent).toBe(67); // 2/3 = 66.67 → 67
    });

    it('totalStickersOwned suma pegados + repes (físicos en mano)', async () => {
      const progress = await firstValueFrom(service.getProgress('wc2026'));
      // 2 distintos pegados + 2 repes de ARG2 = 4 cromos físicos
      expect(progress.totalStickersOwned).toBe(4);
    });
  });
});
