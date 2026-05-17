import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import * as firestore from '@angular/fire/firestore';
import { CollectionService } from './collection.service';

const batchSet = jest.fn();
const batchDelete = jest.fn();
const batchCommit = jest.fn().mockResolvedValue(undefined);

jest.mock('@angular/fire/firestore', () => {
  const actual = jest.requireActual('@angular/fire/firestore');
  return {
    ...actual,
    doc: jest.fn((_fs, path) => ({ __path: path })),
    collection: jest.fn((_fs, path) => ({ __path: path })),
    docData: jest.fn(() => ({ subscribe: () => ({ unsubscribe: () => undefined }) })),
    collectionData: jest.fn(() => ({ subscribe: () => ({ unsubscribe: () => undefined }) })),
    writeBatch: jest.fn(() => ({
      set: batchSet,
      delete: batchDelete,
      commit: batchCommit,
    })),
    increment: jest.fn((n: number) => ({ __increment: n })),
    serverTimestamp: jest.fn(() => ({ __serverTs: true })),
    setDoc: jest.fn().mockResolvedValue(undefined),
    getDocFromCache: jest.fn(),
    getDocFromServer: jest.fn(),
  };
});

const docMock = firestore.doc as jest.Mock;
const setDocMock = firestore.setDoc as jest.Mock;
const getDocFromCacheMock = firestore.getDocFromCache as jest.Mock;
const getDocFromServerMock = firestore.getDocFromServer as jest.Mock;

function makeService(uid: string | null): CollectionService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      CollectionService,
      { provide: Firestore, useValue: {} },
      { provide: Auth, useValue: { currentUser: uid ? { uid } : null } },
    ],
  });
  return TestBed.inject(CollectionService);
}

describe('CollectionService', () => {
  beforeEach(() => {
    batchSet.mockClear();
    batchDelete.mockClear();
    batchCommit.mockClear();
    docMock.mockClear();
    setDocMock.mockClear();
    getDocFromCacheMock.mockReset();
    getDocFromServerMock.mockReset();
  });

  describe('uid guard', () => {
    it('lanza si no hay usuario autenticado al llamar setStickerCount', async () => {
      const service = makeService(null);
      await expect(
        service.setStickerCount('wc2026', 'ARG1', 1, 0)
      ).rejects.toThrow('Usuario no autenticado');
    });
  });

  describe('ensureCollection', () => {
    it('no crea doc si ya existe en cache', async () => {
      const service = makeService('user123');
      getDocFromCacheMock.mockResolvedValue({ exists: () => true });
      await service.ensureCollection('wc2026', 994);
      expect(setDocMock).not.toHaveBeenCalled();
    });

    it('crea doc con stats iniciales si no existe', async () => {
      const service = makeService('user123');
      getDocFromCacheMock.mockResolvedValue({ exists: () => false });
      await service.ensureCollection('wc2026', 994);
      expect(setDocMock).toHaveBeenCalledTimes(1);
      const payload = setDocMock.mock.calls[0][1];
      expect(payload.albumId).toBe('wc2026');
      expect(payload.stats).toEqual({
        owned: 0,
        missing: 994,
        duplicates: 0,
        total: 994,
      });
    });

    it('si cache falla, va al servidor', async () => {
      const service = makeService('user123');
      getDocFromCacheMock.mockRejectedValue(new Error('not in cache'));
      getDocFromServerMock.mockResolvedValue({ exists: () => true });
      await service.ensureCollection('wc2026', 994);
      expect(getDocFromServerMock).toHaveBeenCalled();
      expect(setDocMock).not.toHaveBeenCalled();
    });
  });

  describe('setStickerCount — deltas', () => {
    it('si no cambia el count, no commitea', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', 2, 2);
      expect(batchCommit).not.toHaveBeenCalled();
    });

    it('count 0→1: owned +1, missing -1, duplicates 0', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', 1, 0);

      expect(batchSet).toHaveBeenCalled();
      // El primer set es el doc del item; el segundo es el doc de stats con increments.
      const statsCall = batchSet.mock.calls[1];
      const statsPayload = statsCall[1];
      expect(statsPayload.stats.owned).toEqual({ __increment: 1 });
      expect(statsPayload.stats.missing).toEqual({ __increment: -1 });
      expect(statsPayload.stats.duplicates).toEqual({ __increment: 0 });
      expect(batchCommit).toHaveBeenCalled();
    });

    it('count 1→0: borra item, owned -1, missing +1', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', 0, 1);

      expect(batchDelete).toHaveBeenCalledTimes(1);
      const statsCall = batchSet.mock.calls[0]; // único set: stats
      const statsPayload = statsCall[1];
      expect(statsPayload.stats.owned).toEqual({ __increment: -1 });
      expect(statsPayload.stats.missing).toEqual({ __increment: 1 });
      expect(statsPayload.stats.duplicates).toEqual({ __increment: 0 });
    });

    it('count 1→3: duplicates +2, owned no cambia', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', 3, 1);

      const statsCall = batchSet.mock.calls[1];
      const statsPayload = statsCall[1];
      expect(statsPayload.stats.owned).toEqual({ __increment: 0 });
      expect(statsPayload.stats.duplicates).toEqual({ __increment: 2 });
    });

    it('clampa números negativos a 0', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', -5, 2);

      // newCount clampea a 0 → borra
      expect(batchDelete).toHaveBeenCalled();
      const statsCall = batchSet.mock.calls[0];
      const payload = statsCall[1];
      expect(payload.stats.owned).toEqual({ __increment: -1 });
      // prev=2 → tenía 1 repe; new=0 → 0 repes; delta = -1
      expect(payload.stats.duplicates).toEqual({ __increment: -1 });
    });

    it('redondea hacia abajo (floor) si llegan decimales', async () => {
      const service = makeService('user123');
      await service.setStickerCount('wc2026', 'ARG1', 2.9, 1.1);
      // safeNew = 2, safePrev = 1
      const statsCall = batchSet.mock.calls[1];
      const payload = statsCall[1];
      expect(payload.stats.duplicates).toEqual({ __increment: 1 });
    });
  });

  describe('helpers que delegan a setStickerCount', () => {
    it('markOwned llama con newCount = 1', async () => {
      const service = makeService('user123');
      const spy = jest.spyOn(service, 'setStickerCount');
      await service.markOwned('wc2026', 'ARG1', 0);
      expect(spy).toHaveBeenCalledWith('wc2026', 'ARG1', 1, 0);
    });

    it('markMissing llama con newCount = 0', async () => {
      const service = makeService('user123');
      const spy = jest.spyOn(service, 'setStickerCount');
      await service.markMissing('wc2026', 'ARG1', 3);
      expect(spy).toHaveBeenCalledWith('wc2026', 'ARG1', 0, 3);
    });

    it('addDuplicate suma 1 al currentCount', async () => {
      const service = makeService('user123');
      const spy = jest.spyOn(service, 'setStickerCount');
      await service.addDuplicate('wc2026', 'ARG1', 2);
      expect(spy).toHaveBeenCalledWith('wc2026', 'ARG1', 3, 2);
    });

    it('removeOne resta 1 al currentCount', async () => {
      const service = makeService('user123');
      const spy = jest.spyOn(service, 'setStickerCount');
      await service.removeOne('wc2026', 'ARG1', 3);
      expect(spy).toHaveBeenCalledWith('wc2026', 'ARG1', 2, 3);
    });
  });
});
