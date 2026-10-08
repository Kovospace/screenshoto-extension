import { describe, expect, it } from 'vitest';
import { downloadLocation, parseExportSettings, sanitizeStoredSettings } from '../../../src/editor/model/ExportSettings';

const parse = (folder: string, suffix = '@{n}x') => parseExportSettings({ folder, suffix });

describe('parseExportSettings', () => {
  it('normalises the folder: trims, unifies slashes, drops empty segments', () => {
    expect(parse('  Shots\\\\Web/  2026 / ')).toEqual({ ok: true, settings: { folder: 'Shots/Web/2026', suffix: '@{n}x' } });
    expect(parse('')).toEqual({ ok: true, settings: { folder: '', suffix: '@{n}x' } });
  });

  it('refuses paths outside Downloads instead of nesting them silently', () => {
    for (const f of ['/home/me/Pictures', '~/Pictures', 'C:\\Users\\me', 'd:/x']) {
      expect(parse(f)).toMatchObject({ ok: false, errors: { folder: expect.stringMatching(/inside Downloads/) } });
    }
  });

  it('refuses . and .., forbidden characters and trailing dots', () => {
    expect(parse('a/../b')).toMatchObject({ ok: false, errors: { folder: expect.stringContaining('..') } });
    expect(parse('a/b?')).toMatchObject({ ok: false, errors: { folder: expect.stringContaining('Not allowed') } });
    expect(parse('shots.')).toMatchObject({ ok: false, errors: { folder: expect.stringContaining('dot') } });
  });

  it('requires {n} in the suffix and no path or forbidden characters', () => {
    expect(parse('x', '_{n}')).toMatchObject({ ok: true, settings: { suffix: '_{n}' } });
    expect(parse('x', ' _{n}x ')).toMatchObject({ ok: true, settings: { suffix: '_{n}x' } });
    expect(parse('x', '_2x')).toMatchObject({ ok: false, errors: { suffix: expect.stringContaining('{n}') } });
    expect(parse('x', '/{n}')).toMatchObject({ ok: false, errors: { suffix: expect.stringContaining('Not allowed') } });
    expect(parse('x', '{n}:')).toMatchObject({ ok: false });
  });

  it('reports both fields at once', () => {
    const r = parse('/abs', 'none');
    expect(r.ok).toBe(false);
    expect(Object.keys(r.ok ? {} : r.errors)).toEqual(['folder', 'suffix']);
  });
});

describe('sanitizeStoredSettings', () => {
  it('falls back to the default per field for missing or invalid values', () => {
    expect(sanitizeStoredSettings(undefined)).toEqual({ folder: 'Screenshoto Web', suffix: '@{n}x' });
    expect(sanitizeStoredSettings({ folder: 'Mine', suffix: 'broken' })).toEqual({ folder: 'Mine', suffix: '@{n}x' });
    expect(sanitizeStoredSettings({ folder: 7, suffix: '_{n}' })).toEqual({ folder: 'Screenshoto Web', suffix: '_{n}' });
  });
});

describe('downloadLocation', () => {
  it('names the folder as the user sees it', () => {
    expect(downloadLocation({ folder: 'A/B', suffix: '' })).toBe('Downloads/A/B');
    expect(downloadLocation({ folder: '', suffix: '' })).toBe('Downloads');
  });
});
