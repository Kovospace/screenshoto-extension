import { beforeEach, describe, expect, it } from 'vitest';
import { ElementTrail } from '../../src/picker/ElementTrail';

describe('ElementTrail', () => {
  let trail: ElementTrail;
  let leaf: Element, mid: Element, top: Element;

  beforeEach(() => {
    document.body.innerHTML = '<section id="top"><div id="mid"><span id="leaf">x</span></div></section><p id="other"></p>';
    [leaf, mid, top] = ['#leaf', '#mid', '#top'].map(s => document.querySelector(s)!);
    trail = new ElementTrail(document);
  });

  it('walks up to ancestors and back down the same path', () => {
    trail.hover(leaf);
    expect(trail.up()).toBe(true);
    expect(trail.element).toBe(mid);
    trail.up();
    expect(trail.element).toBe(top);
    expect(trail.down()).toBe(true);
    expect(trail.element).toBe(mid);
    trail.down();
    expect(trail.element).toBe(leaf);
    expect(trail.down()).toBe(false);
  });

  it('stops at <body>', () => {
    trail.hover(top);
    expect(trail.up()).toBe(true);
    expect(trail.element).toBe(document.body);
    expect(trail.up()).toBe(false);
    expect(trail.element).toBe(document.body);
  });

  it('keeps the walked-up element while the pointer stays on the same element', () => {
    trail.hover(leaf);
    trail.up();
    trail.hover(leaf);
    expect(trail.element).toBe(mid);
  });

  it('starts over when another element is hovered', () => {
    trail.hover(leaf);
    trail.up();
    trail.hover(document.querySelector('#other'));
    expect(trail.down()).toBe(false);
    trail.hover(null);
    expect(trail.element?.id).toBe('other');
  });
});
