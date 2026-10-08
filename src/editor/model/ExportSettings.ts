/** Where and under which name images are saved. Persisted in chrome.storage.sync — do not rename fields. */
export interface ExportSettings {
  /** Folder inside the user's Downloads folder, '/'-separated; '' = Downloads itself. */
  folder: string;
  /** Appended to every file name before `.png`; `{n}` is replaced by the scale. */
  suffix: string;
}

export const SCALE_TOKEN = '{n}';

export const DEFAULT_EXPORT_SETTINGS: Readonly<ExportSettings> = { folder: 'Screenshoto Web', suffix: '@{n}x' };

export type SettingsErrors = Partial<Record<keyof ExportSettings, string>>;

export type SettingsParseResult =
  | { ok: true; settings: ExportSettings }
  | { ok: false; errors: SettingsErrors };

/** Characters Windows, macOS or Linux refuse in file and folder names (plus control characters). */
// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[<>:"|?*\u0000-\u001f]/;
const FORBIDDEN_LIST = '< > : " | ? *';

/**
 * Validates what the user typed and normalises it (trimmed, `\` → `/`, no empty segments).
 * Chrome only lets extensions save inside the Downloads folder, so absolute paths are refused
 * rather than silently turned into sub-folders.
 */
export function parseExportSettings(input: { folder: string; suffix: string }): SettingsParseResult {
  const errors: SettingsErrors = {};

  const rawFolder = input.folder.trim().replace(/\\/g, '/');
  const segments = rawFolder.split('/').map(s => s.trim()).filter(Boolean);
  if (/^(\/|~)/.test(rawFolder) || /^[a-z]:/i.test(rawFolder)) {
    errors.folder = 'Must be a folder inside Downloads — Chrome does not let extensions save anywhere else.';
  } else if (segments.some(s => s === '.' || s === '..')) {
    errors.folder = 'The folder names “.” and “..” are not allowed.';
  } else if (segments.some(s => FORBIDDEN.test(s))) {
    errors.folder = `Not allowed in folder names: ${FORBIDDEN_LIST}`;
  } else if (segments.some(s => s.endsWith('.'))) {
    errors.folder = 'Folder names cannot end with a dot.';
  }

  const suffix = input.suffix.trim();
  if (!suffix.includes(SCALE_TOKEN)) {
    errors.suffix = `Must contain ${SCALE_TOKEN} (the scale), or “Save all” would give four files the same name.`;
  } else if (/[/\\]/.test(suffix) || FORBIDDEN.test(suffix)) {
    errors.suffix = `Not allowed in file names: / \\ ${FORBIDDEN_LIST}`;
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, settings: { folder: segments.join('/'), suffix } };
}

/** Settings read back from storage: anything missing or invalid falls back to the default, field by field. */
export function sanitizeStoredSettings(stored: unknown): ExportSettings {
  const s = (stored ?? {}) as Partial<ExportSettings>;
  const field = <K extends keyof ExportSettings>(key: K): string => {
    const value = typeof s[key] === 'string' ? s[key] : DEFAULT_EXPORT_SETTINGS[key];
    const parsed = parseExportSettings({ ...DEFAULT_EXPORT_SETTINGS, [key]: value });
    return parsed.ok ? parsed.settings[key] : DEFAULT_EXPORT_SETTINGS[key];
  };
  return { folder: field('folder'), suffix: field('suffix') };
}

/** "Downloads/…" as shown to the user. */
export function downloadLocation(settings: ExportSettings): string {
  return settings.folder ? `Downloads/${settings.folder}` : 'Downloads';
}
