/*
 * Annotations as they are stored inside a capture.
 *
 * All geometry is in 1× (CSS pixel) units, so an annotation renders identically at every scale.
 * The short field names (w, r, n) are the persisted format of captures already in IndexedDB —
 * renaming them would orphan the annotations of every stored capture.
 */

/** Shapes defined by two corner/end points. */
export interface TwoPointAnnotation {
  type: 'rect' | 'ellipse' | 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  /** Stroke width. */
  w: number;
}

export interface TextAnnotation {
  type: 'text';
  /** Top-left corner of the first line. */
  x: number;
  y: number;
  /** May contain '\n'. */
  text: string;
  color: string;
  /** Font size. */
  size: number;
}

export interface StepAnnotation {
  type: 'step';
  /** Centre of the marker. */
  x: number;
  y: number;
  /** The number shown in the marker. */
  n: number;
  color: string;
  /** Radius. */
  r: number;
}

export type Annotation = TwoPointAnnotation | TextAnnotation | StepAnnotation;
export type AnnotationType = Annotation['type'];
export type TwoPointType = TwoPointAnnotation['type'];

export const isTwoPoint = (a: Annotation): a is TwoPointAnnotation => 'x1' in a;
