import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Capture } from '../../../src/shared/model/Capture';
import { IndexedDbCaptureRepository } from '../../../src/shared/persistence/IndexedDbCaptureRepository';

// Blobs are not structured-cloneable in this environment; the repository does not care what images are.
const capture = (time: number, extra: Partial<Capture> = {}): Capture => ({
  images: { 1: 'png' as unknown as Blob }, failed: [4], rect: { x: 1, y: 2, width: 3, height: 4 }, time, ...extra,
});

describe('IndexedDbCaptureRepository', () => {
  let repo: IndexedDbCaptureRepository;
  beforeEach(() => { repo = new IndexedDbCaptureRepository(new IDBFactory()); });

  it('stores and finds a capture by id', async () => {
    await repo.save('a', capture(5));
    expect(await repo.find('a')).toEqual(capture(5));
    expect(await repo.find('missing')).toBeUndefined();
  });

  it('merges edits into a stored capture, keeping the rest', async () => {
    await repo.save('a', capture(5, { url: 'https://x' }));
    await repo.update('a', { annotations: [], lastScale: 3 });
    expect(await repo.find('a')).toEqual(capture(5, { url: 'https://x', annotations: [], lastScale: 3 }));
  });

  it('does not resurrect a capture that is gone', async () => {
    await repo.update('gone', { lastScale: 2 });
    expect(await repo.find('gone')).toBeUndefined();
  });

  it('deletes only captures older than the given age', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    await repo.save('old', capture(1_000));
    await repo.save('new', capture(9_500));
    await repo.save('untimed', capture(0));
    await repo.deleteOlderThan(1_000);
    expect(await repo.find('old')).toBeUndefined();
    expect(await repo.find('untimed')).toBeUndefined();
    expect(await repo.find('new')).toBeDefined();
  });

  it('uses the persisted database layout', async () => {
    const factory = new IDBFactory();
    await new IndexedDbCaptureRepository(factory).save('a', capture(1));
    const db = await new Promise<IDBDatabase>(r => { const o = factory.open('shotkit'); o.onsuccess = () => r(o.result); });
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).toEqual(['captures']);
  });
});
