/** Measures rendered text width (a canvas in the browser, a fake in tests). */
export interface TextMeasurer {
  width(text: string, font: string): number;
}
