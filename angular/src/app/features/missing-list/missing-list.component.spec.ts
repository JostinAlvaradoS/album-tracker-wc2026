import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { MissingListComponent } from './missing-list.component';
import { AlbumViewService } from '../../core/services/album-view.service';
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
  type: SectionView['type'],
  stickers: StickerView[]
): SectionView {
  return {
    id,
    name,
    type,
    slotCount: stickers.length,
    order: 0,
    stickers,
    ownedCount: stickers.filter((s) => s.count > 0).length,
  };
}

function setup(stream: Observable<SectionView[]>) {
  TestBed.configureTestingModule({
    imports: [MissingListComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getAlbumView: () => stream } },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(MissingListComponent);
  fixture.detectChanges();
  return fixture;
}

describe('MissingListComponent', () => {
  describe('grouped (sin filtro)', () => {
    it('agrupa los faltantes por nombre de sección y ordena por número', () => {
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ code: 'ARG3', sectionId: 'arg', sectionName: 'Argentina', number: 3, status: 'missing' }),
          sticker({ code: 'ARG1', sectionId: 'arg', sectionName: 'Argentina', number: 1, status: 'missing' }),
        ]),
        section('mex', 'México', 'team', [
          sticker({ code: 'MEX5', sectionId: 'mex', sectionName: 'México', number: 5, status: 'missing' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const groups = fixture.componentInstance.grouped();
      expect(groups).toHaveLength(2);
      const arg = groups.find((g) => g.section === 'Argentina')!;
      expect(arg.items.map((i) => i.code)).toEqual(['ARG1', 'ARG3']);
      expect(arg.codes).toBe('ARG1, ARG3');
    });

    it('ignora secciones sin faltantes', () => {
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ status: 'owned', count: 1 }),
        ]),
      ];
      const fixture = setup(of(sections));
      expect(fixture.componentInstance.grouped()).toEqual([]);
    });
  });

  describe('sectionsWithMissing', () => {
    it('solo devuelve secciones que tienen al menos un faltante', () => {
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ status: 'missing', count: 0 }),
        ]),
        section('mex', 'México', 'team', [
          sticker({ status: 'owned', count: 1 }),
        ]),
      ];
      const fixture = setup(of(sections));
      const withMissing = fixture.componentInstance.sectionsWithMissing();
      expect(withMissing).toHaveLength(1);
      expect(withMissing[0].id).toBe('arg');
    });
  });

  describe('filtro de sección', () => {
    it('grouped queda solo con la sección seleccionada', () => {
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ code: 'ARG1', sectionId: 'arg', sectionName: 'Argentina', status: 'missing' }),
        ]),
        section('mex', 'México', 'team', [
          sticker({ code: 'MEX1', sectionId: 'mex', sectionName: 'México', status: 'missing' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.sectionFilter.set('arg');
      const groups = c.grouped();
      expect(groups).toHaveLength(1);
      expect(groups[0].section).toBe('Argentina');
      expect(c.visibleCount()).toBe(1);
    });
  });

  describe('copyList respeta filtro', () => {
    it('sin filtro copia todas las secciones', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ code: 'ARG3', sectionId: 'arg', sectionName: 'Argentina', number: 3, status: 'missing' }),
        ]),
        section('mex', 'México', 'team', [
          sticker({ code: 'MEX1', sectionId: 'mex', sectionName: 'México', number: 1, status: 'missing' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.copyList();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('Argentina: ARG3\nMéxico: MEX1');
      expect(c.copyState()).toBe('copied');
    });

    it('con filtro copia solo la sección activa', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      const sections = [
        section('arg', 'Argentina', 'team', [
          sticker({ code: 'ARG3', sectionId: 'arg', sectionName: 'Argentina', number: 3, status: 'missing' }),
        ]),
        section('mex', 'México', 'team', [
          sticker({ code: 'MEX1', sectionId: 'mex', sectionName: 'México', number: 1, status: 'missing' }),
        ]),
      ];
      const fixture = setup(of(sections));
      const c = fixture.componentInstance;
      c.sectionFilter.set('mex');
      c.copyList();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('México: MEX1');
    });
  });

  describe('trackers', () => {
    it('trackGroup usa el nombre de la sección', () => {
      const fixture = setup(of([]));
      const c = fixture.componentInstance;
      expect(c.trackGroup(0, { section: 'X', items: [], codes: '' })).toBe('X');
    });

    it('trackItem usa el código', () => {
      const fixture = setup(of([]));
      const c = fixture.componentInstance;
      expect(c.trackItem(0, sticker({ code: 'A' }))).toBe('A');
    });
  });
});
