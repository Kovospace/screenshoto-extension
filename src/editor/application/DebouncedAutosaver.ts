import type { CaptureEdits, CaptureId } from '../../shared/model/Capture';
import type { CaptureRepository } from '../../shared/persistence/CaptureRepository';
import { AUTOSAVE_DELAY_MS } from '../config/editorConfig';
import type { Autosaver } from './ports';

/** Writes the editor's state back to the stored capture, at most once per quiet period. */
export class DebouncedAutosaver implements Autosaver {
  private timer?: ReturnType<typeof setTimeout>;

  /** @param read evaluated when the write happens, so the latest state is saved */
  constructor(
    private readonly repository: CaptureRepository,
    private readonly id: CaptureId,
    private readonly read: () => CaptureEdits,
    private readonly delayMs = AUTOSAVE_DELAY_MS,
  ) {}

  schedule(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.repository.update(this.id, this.read()).catch(() => {}), this.delayMs);
  }
}
