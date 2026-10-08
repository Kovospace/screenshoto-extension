import type { SettingsRepository } from '../application/ports';
import { sanitizeStoredSettings, type ExportSettings } from '../model/ExportSettings';

/** Settings in chrome.storage.sync, so they follow the user's Chrome profile. The key is a persisted format. */
export class ChromeStorageSettingsRepository implements SettingsRepository {
  static readonly KEY = 'exportSettings';

  constructor(private readonly area: chrome.storage.StorageArea = chrome.storage.sync) {}

  async load(): Promise<ExportSettings> {
    const stored = await this.area.get(ChromeStorageSettingsRepository.KEY);
    return sanitizeStoredSettings(stored[ChromeStorageSettingsRepository.KEY]);
  }

  async save(settings: ExportSettings): Promise<void> {
    await this.area.set({ [ChromeStorageSettingsRepository.KEY]: settings });
  }

  onExternalChange(listener: (settings: ExportSettings) => void): void {
    this.area.onChanged.addListener(changes => {
      const change = changes[ChromeStorageSettingsRepository.KEY];
      if (change) listener(sanitizeStoredSettings(change.newValue));
    });
  }
}
