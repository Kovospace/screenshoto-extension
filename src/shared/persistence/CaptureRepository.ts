import type { Capture, CaptureEdits, CaptureId } from '../model/Capture';

/** Storage for captures, shared by the service worker (writes) and the editor (reads, patches). */
export interface CaptureRepository {
  save(id: CaptureId, capture: Capture): Promise<void>;
  /** Resolves to undefined when the capture does not exist (never stored, or pruned). */
  find(id: CaptureId): Promise<Capture | undefined>;
  /** Merges `edits` into a stored capture; does nothing if it no longer exists. */
  update(id: CaptureId, edits: CaptureEdits): Promise<void>;
  /** Deletes every capture whose `time` is more than `maxAgeMs` in the past. */
  deleteOlderThan(maxAgeMs: number): Promise<void>;
}
