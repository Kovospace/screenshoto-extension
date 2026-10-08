import type { Annotation } from '../../shared/model/Annotation';
import type { Scale } from '../../shared/model/Capture';
import type { ImageExporter } from '../application/ports';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { SceneRenderer } from '../rendering/SceneRenderer';

/** Renders annotations onto an off-screen canvas; without annotations, returns the captured PNG untouched. */
export class CanvasImageExporter implements ImageExporter {
  constructor(
    private readonly session: LoadedCapture,
    private readonly annotations: () => readonly Annotation[],
    private readonly renderer: SceneRenderer,
  ) {}

  async render(scale: Scale): Promise<Blob> {
    const img = this.session.image(scale)!;
    const annotations = this.annotations();
    if (!annotations.length) return this.session.capture.images[scale]!;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    this.renderer.renderExport(canvas.getContext('2d')!, img, this.session.base, annotations);
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));
  }
}
