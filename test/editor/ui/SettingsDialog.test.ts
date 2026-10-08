import { beforeEach, describe, expect, it } from 'vitest';
import type { SettingsRepository } from '../../../src/editor/application/ports';
import { SettingsService } from '../../../src/editor/application/SettingsService';
import { EditorState } from '../../../src/editor/model/EditorState';
import type { ExportSettings } from '../../../src/editor/model/ExportSettings';
import { SettingsDialog } from '../../../src/editor/ui/SettingsDialog';
import html from '../../../src/editor/editor.html?raw';
import { loadedCapture } from '../../support/editorHarness';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const type = (id: string, value: string) => {
  $<HTMLInputElement>(id).value = value;
  $(id).dispatchEvent(new Event('input'));
};

describe('SettingsDialog (against the real editor.html)', () => {
  let saved: ExportSettings[];
  let toasts: string[];

  beforeEach(async () => {
    document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>\s*$/, '');
    // jsdom has no modal dialogs.
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; };
    saved = [];
    toasts = [];
    const repo: SettingsRepository = { load: async () => ({ folder: 'Screenshoto Web', suffix: '@{n}x' }), save: async s => { saved.push(s); }, onExternalChange: () => {} };
    const settings = new SettingsService(repo);
    await settings.load();
    const session = loadedCapture([1, 2, 3, 4], { url: 'https://example.com/', time: new Date(2026, 0, 2, 3, 4, 5).getTime() });
    new SettingsDialog(settings, session, new EditorState(2), { toast: m => toasts.push(m) }).bind($('openSettings'));
    $('openSettings').click();
  });

  it('opens with the current settings and a preview of the file name', () => {
    expect($<HTMLDialogElement>('settings').open).toBe(true);
    expect($<HTMLInputElement>('setFolder').value).toBe('Screenshoto Web');
    expect($('setPreview').textContent).toBe('Downloads/Screenshoto Web/example.com_2026-01-02_03-04-05@2x.png');
  });

  it('shows errors and blocks saving while the input is invalid', () => {
    type('setSuffix', '_2');
    expect($('setSuffixError').textContent).toMatch(/\{n\}/);
    expect($<HTMLButtonElement>('setSave').disabled).toBe(true);
    type('setSuffix', '_{n}');
    expect($('setSuffixError').textContent).toBe('');
    expect($('setPreview').textContent).toBe('Downloads/Screenshoto Web/example.com_2026-01-02_03-04-05_2.png');
  });

  it('saves valid input, closes and confirms', async () => {
    type('setFolder', 'Shots');
    $<HTMLFormElement>('settingsForm').dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r));
    expect(saved).toEqual([{ folder: 'Shots', suffix: '@{n}x' }]);
    expect($<HTMLDialogElement>('settings').open).toBe(false);
    expect(toasts).toEqual(['Settings saved']);
  });

  it('Cancel closes without saving; Defaults refills the fields', () => {
    type('setFolder', '');
    $('setDefaults').click();
    expect($<HTMLInputElement>('setFolder').value).toBe('Screenshoto Web');
    $('setCancel').click();
    expect($<HTMLDialogElement>('settings').open).toBe(false);
    expect(saved).toEqual([]);
  });
});
