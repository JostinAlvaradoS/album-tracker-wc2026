import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ComparatorComponent } from './comparator.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { SectionView, StickerView } from '../../core/models/album.model';

function stickerView(over: Partial<StickerView> = {}): StickerView {
  return {
    code: 'ARG13',
    number: 13,
    sectionId: 'arg',
    sectionName: 'Argentina',
    kind: 'player',
    label: 'Jugador 12',
    special: false,
    foil: false,
    order: 12,
    count: 0,
    status: 'missing',
    ...over,
  };
}

function sectionView(stickers: StickerView[]): SectionView {
  return {
    id: 'arg',
    name: 'Argentina',
    type: 'team',
    slotCount: stickers.length,
    order: 0,
    stickers,
    ownedCount: stickers.filter((s) => s.count > 0).length,
  };
}

function setup(stream: Observable<SectionView[]>) {
  TestBed.configureTestingModule({
    imports: [ComparatorComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getAlbumView: () => stream } },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(ComparatorComponent);
  fixture.detectChanges();
  return fixture;
}

describe('ComparatorComponent', () => {
  function mockSections(): SectionView[] {
    return [
      sectionView([
        stickerView({ code: 'ARG1', count: 0, status: 'missing' }),
        stickerView({ code: 'ARG13', count: 1, status: 'owned' }),
        stickerView({ code: 'MEX5', count: 3, status: 'duplicate' }),
      ]),
    ];
  }

  describe('estado inicial', () => {
    it('arranca con state idle y sin recents', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      expect(c.state()).toBe('idle');
      expect(c.recents()).toEqual([]);
    });
  });

  describe('sanitización del input (onInput)', () => {
    it('uppercase + descarta símbolos y espacios', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      const input = document.createElement('input');
      input.value = 'arg 13!';
      c.onInput({ target: input } as unknown as Event);
      expect(c.rawInput()).toBe('ARG13');
      expect(input.value).toBe('ARG13');
    });

    it('limita a 6 caracteres', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      const input = document.createElement('input');
      input.value = 'ABCDEFGH';
      c.onInput({ target: input } as unknown as Event);
      expect(c.rawInput()).toBe('ABCDEF');
    });
  });

  describe('estados según el match', () => {
    it('owned cuando count = 1', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG13');
      expect(c.state()).toBe('owned');
      expect(c.matchCount()).toBe(1);
      expect(c.dupesForTrade()).toBe(0);
    });

    it('duplicate cuando count >= 2', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('MEX5');
      expect(c.state()).toBe('duplicate');
      expect(c.matchCount()).toBe(3);
      expect(c.dupesForTrade()).toBe(2);
    });

    it('missing cuando count = 0 pero el código existe', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG1');
      expect(c.state()).toBe('missing');
    });

    it('invalid cuando el código no existe en el catálogo', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('XYZ99');
      expect(c.state()).toBe('invalid');
      expect(c.match()).toBeNull();
    });
  });

  describe('recents', () => {
    it('onSubmit con código vacío no hace nada', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      const ev = new Event('submit');
      c.onSubmit(ev);
      expect(c.recents()).toHaveLength(0);
    });

    it('onSubmit guarda la búsqueda en recents y limpia el input', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG13');
      c.onSubmit(new Event('submit'));
      expect(c.recents()).toHaveLength(1);
      expect(c.recents()[0]).toMatchObject({
        code: 'ARG13',
        state: 'owned',
        count: 1,
        sectionName: 'Argentina',
      });
      expect(c.rawInput()).toBe('');
    });

    it('dedup: si pongo el mismo código dos veces queda al inicio sin duplicar', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG13');
      c.onSubmit(new Event('submit'));
      c.rawInput.set('MEX5');
      c.onSubmit(new Event('submit'));
      c.rawInput.set('ARG13'); // ya estaba
      c.onSubmit(new Event('submit'));
      expect(c.recents()).toHaveLength(2);
      expect(c.recents()[0].code).toBe('ARG13');
      expect(c.recents()[1].code).toBe('MEX5');
    });

    it('limita la lista a 8 entradas', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      for (let i = 0; i < 12; i++) {
        c.rawInput.set('FAKE' + i);
        c.onSubmit(new Event('submit'));
      }
      expect(c.recents()).toHaveLength(8);
    });

    it('clearRecents vacía la lista', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG13');
      c.onSubmit(new Event('submit'));
      c.clearRecents();
      expect(c.recents()).toEqual([]);
    });
  });

  describe('clearInput', () => {
    it('limpia rawInput y vuelve a foco', () => {
      const fixture = setup(of(mockSections()));
      const c = fixture.componentInstance;
      c.rawInput.set('ARG13');
      c.clearInput();
      expect(c.rawInput()).toBe('');
    });
  });
});
