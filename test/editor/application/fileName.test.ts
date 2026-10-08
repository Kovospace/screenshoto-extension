import { describe, expect, it } from 'vitest';
import { exportFileName, hostOf } from '../../../src/editor/application/fileName';

const time = new Date(2026, 10, 9, 8, 7, 6).getTime();

describe('exportFileName', () => {
  it('names files after the host, local capture time and scale', () => {
    expect(exportFileName({ time, url: 'https://docs.example.org/a?b' }, 2)).toBe('Screenshoto Web/docs.example.org_2026-11-09_08-07-06@2x.png');
  });

  it('falls back to "capture" without a usable host', () => {
    expect(exportFileName({ time, url: 'not a url' }, 1)).toBe('Screenshoto Web/capture_2026-11-09_08-07-06@1x.png');
    expect(exportFileName({ time, url: 'file:///tmp/x.html' }, 1)).toBe('Screenshoto Web/capture_2026-11-09_08-07-06@1x.png');
    expect(hostOf(undefined)).toBe('capture');
  });

  it('keeps file-name-safe characters only', () => {
    expect(exportFileName({ time, url: 'http://[::1]:8080/' }, 4)).toBe('Screenshoto Web/_1__2026-11-09_08-07-06@4x.png');
  });

  it('uses the current time for a capture without one', () => {
    expect(exportFileName({ time: 0, url: 'https://a.b' }, 1, time)).toBe('Screenshoto Web/a.b_2026-11-09_08-07-06@1x.png');
  });
});
