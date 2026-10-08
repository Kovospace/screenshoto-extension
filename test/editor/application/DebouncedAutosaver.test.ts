import { afterEach, describe, expect, it, vi } from 'vitest';
import { DebouncedAutosaver } from '../../../src/editor/application/DebouncedAutosaver';
import type { CaptureRepository } from '../../../src/shared/persistence/CaptureRepository';

describe('DebouncedAutosaver', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('writes the latest state once, 300 ms after the last change', async () => {
    vi.useFakeTimers();
    const update = vi.fn(async () => {});
    let scale = 1;
    const saver = new DebouncedAutosaver({ update } as unknown as CaptureRepository, 'id', () => ({ annotations: [], lastScale: scale as 1 }));
    saver.schedule();
    vi.advanceTimersByTime(299);
    saver.schedule();
    scale = 3;
    vi.advanceTimersByTime(299);
    expect(update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(update).toHaveBeenCalledExactlyOnceWith('id', { annotations: [], lastScale: 3 });
  });

  it('swallows a failed write', async () => {
    vi.useFakeTimers();
    const saver = new DebouncedAutosaver({ update: async () => { throw new Error('quota'); } } as unknown as CaptureRepository, 'id', () => ({}));
    saver.schedule();
    await vi.runAllTimersAsync();
  });
});
