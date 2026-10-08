import { CAPTURE_RETENTION_MS, SCALES, type Capture, type CaptureId, type Scale } from '../../shared/model/Capture';
import type { PageRect } from '../../shared/model/Geometry';
import type { CaptureRepository } from '../../shared/persistence/CaptureRepository';
import type { EditorLauncher, PageRenderer, PickedElementLocator, SourceTab, StatusIndicator } from './ports';

export interface CaptureServiceDeps {
  renderer: PageRenderer;
  elementLocator: PickedElementLocator;
  repository: CaptureRepository;
  indicator: StatusIndicator;
  editor: EditorLauncher;
  newId?: () => CaptureId;
  now?: () => number;
}

/**
 * The capture use case: render the selected region at every scale, store it, open the editor.
 *
 * A scale Chrome cannot render (typically 4× of a huge region exceeding the maximum texture
 * size) is recorded in `failed` instead of failing the capture; only "no scale at all" is an error.
 */
export class CaptureService {
  private readonly newId: () => CaptureId;
  private readonly now: () => number;

  constructor(private readonly deps: CaptureServiceDeps) {
    this.newId = deps.newId ?? (() => crypto.randomUUID());
    this.now = deps.now ?? Date.now;
  }

  /**
   * @param rect      selected region in page CSS pixels
   * @param isElement true when an element was picked: it is re-measured before every shot,
   *                  because the debugger info bar or DPR media queries can shift layout
   */
  async capture(tab: SourceTab, rect: PageRect, isElement: boolean): Promise<void> {
    const { renderer, elementLocator, repository, indicator, editor } = this.deps;
    await indicator.showBusy(tab.id);

    const images: Capture['images'] = {};
    const failed: Scale[] = [];
    const session = await renderer.attach(tab.id);
    try {
      for (const scale of SCALES) {
        await session.setDeviceScale(scale);
        await session.settle();
        if (isElement) rect = (await elementLocator.locate(tab.id)) ?? rect;
        try {
          images[scale] = await session.screenshot(rect);
        } catch (e) {
          console.warn(`scale ${scale}x failed`, e);
          failed.push(scale);
        }
      }
    } finally {
      await session.detach();
    }

    if (!Object.keys(images).length) throw new Error('no image could be captured');

    const id = this.newId();
    await repository.save(id, { images, failed, rect, url: tab.url, title: tab.title, time: this.now() });
    repository.deleteOlderThan(CAPTURE_RETENTION_MS).catch(() => {});
    await indicator.clear(tab.id);
    await editor.open(id, tab);
  }
}
