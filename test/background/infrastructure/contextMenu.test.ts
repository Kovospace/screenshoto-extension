import { afterEach, describe, expect, it, vi } from 'vitest';
import { CaptureContextMenu } from '../../../src/background/infrastructure/CaptureContextMenu';
import { ScriptingPickerLauncher } from '../../../src/background/infrastructure/ScriptingPickerLauncher';

describe('CaptureContextMenu', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates "Capture area" and "Capture element" on the page, replacing old entries', () => {
    const created: Array<{ id: string; title: string; contexts: string[] }> = [];
    vi.stubGlobal('chrome', { contextMenus: { removeAll: (done: () => void) => done(), create: (p: never) => created.push(p) } });
    CaptureContextMenu.register();
    expect(created.map(c => c.title)).toEqual(['Capture area', 'Capture element']);
    expect(created[0].contexts).toContain('page');
    expect(created.map(c => CaptureContextMenu.modeFor(c.id))).toEqual(['region', 'element']);
    expect(CaptureContextMenu.modeFor('someone-else')).toBeUndefined();
  });
});

describe('ScriptingPickerLauncher', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leaves the requested mode on the page before injecting the picker', async () => {
    const calls: Array<{ func?: (m: string) => void; args?: string[]; files?: string[] }> = [];
    vi.stubGlobal('chrome', { scripting: { executeScript: async (c: never) => { calls.push(c); return []; } } });
    await new ScriptingPickerLauncher().launch(4, 'element');
    expect(calls.map(c => c.files ?? c.args)).toEqual([['element'], ['picker.js']]);
    calls[0].func!('element');
    expect(window.__screenshotoRequestedMode).toBe('element');
    delete window.__screenshotoRequestedMode;

    calls.length = 0;
    await new ScriptingPickerLauncher().launch(4);
    expect(calls.map(c => c.files)).toEqual([['picker.js']]);
  });
});
