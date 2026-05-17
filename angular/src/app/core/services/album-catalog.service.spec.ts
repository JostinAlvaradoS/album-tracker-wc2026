import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import * as firestore from '@angular/fire/firestore';
import { of } from 'rxjs';
import { AlbumCatalogService } from './album-catalog.service';

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    doc: jest.fn(() => ({ __ref: 'doc' })),
    collection: jest.fn(() => ({ __ref: 'collection' })),
    query: jest.fn((ref) => ref),
    orderBy: jest.fn(() => 'orderBy'),
    docData: jest.fn(),
    collectionData: jest.fn(),
  };
});

const docDataMock = firestore.docData as jest.Mock;
const collectionDataMock = firestore.collectionData as jest.Mock;

describe('AlbumCatalogService', () => {
  let service: AlbumCatalogService;

  beforeEach(() => {
    docDataMock.mockReset();
    collectionDataMock.mockReset();

    docDataMock.mockReturnValue(of({ id: 'wc2026', name: 'Mundial 2026' }));
    collectionDataMock.mockReturnValue(of([{ id: 'arg', name: 'Argentina' }]));

    TestBed.configureTestingModule({
      providers: [
        AlbumCatalogService,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(AlbumCatalogService);
  });

  describe('caching', () => {
    it('reutiliza el mismo Observable para el mismo albumId en getAlbum', () => {
      const o1 = service.getAlbum('wc2026');
      const o2 = service.getAlbum('wc2026');
      expect(o1).toBe(o2);
      // docData solo se invocó una vez para construir el stream
      expect(docDataMock).toHaveBeenCalledTimes(1);
    });

    it('genera streams distintos para albumIds distintos', () => {
      const a = service.getAlbum('wc2026');
      const b = service.getAlbum('otro');
      expect(a).not.toBe(b);
      expect(docDataMock).toHaveBeenCalledTimes(2);
    });

    it('cachea getSections y getStickers por separado', () => {
      const s1 = service.getSections('wc2026');
      const s2 = service.getSections('wc2026');
      const st1 = service.getStickers('wc2026');
      const st2 = service.getStickers('wc2026');
      expect(s1).toBe(s2);
      expect(st1).toBe(st2);
      // collectionData se llamó 2 veces (sections + stickers), no 4
      expect(collectionDataMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset', () => {
    it('limpia los 3 caches y fuerza nueva creación', () => {
      const a1 = service.getAlbum('wc2026');
      const s1 = service.getSections('wc2026');
      const st1 = service.getStickers('wc2026');

      service.reset();

      const a2 = service.getAlbum('wc2026');
      const s2 = service.getSections('wc2026');
      const st2 = service.getStickers('wc2026');

      expect(a1).not.toBe(a2);
      expect(s1).not.toBe(s2);
      expect(st1).not.toBe(st2);
    });
  });
});
