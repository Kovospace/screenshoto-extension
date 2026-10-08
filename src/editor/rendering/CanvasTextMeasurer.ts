import type { TextMeasurer } from '../domain/TextMeasurer';

export class CanvasTextMeasurer implements TextMeasurer {
  private readonly ctx = document.createElement('canvas').getContext('2d')!;

  width(text: string, font: string): number {
    this.ctx.font = font;
    return this.ctx.measureText(text).width;
  }
}
