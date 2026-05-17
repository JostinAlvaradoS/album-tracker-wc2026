import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DuplicatesComponent } from './duplicates.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { SectionView, StickerView } from '../../core/models/album.model';

function sticker(over: Partial<StickerView> = {}): StickerView {
  return {
    code: 'X',
    number: 1,
    sectionId: 'sec',
    sectionName: 'Sec',
    kind: 'player',
    label: 'X',
    special: false,
    foil: false,
    order: 0,
    count: 0,
    status: 'missing',
    ...over,
  };
}

function section(
  id: string,
  name: string,
  stickers: StickerView[]
): SectionView {
  return {
    id,
    name,
    type: 'team',
    slotCount: stickers.length,
    order: 0,
    stickers,
    ownedCount: stickers.filter((s) => s.count > 0).length,
  };
}

function dupSticker(code: string, count: number, over: Partial<StickerView> = {}): StickerView {
  return sticker({
    code,
    count,
    status: 'duplicate',
    sectionId: 'sec',
    sectionName: 'Sec',
    ...over,
  });
}

function setup(
  stream: Observable<SectionView[]>,
  collectionMock?: Partial<CollectionService>
) {
  TestBed.configureTestingModule({
    imports: [DuplicatesComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getAlbumView: () => stream } },
      {
        provide: CollectionService,
        useValue: {
          addDuplicate: jest.fn().mockResolvedValue(undefined),
          removeOne: jest.fn().mockResolvedValue(undefined),
          ...collectionMock,
        },
      },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(DuplicatesComponent);
  fixture.detectChanges();
  return fixture;
}

describe('DuplicatesComponent', () => {
  describe('totalDups y visibleDuplicates', () => {
    it('totalDups suma (count - 1) sobre todos los cromos duplicados', () => {
      const sections = [
        section('sec', 'Sec', [
          dupSticker('A', 2),
          dupSticker('B', 4),
          dupSticker('C', 3),
        ]),
      ];
      const fixture = setup(of(sections));
      // (2-1) + (4-1) + (3-1) = 6
      expect(fixture.componentInstance.totalDups()).toBe(6);
      expect(fixture.componentInstance.visibleDuplicates()).toHaveLength(3);
    });

    it('es 0 cuando no hay duplicados', () => {
      const fixture = setup(of([]));
      expect(fixture.componentInstance.totalDups()).toBe(0);
      expect(fixture.componentInstance.visibleDuplicates()).toHaveLength(0);
    });
  });

  describe('sectionsWithDupes', () => {
    it('solo devuelve secciones que tienen al menos un cromo con repes', () => {
      const sections = [
        section('arg', 'Argentina', [
          dupSticker('ARG1', 2, { sectionId: 'arg', sectionName: 'Argentina' }),
        ]),
        section('mex', 'México', [
          sticker({ status: 'owned', count: 1, sectionId: 'mex', sectionName: 'México' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const withDupes = fixture.componentInstance.sectionsWithDupes();
      expect(withDupes).toHaveLength(1);
      expect(withDupes[0].id).toBe('arg');
    });
  });

  describe('filtro de sección', () => {
    it('visibleDuplicates queda solo con la sección activa', () => {
      const sections = [
        section('arg', 'Argentina', [
          dupSticker('ARG1', 2, { sectionId: 'arg', sectionName: 'Argentina' }),
        ]),
        section('mex', 'México', [
          dupSticker('MEX1', 3, { sectionId: 'mex', sectionName: 'México' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.sectionFilter.set('mex');
      expect(c.visibleDuplicates()).toHaveLength(1);
      expect(c.visibleDuplicates()[0].code).toBe('MEX1');
      expect(c.visibleDupsTotal()).toBe(2); // count 3 → 2 repes
    });
  });

  describe('inc / dec con busy', () => {
    it('inc llama a addDuplicate y libera busy al finalizar', async () => {
      const addDup = jest.fn().mockResolvedValue(undefined);
      const fixture = setup(of([section('sec', 'Sec', [dupSticker('A', 2)])]), {
        addDuplicate: addDup,
      });
      const c = fixture.componentInstance;
      await c.inc(dupSticker('A', 2));
      expect(addDup).toHaveBeenCalledWith('wc2026', 'A', 2);
      expect(c.busy()).toBe(false);
    });

    it('inc bajo busy = true no dispara otra llamada', async () => {
      const addDup = jest.fn().mockResolvedValue(undefined);
      const fixture = setup(of([section('sec', 'Sec', [dupSticker('A', 2)])]), {
        addDuplicate: addDup,
      });
      const c = fixture.componentInstance;
      c.busy.set(true);
      await c.inc(dupSticker('A', 2));
      expect(addDup).not.toHaveBeenCalled();
    });

    it('dec captura errores y libera busy', async () => {
      const removeOne = jest.fn().mockRejectedValue(new Error('boom'));
      const fixture = setup(of([section('sec', 'Sec', [dupSticker('A', 2)])]), { removeOne });
      const c = fixture.componentInstance;
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      await c.dec(dupSticker('A', 2));
      expect(removeOne).toHaveBeenCalled();
      expect(c.busy()).toBe(false);
    });
  });

  describe('copyList respeta filtro', () => {
    function setupClipboard() {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      return writeText;
    }

    it('sin filtro copia todos los duplicados', async () => {
      const writeText = setupClipboard();
      const sections = [
        section('sec', 'Sec', [dupSticker('A', 3), dupSticker('B', 2)]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.copyList();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('A ×2, B ×1');
      expect(c.copyState()).toBe('copied');
    });

    it('con filtro copia solo lo de la sección activa', async () => {
      const writeText = setupClipboard();
      const sections = [
        section('arg', 'Argentina', [
          dupSticker('ARG1', 3, { sectionId: 'arg', sectionName: 'Argentina' }),
        ]),
        section('mex', 'México', [
          dupSticker('MEX1', 2, { sectionId: 'mex', sectionName: 'México' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.sectionFilter.set('arg');
      c.copyList();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('ARG1 ×2');
    });
  });

  describe('copyButtonLabel', () => {
    it('sin filtro y estado idle dice "Copiar lista completa"', () => {
      const fixture = setup(of([]));
      expect(fixture.componentInstance.copyButtonLabel()).toBe('Copiar lista completa');
    });

    it('con filtro activo dice "Copiar sección"', () => {
      const fixture = setup(of([]));
      fixture.componentInstance.sectionFilter.set('arg');
      expect(fixture.componentInstance.copyButtonLabel()).toBe('Copiar sección');
    });

    it('después de copiar dice "Copiado ✓"', () => {
      const fixture = setup(of([]));
      const c = fixture.componentInstance;
      c.copyState.set('copied');
      expect(c.copyButtonLabel()).toBe('Copiado ✓');
    });
  });

  describe('track', () => {
    it('usa code como identidad', () => {
      const fixture = setup(of([]));
      expect(fixture.componentInstance.track(0, dupSticker('FOO', 2))).toBe('FOO');
    });
  });
});
