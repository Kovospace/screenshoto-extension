import type { Capture, CaptureEdits, CaptureId } from '../model/Capture';
import type { CaptureRepository } from './CaptureRepository';

/**
 * IndexedDB-backed {@link CaptureRepository}. Each extension context (worker, editor tab) holds
 * its own instance; they meet in the same database.
 *
 * Database name, version and store name are the persisted format — changing them orphans every
 * stored capture. Keys are out-of-line (the capture id is not a field of the value).
 */
export class IndexedDbCaptureRepository implements CaptureRepository {
  static readonly DB_NAME = 'shotkit';
  static readonly DB_VERSION = 1;
  static readonly STORE = 'captures';

  private connection?: Promise<IDBDatabase>;

  constructor(private readonly factory: IDBFactory = indexedDB) {}

  save(id: CaptureId, capture: Capture): Promise<void> {
    return this.run('readwrite', store => { store.put(capture, id); }).then(() => undefined);
  }

  find(id: CaptureId): Promise<Capture | undefined> {
    return this.run('readonly', store => store.get(id)) as Promise<Capture | undefined>;
  }

  update(id: CaptureId, edits: CaptureEdits): Promise<void> {
    return this.run('readwrite', store => {
      const read = store.get(id);
      read.onsuccess = () => {
        if (read.result) store.put({ ...read.result, ...edits }, id);
      };
    }).then(() => undefined);
  }

  deleteOlderThan(maxAgeMs: number): Promise<void> {
    return this.run('readwrite', store => {
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        if (Date.now() - ((cursor.value as Capture).time || 0) > maxAgeMs) cursor.delete();
        cursor.continue();
      };
    }).then(() => undefined);
  }

  private open(): Promise<IDBDatabase> {
    return (this.connection ??= new Promise((resolve, reject) => {
      const request = this.factory.open(IndexedDbCaptureRepository.DB_NAME, IndexedDbCaptureRepository.DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(IndexedDbCaptureRepository.STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }));
  }

  /**
   * Runs `work` in one transaction and resolves once the transaction completes (so writes are
   * durable), with the result of the request `work` returned, if any.
   */
  private async run(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest | void): Promise<unknown> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IndexedDbCaptureRepository.STORE, mode);
      const request = work(tx.objectStore(IndexedDbCaptureRepository.STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  }
}
