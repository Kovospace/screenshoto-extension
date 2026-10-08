import { exportFileName } from '../application/fileName';
import type { SettingsService } from '../application/SettingsService';
import { DEFAULT_EXPORT_SETTINGS, parseExportSettings, type ExportSettings } from '../model/ExportSettings';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { EditorState } from '../model/EditorState';
import type { Notifier } from '../application/ports';

/**
 * The ⚙ settings dialog: save folder and file-name suffix, validated as you type, with a preview
 * of the file name the current capture would get. Saving applies to all editor tabs.
 */
export class SettingsDialog {
  private readonly dialog: HTMLDialogElement;
  private readonly folder: HTMLInputElement;
  private readonly suffix: HTMLInputElement;
  private readonly saveButton: HTMLButtonElement;

  constructor(
    private readonly settings: SettingsService,
    private readonly session: LoadedCapture,
    private readonly state: EditorState,
    private readonly notifier: Notifier,
    private readonly doc: Document = document,
  ) {
    // Looked up here, not in field initialisers: those run before `doc` is assigned.
    this.dialog = this.$('settings');
    this.folder = this.$('setFolder');
    this.suffix = this.$('setSuffix');
    this.saveButton = this.$('setSave');
  }

  private $<T extends HTMLElement>(id: string): T {
    return this.doc.getElementById(id) as T;
  }

  bind(opener: HTMLElement): void {
    opener.onclick = () => this.open();
    this.folder.addEventListener('input', () => this.validate());
    this.suffix.addEventListener('input', () => this.validate());
    this.$('setDefaults').onclick = () => this.fill(DEFAULT_EXPORT_SETTINGS);
    this.$('setCancel').onclick = () => this.dialog.close();
    this.$<HTMLFormElement>('settingsForm').addEventListener('submit', e => {
      e.preventDefault();
      this.save();
    });
  }

  open(): void {
    this.fill(this.settings.current);
    this.dialog.showModal();
    this.folder.focus();
  }

  private fill(s: ExportSettings): void {
    this.folder.value = s.folder;
    this.suffix.value = s.suffix;
    this.validate();
  }

  private input(): ExportSettings {
    return { folder: this.folder.value, suffix: this.suffix.value };
  }

  /** Shows errors and the preview; returns whether the input can be saved. */
  private validate(): boolean {
    const result = parseExportSettings(this.input());
    const errors = result.ok ? {} : result.errors;
    this.showError(this.folder, 'setFolderError', errors.folder);
    this.showError(this.suffix, 'setSuffixError', errors.suffix);
    this.saveButton.disabled = !result.ok;
    if (result.ok) this.$('setPreview').textContent = 'Downloads/' + exportFileName(this.session.capture, this.state.scale, result.settings);
    return result.ok;
  }

  private showError(input: HTMLInputElement, errorId: string, message: string | undefined): void {
    input.parentElement!.classList.toggle('invalid', !!message);
    this.$(errorId).textContent = message ?? '';
  }

  private async save(): Promise<void> {
    if (!this.validate()) return;
    const result = await this.settings.update(this.input());
    if (result.ok) {
      this.dialog.close();
      this.notifier.toast('Settings saved');
    }
  }
}
