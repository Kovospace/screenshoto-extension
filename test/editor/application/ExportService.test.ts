import { describe, expect, it } from 'vitest';
import { ExportService } from '../../../src/editor/application/ExportService';
import type { Capture } from '../../../src/shared/model/Capture';

const capture = { time: new Date(2026, 0, 2, 3, 4, 5).getTime(), url: 'https://www.example.com/x' } as Capture;

function setup(download: (name: string, saveAs: boolean) => Promise<void> = async () => {}) {
  const toasts: string[] = [];
  const downloads: Array<[string, boolean]> = [];
  const service = new ExportService(
    capture,
    { render: async s => new Blob([`png${s}`]) },
    { download: async (_png, name, saveAs) => { downloads.push([name, saveAs]); await download(name, saveAs); } },
    { writePng: async png => { await png; } },
    { toast: m => toasts.push(m) },
  );
  return { service, toasts, downloads };
}

describe('ExportService', () => {
  it('saves one file per scale and reports the count', async () => {
    const { service, toasts, downloads } = setup();
    await service.save([1, 2, 3, 4], true);
    expect(downloads).toEqual([1, 2, 3, 4].map(s => [`ShotKit/www.example.com_2026-01-02_03-04-05@${s}x.png`, false]));
    expect(toasts).toEqual(['Saved 4 files to Downloads/ShotKit']);
  });

  it('honours "save as" for a single file', async () => {
    const { service, toasts, downloads } = setup();
    await service.save([3], true);
    expect(downloads[0][1]).toBe(true);
    expect(toasts).toEqual(['Saved 3× to Downloads/ShotKit']);
  });

  it('stays quiet when the user cancels the dialog, and reports real failures', async () => {
    const cancelled = setup(async () => { throw new Error('Download canceled by the user'); });
    await cancelled.service.save([2], true);
    expect(cancelled.toasts).toEqual([]);

    const failing = setup(async name => { if (name.includes('@2x')) throw new Error('disk full'); });
    await failing.service.save([1, 2], false);
    // One file saved: the toast names the first *requested* scale (original behaviour, kept as-is).
    expect(failing.toasts).toEqual(['Save failed: disk full', 'Saved 1× to Downloads/ShotKit']);
  });

  it('copies and reports the outcome', async () => {
    const ok = setup();
    await ok.service.copy(2);
    expect(ok.toasts).toEqual(['Copied 2× image']);

    const toasts: string[] = [];
    const denied = new ExportService(capture, { render: async () => new Blob() }, { download: async () => {} },
      { writePng: async () => { throw new Error('not allowed'); } }, { toast: m => toasts.push(m) });
    await denied.copy(2);
    expect(toasts).toEqual(['Copy failed: not allowed']);
  });
});
