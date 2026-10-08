import { describe, expect, it } from 'vitest';
import { contrastingInk } from '../../../src/editor/domain/color';
import { COLORS } from '../../../src/editor/config/editorConfig';

describe('contrastingInk', () => {
  it('picks dark ink on light colours and white on dark ones', () => {
    expect(COLORS.map(contrastingInk)).toEqual(['#ffffff', '#ffffff', '#111827', '#ffffff', '#ffffff', '#ffffff', '#111827']);
  });
});
