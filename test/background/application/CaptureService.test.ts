import { describe, expect, it, vi } from 'vitest';
import { CaptureService } from '../../../src/background/application/CaptureService';
import type { PageRenderer, RenderSession, SourceTab } from '../../../src/background/application/ports';
import type { Capture, Scale } from '../../../src/shared/model/Capture';
import { CAPTURE_RETENTION_MS } from '../../../src/shared/model/Capture';
import type { PageRect } from '../../../src/shared/model/Geometry';
import type { CaptureRepository } from '../../../src/shared/persistence/CaptureRepository';

const tab: SourceTab = { id: 7, index: 3, url: 'https://example.com/a', title: 'Example' };
const rect: PageRect = { x: 10, y: 20, width: 30, height: 40 };

function setup({ failing = [] as Scale[], located = [] as Array<PageRect | null>, attachFails = false } = {}) {
  const log: string[] = [];
  const shots: Array<{ scale: Scale; rect: PageRect }> = [];
  let scale: Scale = 1;
  const session: RenderSession = {
    setDeviceScale: async s => { scale = s; log.push(`scale ${s}`); },
    settle: async () => { log.push('settle'); },
    screenshot: async r => {
      shots.push({ scale, rect: r });
      if (failing.includes(scale)) throw new Error('too big');
      return new Blob([`png@${scale}`]);
    },
    detach: async () => { log.push('detach'); },
  };
  const renderer: PageRenderer = {
    attach: async id => { log.push(`attach ${id}`); if (attachFails) throw new Error('no debugger'); return session; },
  };
  const saved: Array<[string, Capture]> = [];
  const repository: CaptureRepository = {
    save: async (id, c) => { saved.push([id, c]); log.push('save'); },
    find: async () => undefined,
    update: async () => {},
    deleteOlderThan: vi.fn(async () => { log.push('prune'); }),
  };
  const indicator = {
    showBusy: async (id: number) => { log.push(`busy ${id}`); },
    clear: async (id: number) => { log.push(`clear ${id}`); },
    showError: vi.fn(async () => {}),
  };
  const editor = { open: vi.fn(async () => { log.push('editor'); }) };
  let locateCall = 0;
  const elementLocator = { locate: async () => located[locateCall++] ?? null };
  const service = new CaptureService({
    renderer, elementLocator, repository, indicator, editor, newId: () => 'id-1', now: () => 1234,
  });
  return { service, log, shots, saved, repository, editor };
}

describe('CaptureService', () => {
  it('renders every scale, stores the capture, then opens the editor next to the tab', async () => {
    const { service, log, saved, editor, repository } = setup();
    await service.capture(tab, rect, false);
    expect(log).toEqual([
      'busy 7', 'attach 7',
      'scale 1', 'settle', 'scale 2', 'settle', 'scale 3', 'settle', 'scale 4', 'settle',
      'detach', 'save', 'prune', 'clear 7', 'editor',
    ]);
    const [id, stored] = saved[0];
    expect(id).toBe('id-1');
    expect(Object.keys(stored.images)).toEqual(['1', '2', '3', '4']);
    expect(stored).toMatchObject({ failed: [], rect, url: tab.url, title: tab.title, time: 1234 });
    expect(repository.deleteOlderThan).toHaveBeenCalledWith(CAPTURE_RETENTION_MS);
    expect(editor.open).toHaveBeenCalledWith('id-1', tab);
  });

  it('records a scale Chrome cannot render instead of failing', async () => {
    const { service, saved } = setup({ failing: [4] });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await service.capture(tab, rect, false);
    expect(Object.keys(saved[0][1].images)).toEqual(['1', '2', '3']);
    expect(saved[0][1].failed).toEqual([4]);
  });

  it('fails, after restoring the page, when no scale could be rendered', async () => {
    const { service, log, saved, editor } = setup({ failing: [1, 2, 3, 4] });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(service.capture(tab, rect, false)).rejects.toThrow('no image could be captured');
    expect(log).toContain('detach');
    expect(saved).toEqual([]);
    expect(editor.open).not.toHaveBeenCalled();
  });

  it('re-measures a picked element before each shot, keeping the last good rect when it is gone', async () => {
    const moved = { x: 11, y: 22, width: 33, height: 44 };
    const { service, shots, saved } = setup({ located: [null, moved, null, moved] });
    await service.capture(tab, rect, true);
    expect(shots.map(s => s.rect)).toEqual([rect, moved, moved, moved]);
    expect(saved[0][1].rect).toEqual(moved);
  });

  it('does not re-measure a dragged region', async () => {
    const { service, shots } = setup({ located: [{ x: 0, y: 0, width: 1, height: 1 }] });
    await service.capture(tab, rect, false);
    expect(shots.every(s => s.rect === rect)).toBe(true);
  });

  it('does not wait for pruning', async () => {
    const { service, repository } = setup();
    vi.mocked(repository.deleteOlderThan).mockRejectedValue(new Error('busy'));
    await expect(service.capture(tab, rect, false)).resolves.toBeUndefined();
  });

  it('propagates a debugger that cannot attach', async () => {
    const { service } = setup({ attachFails: true });
    await expect(service.capture(tab, rect, false)).rejects.toThrow('no debugger');
  });
});
