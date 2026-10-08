import { describe, expect, it } from 'vitest';
import type { SettingsRepository } from '../../../src/editor/application/ports';
import { SettingsService } from '../../../src/editor/application/SettingsService';
import type { ExportSettings } from '../../../src/editor/model/ExportSettings';

function fakeRepository(initial: ExportSettings) {
  const saved: ExportSettings[] = [];
  let external: (s: ExportSettings) => void = () => {};
  const repo: SettingsRepository = {
    load: async () => initial,
    save: async s => { saved.push(s); },
    onExternalChange: l => { external = l; },
  };
  return { repo, saved, changeElsewhere: (s: ExportSettings) => external(s) };
}

describe('SettingsService', () => {
  it('starts from the stored settings and follows changes made elsewhere', async () => {
    const f = fakeRepository({ folder: 'A', suffix: '_{n}' });
    const service = new SettingsService(f.repo);
    await service.load();
    expect(service.current).toEqual({ folder: 'A', suffix: '_{n}' });
    f.changeElsewhere({ folder: 'B', suffix: '_{n}' });
    expect(service.current.folder).toBe('B');
  });

  it('applies and persists only valid input, normalised', async () => {
    const f = fakeRepository({ folder: 'A', suffix: '_{n}' });
    const service = new SettingsService(f.repo);
    await service.load();
    expect((await service.update({ folder: '/abs', suffix: '_{n}' })).ok).toBe(false);
    expect(f.saved).toEqual([]);
    expect(service.current.folder).toBe('A');
    await service.update({ folder: ' X\\Y ', suffix: '_{n}x' });
    expect(f.saved).toEqual([{ folder: 'X/Y', suffix: '_{n}x' }]);
    expect(service.current).toEqual({ folder: 'X/Y', suffix: '_{n}x' });
  });
});
