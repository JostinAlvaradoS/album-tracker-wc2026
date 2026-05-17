import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StickerCellComponent } from './sticker-cell.component';
import { StickerView } from '../../../core/models/album.model';

function mockSticker(over: Partial<StickerView> = {}): StickerView {
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

describe('StickerCellComponent', () => {
  let fixture: ComponentFixture<StickerCellComponent>;
  let component: StickerCellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickerCellComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StickerCellComponent);
    component = fixture.componentInstance;
  });

  describe('kindLabel', () => {
    it('mapea cada tipo a su etiqueta corta', () => {
      expect(component.kindLabel('emblem')).toBe('ESCUDO');
      expect(component.kindLabel('teamPhoto')).toBe('FOTO');
      expect(component.kindLabel('special')).toBe('ESP.');
      expect(component.kindLabel('player')).toBe('PLR');
    });

    it('devuelve string vacío para tipos desconocidos', () => {
      expect(component.kindLabel('unknown')).toBe('');
    });
  });

  describe('bigLabel', () => {
    it('para emblem usa las letras del código', () => {
      const s = mockSticker({ kind: 'emblem', code: 'ARG1' });
      expect(component.bigLabel(s)).toBe('ARG');
    });

    it('para teamPhoto usa el placeholder visual', () => {
      const s = mockSticker({ kind: 'teamPhoto' });
      expect(component.bigLabel(s)).toBe('▭');
    });

    it('para special usa las letras del código sin dígitos', () => {
      const s = mockSticker({ kind: 'special', code: 'FWC1' });
      expect(component.bigLabel(s)).toBe('FWC');
    });

    it('para player muestra el número con padding', () => {
      const s = mockSticker({ kind: 'player', number: 3 });
      expect(component.bigLabel(s)).toBe('03');
    });

    it('para special con código que es solo dígitos cae al fallback', () => {
      const s = mockSticker({ kind: 'special', code: '00' });
      expect(component.bigLabel(s)).toBe('★');
    });
  });

  describe('ariaLabel', () => {
    it('describe estado pegada', () => {
      component.sticker = mockSticker({ status: 'owned', count: 1 });
      expect(component.ariaLabel).toContain('pegada');
    });

    it('describe estado faltante', () => {
      component.sticker = mockSticker({ status: 'missing', count: 0 });
      expect(component.ariaLabel).toContain('faltante');
    });

    it('describe repes en singular cuando hay 1', () => {
      component.sticker = mockSticker({ status: 'duplicate', count: 2 });
      expect(component.ariaLabel).toContain('con 1 repe');
      expect(component.ariaLabel).not.toContain('1 repes');
    });

    it('pluraliza repes a partir de 2', () => {
      component.sticker = mockSticker({ status: 'duplicate', count: 4 });
      expect(component.ariaLabel).toContain('con 3 repes');
    });
  });

  describe('eventos', () => {
    beforeEach(() => {
      component.sticker = mockSticker();
    });

    it('emite cycle al clickear la celda', () => {
      const spy = jest.fn();
      component.cycle.subscribe(spy);
      const button = fixture.nativeElement.querySelector('.cell') as HTMLButtonElement;
      fixture.detectChanges();
      button.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onContext previene el menú y emite addDup', () => {
      const spy = jest.fn();
      component.addDup.subscribe(spy);
      const ev = new MouseEvent('contextmenu', { cancelable: true });
      jest.spyOn(ev, 'preventDefault');
      component.onContext(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
