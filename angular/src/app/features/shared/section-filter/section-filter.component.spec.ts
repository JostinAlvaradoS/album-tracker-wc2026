import { TestBed } from '@angular/core/testing';
import { SectionFilterComponent } from './section-filter.component';
import { SectionView, StickerView } from '../../../core/models/album.model';

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
  type: SectionView['type'],
  stickers: StickerView[],
  code?: string
): SectionView {
  return {
    id,
    name: id.toUpperCase(),
    type,
    code,
    slotCount: stickers.length,
    order: 0,
    stickers,
    ownedCount: stickers.filter((s) => s.count > 0).length,
  };
}

function build() {
  TestBed.configureTestingModule({ imports: [SectionFilterComponent] });
  const fixture = TestBed.createComponent(SectionFilterComponent);
  return fixture;
}

describe('SectionFilterComponent', () => {
  describe('separación team vs special', () => {
    it('teamSections solo devuelve secciones type === team', () => {
      const fixture = build();
      fixture.componentInstance.sections = [
        section('arg', 'team', []),
        section('intro', 'intro', []),
        section('cc', 'special', []),
      ];
      expect(fixture.componentInstance.teamSections).toHaveLength(1);
      expect(fixture.componentInstance.specialSections).toHaveLength(2);
    });
  });

  describe('modo progress', () => {
    it('countFor devuelve ownedCount y pctFor el porcentaje', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'progress';
      const s = section('arg', 'team', [
        sticker({ status: 'owned', count: 1 }),
        sticker({ status: 'owned', count: 1 }),
        sticker({ status: 'missing', count: 0 }),
      ]);
      expect(c.countFor(s)).toBe(2);
      expect(c.pctFor(s)).toBe(67);
    });

    it('isComplete=true cuando todos están pegados', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'progress';
      const full = section('arg', 'team', [
        sticker({ status: 'owned', count: 1 }),
        sticker({ status: 'owned', count: 1 }),
      ]);
      expect(c.isComplete(full)).toBe(true);
    });

    it('isComplete=false cuando hay alguno faltante', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'progress';
      const partial = section('arg', 'team', [
        sticker({ status: 'missing', count: 0 }),
      ]);
      expect(c.isComplete(partial)).toBe(false);
    });

    it('chipsHeaderLabel = "Secciones"', () => {
      const fixture = build();
      expect(fixture.componentInstance.chipsHeaderLabel).toBe('Secciones');
    });
  });

  describe('modo missing-count', () => {
    it('countFor cuenta los faltantes y pctFor devuelve 0', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'missing-count';
      const s = section('arg', 'team', [
        sticker({ status: 'missing' }),
        sticker({ status: 'missing' }),
        sticker({ status: 'owned', count: 1 }),
      ]);
      expect(c.countFor(s)).toBe(2);
      expect(c.pctFor(s)).toBe(0);
      expect(c.isComplete(s)).toBe(false);
    });

    it('chipsHeaderLabel describe faltantes', () => {
      const fixture = build();
      fixture.componentInstance.mode = 'missing-count';
      expect(fixture.componentInstance.chipsHeaderLabel).toBe('Secciones con faltantes');
    });
  });

  describe('modo dupe-count', () => {
    it('countFor cuenta los duplicados', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'dupe-count';
      const s = section('arg', 'team', [
        sticker({ status: 'duplicate', count: 2 }),
        sticker({ status: 'owned', count: 1 }),
      ]);
      expect(c.countFor(s)).toBe(1);
    });

    it('chipsHeaderLabel describe repes', () => {
      const fixture = build();
      fixture.componentInstance.mode = 'dupe-count';
      expect(fixture.componentInstance.chipsHeaderLabel).toBe('Secciones con repes');
    });
  });

  describe('chipsSections y chipLabel', () => {
    it('chipsSections ordena especiales primero, luego equipos', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.sections = [
        section('arg', 'team', [], 'ARG'),
        section('fwc_intro', 'intro', []),
        section('mex', 'team', [], 'MEX'),
        section('cocacola', 'special', [], 'CC'),
      ];
      const ids = c.chipsSections.map((s) => s.id);
      expect(ids).toEqual(['fwc_intro', 'cocacola', 'arg', 'mex']);
    });

    it('chipLabel usa code cuando existe', () => {
      const fixture = build();
      const s = section('arg', 'team', [], 'ARG');
      expect(fixture.componentInstance.chipLabel(s)).toBe('ARG');
    });

    it('chipLabel cae al nombre cuando no hay code', () => {
      const fixture = build();
      const s = section('intro', 'intro', []);
      expect(fixture.componentInstance.chipLabel(s)).toBe('INT');
    });

    it('chipLabel ignora caracteres no alfanuméricos del nombre', () => {
      const fixture = build();
      const s: SectionView = {
        id: 'cc',
        name: 'Coca-Cola',
        type: 'special',
        slotCount: 0,
        order: 0,
        stickers: [],
        ownedCount: 0,
      };
      expect(fixture.componentInstance.chipLabel(s)).toBe('COC');
    });
  });

  describe('optionLabel', () => {
    it('en modo progress incluye ratio owned/total', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'progress';
      const s = section('arg', 'team', [
        sticker({ count: 1 }), sticker({ count: 0 }),
      ], 'ARG');
      expect(c.optionLabel(s)).toBe('ARG · ARG · 1/2');
    });

    it('en modo count incluye solo el count', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'missing-count';
      const s = section('arg', 'team', [
        sticker({ status: 'missing' }),
      ], 'ARG');
      expect(c.optionLabel(s)).toBe('ARG · ARG · 1');
    });

    it('si la sección no tiene code, lo omite del label', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      c.mode = 'progress';
      const s = section('intro', 'intro', [sticker({ count: 1 })]);
      expect(c.optionLabel(s)).toBe('INTRO · 1/1');
    });
  });

  describe('eventos', () => {
    it('toggle emite el id la primera vez y vacío al repetir', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      const spy = jest.fn();
      c.selectedChange.subscribe(spy);

      c.selected = '';
      c.toggle('arg');
      expect(spy).toHaveBeenLastCalledWith('arg');

      c.selected = 'arg';
      c.toggle('arg');
      expect(spy).toHaveBeenLastCalledWith('');
    });

    it('clear emite cadena vacía', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      const spy = jest.fn();
      c.selectedChange.subscribe(spy);
      c.clear();
      expect(spy).toHaveBeenCalledWith('');
    });

    it('onSelect lee el value del select y lo emite', () => {
      const fixture = build();
      const c = fixture.componentInstance;
      const spy = jest.fn();
      c.selectedChange.subscribe(spy);
      const target = document.createElement('select');
      const opt = document.createElement('option');
      opt.value = 'mex';
      opt.selected = true;
      target.appendChild(opt);
      c.onSelect({ target } as unknown as Event);
      expect(spy).toHaveBeenCalledWith('mex');
    });
  });

  describe('trackSection', () => {
    it('usa id como identidad', () => {
      const fixture = build();
      expect(
        fixture.componentInstance.trackSection(0, section('arg', 'team', []))
      ).toBe('arg');
    });
  });
});
