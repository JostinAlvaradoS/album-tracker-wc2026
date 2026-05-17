import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { MissingListComponent } from './missing-list.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { StickerView } from '../../core/models/album.model';

function missingSticker(code: string, sectionName: string, number: number): StickerView {
  return {
    code,
    number,
    sectionId: sectionName.toLowerCase(),
    sectionName,
    kind: 'player',
    label: 'X',
    special: false,
    foil: false,
    order: number,
    count: 0,
    status: 'missing',
  };
}

function setup(stream: Observable<StickerView[]>) {
  TestBed.configureTestingModule({
    imports: [MissingListComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getMissing: () => stream } },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(MissingListComponent);
  fixture.detectChanges();
  return fixture;
}

describe('MissingListComponent', () => {
  describe('grouped', () => {
    it('agrupa los faltantes por sectionName', () => {
      const items = [
        missingSticker('ARG3', 'Argentina', 3),
        missingSticker('ARG1', 'Argentina', 1),
        missingSticker('MEX5', 'México', 5),
      ];
      const fixture = setup(of(items));
      const groups = fixture.componentInstance.grouped();
      expect(groups).toHaveLength(2);
      const arg = groups.find((g) => g.section === 'Argentina')!;
      expect(arg.items.map((i) => i.code)).toEqual(['ARG1', 'ARG3']); // ordenados
      expect(arg.codes).toBe('ARG1, ARG3');
    });

    it('devuelve lista vacía si no hay faltantes', () => {
      const fixture = setup(of([]));
      expect(fixture.componentInstance.grouped()).toEqual([]);
    });
  });

  describe('copyList', () => {
    it('formatea cada sección como "Nombre: codes" separadas por newline', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      const items = [
        missingSticker('ARG3', 'Argentina', 3),
        missingSticker('MEX1', 'México', 1),
      ];
      const fixture = setup(of(items));
      const c = fixture.componentInstance;
      c.copyList();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledWith('Argentina: ARG3\nMéxico: MEX1');
      expect(c.copyState()).toBe('copied');
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
      expect(c.trackItem(0, missingSticker('A', 'B', 1))).toBe('A');
    });
  });
});
