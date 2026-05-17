import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { StatsComponent } from './stats.component';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { AlbumProgress, SectionProgress } from '../../core/models/album.model';

function progress(over: Partial<AlbumProgress> = {}): AlbumProgress {
  return {
    owned: 50,
    missing: 50,
    total: 100,
    percent: 50,
    duplicates: 10,
    totalStickersOwned: 60,
    sectionsComplete: 1,
    sectionsTotal: 4,
    sections: [],
    ...over,
  };
}

function setup(stream: Observable<AlbumProgress>) {
  TestBed.configureTestingModule({
    imports: [StatsComponent],
    providers: [
      { provide: AlbumViewService, useValue: { getProgress: () => stream } },
      { provide: CURRENT_ALBUM_ID, useValue: 'wc2026' },
    ],
  });
  const fixture = TestBed.createComponent(StatsComponent);
  fixture.detectChanges();
  return fixture;
}

describe('StatsComponent', () => {
  describe('progress signal', () => {
    it('expone el valor de getProgress', () => {
      const fixture = setup(of(progress({ percent: 75 })));
      expect(fixture.componentInstance.progress()?.percent).toBe(75);
    });
  });

  describe('dashOffset', () => {
    it('para 0% devuelve la circunferencia completa', () => {
      const fixture = setup(of(progress({ percent: 0 })));
      const c = fixture.componentInstance;
      expect(c.dashOffset()).toBeCloseTo(c.circumference, 5);
    });

    it('para 100% devuelve 0', () => {
      const fixture = setup(of(progress({ percent: 100 })));
      expect(fixture.componentInstance.dashOffset()).toBeCloseTo(0, 5);
    });

    it('para 50% devuelve la mitad', () => {
      const fixture = setup(of(progress({ percent: 50 })));
      const c = fixture.componentInstance;
      expect(c.dashOffset()).toBeCloseTo(c.circumference / 2, 5);
    });
  });

  describe('track', () => {
    it('usa id de SectionProgress', () => {
      const fixture = setup(of(progress()));
      const c = fixture.componentInstance;
      const s: SectionProgress = {
        id: 'arg',
        name: 'Argentina',
        type: 'team',
        owned: 10,
        total: 20,
        duplicates: 0,
        percent: 50,
        complete: false,
      };
      expect(c.track(0, s)).toBe('arg');
    });
  });

  describe('circumference', () => {
    it('es 2 * π * 60', () => {
      const fixture = setup(of(progress()));
      expect(fixture.componentInstance.circumference).toBeCloseTo(2 * Math.PI * 60, 5);
    });
  });
});
