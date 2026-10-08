import { DEFAULT_EXPORT_SETTINGS, parseExportSettings, type ExportSettings, type SettingsParseResult } from '../model/ExportSettings';
import type { SettingsRepository } from './ports';

/** The current export settings: loaded once, kept in step with other tabs, changed through validation only. */
export class SettingsService {
  private value: ExportSettings = { ...DEFAULT_EXPORT_SETTINGS };

  constructor(private readonly repository: SettingsRepository) {}

  async load(): Promise<void> {
    this.value = await this.repository.load();
    this.repository.onExternalChange(s => { this.value = s; });
  }

  get current(): ExportSettings {
    return this.value;
  }

  /** Validates `input`; when valid, applies and persists it. */
  async update(input: ExportSettings): Promise<SettingsParseResult> {
    const result = parseExportSettings(input);
    if (result.ok) {
      this.value = result.settings;
      await this.repository.save(result.settings);
    }
    return result;
  }
}
