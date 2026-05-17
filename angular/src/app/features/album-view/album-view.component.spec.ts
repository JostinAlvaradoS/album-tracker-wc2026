import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AlbumViewComponent } from './album-view.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { AlbumCatalogService } from '../../core/services/album-catalog.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { Album, SectionView, StickerView } from '../../core/models/album.model';

function sticker(over: Partial<StickerView> = {}): StickerView {
  return {
    code: 'X',
    number: 1,
    sectionId: 'sec',
    sectionName: 'Sec',
    kind: 'player',
    label: 'L',
    special: false,
    foil: false,
    order: 0,
    count: 0,
    status: 'missing',
    ...over,
  };
}

function section(id: string, type: SectionView['type'], stickers: StickerView[]): SectionView {
  return {
    id,
    name: id.toUpperCase(),
    type,
    slotCount: stickers.length,
    order: 0,
    stickers,
    ownedCount: stickers.filter((s) => s.count > 0).length,
  };
}

function setup(opts: {
  sections?: Observable<SectionView[]>;
  album?: Observable<Album | undefined>;
  collection?: Partial<CollectionService>;
}) {
  const ensureCollection = jest.fn().mockResolvedValue(undefined);
  const markOwned = jest.fn().mockResolvedValue(undefined);
  const markMissing = jest.fn().mockResolvedValue(undefined);
  const addDuplicate = jest.fn().mockResolvedValue(undefined);
  const removeOne = jest.fn().mockResolvedValue(undefined);

  TestBed.configureTestingModule({
    imports: [AlbumViewComponent],
    providers: [
      {
        provide: AlbumViewService,
        useValue: { getAlbumView: () => opts.sections ?? of([]) },
      },
      {
        provide: AlbumCatalogService,
        useValue: {
          getAlbum: () =>
            opts.album ?? of<Album | undefined>(undefined),
        },
      },
      {
        provide: CollectionService,
        useValue: {
          ensureCollection,
          markOwned,
          markMissing,
          addDuplicate,
          removeOne,
          ...opts.collection,
        },
      },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(AlbumViewComponent);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    ensureCollection,
    markOwned,
    markMissing,
    addDuplicate,
    removeOne,
  };
}

describe('AlbumViewComponent', () => {
  describe('computeds', () => {
    it('cuenta total, owned, missing y dupes correctamente', () => {
      const sections = [
        section('arg', 'team', [
          sticker({ code: 'A1', status: 'owned', count: 1 }),
          sticker({ code: 'A2', status: 'duplicate', count: 3 }),
          sticker({ code: 'A3', status: 'missing', count: 0 }),
        ]),
      ];
      const { component } = setup({ sections: of(sections) });
      expect(component.totalCount()).toBe(3);
      expect(component.ownedCount()).toBe(2); // owned + duplicate
      expect(component.missingCount()).toBe(1);
      expect(component.dupeCount()).toBe(1);
    });

    it('sectionPct devuelve 0 cuando no hay stickers', () => {
      const { component } = setup({ sections: of([]) });
      expect(
        component.sectionPct(section('vacio', 'team', []))
      ).toBe(0);
    });

    it('sectionPct redondea el porcentaje', () => {
      const { component } = setup({ sections: of([]) });
      const s = section('arg', 'team', [
        sticker({ count: 1 }),
        sticker({ count: 1 }),
        sticker({ count: 0 }),
      ]);
      expect(component.sectionPct(s)).toBe(67); // 2/3 = 66.67 → 67
    });
  });

  describe('filtros', () => {
    it('setFilter cambia el filtro y visibleSections refleja', () => {
      const sections = [
        section('arg', 'team', [
          sticker({ code: 'A1', status: 'owned', count: 1 }),
          sticker({ code: 'A2', status: 'missing', count: 0 }),
        ]),
      ];
      const { component } = setup({ sections: of(sections) });
      component.setFilter('owned');
      const visible = component.visibleSections();
      expect(visible[0].stickers).toHaveLength(1);
      expect(visible[0].stickers[0].code).toBe('A1');
    });

    it('sectionFilter signal escribe directo el id seleccionado', () => {
      const { component } = setup({});
      component.sectionFilter.set('arg');
      expect(component.sectionFilter()).toBe('arg');
      component.sectionFilter.set('');
      expect(component.sectionFilter()).toBe('');
    });

    it('filtro missing oculta secciones que quedaron vacías', () => {
      const sections = [
        section('arg', 'team', [sticker({ status: 'owned', count: 1 })]),
        section('mex', 'team', [sticker({ status: 'missing', count: 0 })]),
      ];
      const { component } = setup({ sections: of(sections) });
      component.setFilter('missing');
      expect(component.visibleSections()).toHaveLength(1);
      expect(component.visibleSections()[0].id).toBe('mex');
    });
  });

  describe('acciones', () => {
    it('cycle desde missing llama a markOwned', async () => {
      const { component, markOwned } = setup({});
      await component.cycle(sticker({ code: 'A1', count: 0 }));
      expect(markOwned).toHaveBeenCalledWith('wc2026', 'A1', 0);
    });

    it('cycle desde owned llama a markMissing', async () => {
      const { component, markMissing } = setup({});
      await component.cycle(sticker({ code: 'A1', count: 1, status: 'owned' }));
      expect(markMissing).toHaveBeenCalledWith('wc2026', 'A1', 1);
    });

    it('inc desde missing llama a markOwned', async () => {
      const { component, markOwned } = setup({});
      await component.inc(sticker({ code: 'A1', count: 0 }));
      expect(markOwned).toHaveBeenCalledWith('wc2026', 'A1', 0);
    });

    it('inc desde owned llama a addDuplicate', async () => {
      const { component, addDuplicate } = setup({});
      await component.inc(sticker({ code: 'A1', count: 1, status: 'owned' }));
      expect(addDuplicate).toHaveBeenCalledWith('wc2026', 'A1', 1);
    });

    it('dec llama a removeOne', async () => {
      const { component, removeOne } = setup({});
      await component.dec(sticker({ code: 'A1', count: 2 }));
      expect(removeOne).toHaveBeenCalledWith('wc2026', 'A1', 2);
    });

    it('mientras busy=true, otra acción no dispara nada', async () => {
      const { component, markOwned } = setup({});
      component.busy.set(true);
      await component.cycle(sticker({ count: 0 }));
      expect(markOwned).not.toHaveBeenCalled();
    });
  });

  describe('ensureCollection effect', () => {
    it('se llama una sola vez cuando el álbum emite', async () => {
      const album: Album = {
        id: 'wc2026',
        name: 'wc',
        edition: '2026',
        publisher: 'x',
        totalSlots: 994,
        teamCount: 48,
      };
      const { ensureCollection } = setup({ album: of(album) });
      // ensureCollection es asíncrono dentro del effect
      await Promise.resolve();
      expect(ensureCollection).toHaveBeenCalledWith('wc2026', 994);
    });

    it('si el álbum aún no emite, no se invoca ensureCollection', () => {
      const { ensureCollection } = setup({});
      expect(ensureCollection).not.toHaveBeenCalled();
    });
  });

  describe('utilidades', () => {
    it('formatIndex padea a 2 dígitos', () => {
      const { component } = setup({});
      expect(component.formatIndex(3)).toBe('03');
      expect(component.formatIndex(42)).toBe('42');
    });

    it('trackers usan id/code como identidad', () => {
      const { component } = setup({});
      const s = section('arg', 'team', []);
      expect(component.trackSection(0, s)).toBe('arg');
      const st = sticker({ code: 'FOO' });
      expect(component.trackSticker(0, st)).toBe('FOO');
    });
  });
});
