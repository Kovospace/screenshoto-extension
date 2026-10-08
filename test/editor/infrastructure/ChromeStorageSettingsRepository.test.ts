import { describe, expect, it } from 'vitest';
import { ChromeStorageSettingsRepository } from '../../../src/editor/infrastructure/ChromeStorageSettingsRepository';

function fakeArea(data: Record<string, unknown> = {}) {
  const listeners: Array<(c: Record<string, { newValue?: unknown }>) => void> = [];
  const area = {
    get: async (key: string) => (key in data ? { [key]: data[key] } : {}),
    set: async (items: Record<string, unknown>) => {
      Object.assign(data, items);
      for (const l of listeners) l(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, { newValue: v }])));
    },
    onChanged: { addListener: (l: (typeof listeners)[0]) => listeners.push(l) },
  };
  return { area: area as unknown as chrome.storage.StorageArea, data };
}

describe('ChromeStorageSettingsRepository', () => {
  it('loads defaults when nothing is stored, and round-trips what was saved', async () => {
    const { area, data } = fakeArea();
    const repo = new ChromeStorageSettingsRepository(area);
    expect(await repo.load()).toEqual({ folder: 'Screenshoto Web', suffix: '@{n}x' });
    await repo.save({ folder: 'Shots', suffix: '_{n}' });
    expect(data).toEqual({ exportSettings: { folder: 'Shots', suffix: '_{n}' } });
    expect(await repo.load()).toEqual({ folder: 'Shots', suffix: '_{n}' });
  });

  it('reports changes of its key, sanitised', async () => {
    const { area } = fakeArea();
    const repo = new ChromeStorageSettingsRepository(area);
    const seen: unknown[] = [];
    repo.onExternalChange(s => seen.push(s));
    await area.set({ other: 1 });
    await area.set({ exportSettings: { folder: 'Z', suffix: 'no-token' } });
    expect(seen).toEqual([{ folder: 'Z', suffix: '@{n}x' }]);
  });
});
