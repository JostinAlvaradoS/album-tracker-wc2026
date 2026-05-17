import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DuplicatesComponent } from './duplicates.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { StickerView } from '../../core/models/album.model';

function dupSticker(code: string, count: number): StickerView {
  return {
    code,
    number: 1,
    sectionId: 'sec',
    sectionName: 'Sec',
    kind: 'player',
    label: 'X',
    special: false,
    foil: false,
    order: 0,
    count,
    status: 'duplicate',
  };
}

function setup(stream: Observable<StickerView[]>, collectionMock?: Partial<CollectionService>) {
  TestBed.configureTestingModule({
    imports: [DuplicatesComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getDuplicates: () => stream } },
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
  describe('totalDups', () => {
    it('suma (count - 1) sobre todos los cromos duplicados', () => {
      const list = [dupSticker('A', 2), dupSticker('B', 4), dupSticker('C', 3)];
      const fixture = setup(of(list));
      // (2-1) + (4-1) + (3-1) = 1 + 3 + 2 = 6
      expect(fixture.componentInstance.totalDups()).toBe(6);
    });

    it('es 0 cuando no hay duplicados', () => {
      const fixture = setup(of([]));
      expect(fixture.componentInstance.totalDups()).toBe(0);
    });
  });

  describe('inc / dec con busy', () => {
    it('inc llama a addDuplicate y libera busy al finalizar', async () => {
      const addDup = jest.fn().mockResolvedValue(undefined);
      const fixture = setup(of([dupSticker('A', 2)]), { addDuplicate: addDup });
      const c = fixture.componentInstance;
      await c.inc(dupSticker('A', 2));
      expect(addDup).toHaveBeenCalledWith('wc2026', 'A', 2);
      expect(c.busy()).toBe(false);
    });

    it('inc bajo busy = true no dispara otra llamada', async () => {
      const addDup = jest.fn().mockResolvedValue(undefined);
      const fixture = setup(of([dupSticker('A', 2)]), { addDuplicate: addDup });
      const c = fixture.componentInstance;
      c.busy.set(true);
      await c.inc(dupSticker('A', 2));
      expect(addDup).not.toHaveBeenCalled();
    });

    it('dec captura errores y libera busy', async () => {
      const removeOne = jest.fn().mockRejectedValue(new Error('boom'));
      const fixture = setup(of([dupSticker('A', 2)]), { removeOne });
      const c = fixture.componentInstance;
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      await c.dec(dupSticker('A', 2));
      expect(removeOne).toHaveBeenCalled();
      expect(c.busy()).toBe(false);
    });
  });

  describe('copyList', () => {
    it('formatea como "CODE ×N" separado por comas y marca copied', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      const fixture = setup(of([dupSticker('A', 3), dupSticker('B', 2)]));
      const c = fixture.componentInstance;
      c.copyList();
      // micro-task delay
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('A ×2, B ×1');
      expect(c.copyState()).toBe('copied');
    });
  });

  describe('track', () => {
    it('usa code como identidad', () => {
      const fixture = setup(of([]));
      const c = fixture.componentInstance;
      expect(c.track(0, dupSticker('FOO', 2))).toBe('FOO');
    });
  });
});
