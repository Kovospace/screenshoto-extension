import { SCALES, type Capture, type CaptureId, type Scale } from '../../shared/model/Capture';
import { DEFAULTS } from '../config/editorConfig';

/** Size of the captured region in 1× units. */
export interface BaseSize {
  w: number;
  h: number;
}

/** A capture opened in the editor: the stored record plus its decoded images. */
export class LoadedCapture {
  readonly scales: readonly Scale[];
  readonly base: BaseSize;

  constructor(
    readonly id: CaptureId,
    readonly capture: Capture,
    private readonly images: Partial<Record<Scale, HTMLImageElement>>,
  ) {
    this.scales = SCALES.filter(s => images[s]);
    const s0 = this.scales[0];
    const img = images[s0]!;
    this.base = { w: img.naturalWidth / s0, h: img.naturalHeight / s0 };
  }

  image(scale: Scale): HTMLImageElement | undefined {
    return this.images[scale];
  }

  has(scale: Scale): boolean {
    return !!this.images[scale];
  }

  /** The scale the editor opens at: the last one used, else 2×, else the smallest available. */
  initialScale(): Scale {
    const last = this.capture.lastScale;
    if (last && this.has(last)) return last;
    return this.has(DEFAULTS.scale) ? DEFAULTS.scale : this.scales[0];
  }
}
