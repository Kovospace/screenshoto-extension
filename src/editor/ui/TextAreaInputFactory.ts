import type { TextAnnotation } from '../../shared/model/Annotation';
import type { TextInput, TextInputFactory, TextInputListener } from '../application/ports';
import { FONT_FAMILY, TEXT_FONT_WEIGHT, TEXT_LINE_HEIGHT } from '../config/editorConfig';

/** A borderless <textarea> laid exactly over the text annotation, growing with its content. */
export class TextAreaInputFactory implements TextInputFactory {
  constructor(private readonly container: HTMLElement) {}

  open(a: TextAnnotation, zoom: number, listener: TextInputListener): TextInput {
    const ta = document.createElement('textarea');
    ta.className = 'text-edit';
    ta.value = a.text;
    ta.spellcheck = false;
    ta.wrap = 'off';
    Object.assign(ta.style, {
      left: a.x * zoom + 'px', top: a.y * zoom + 'px',
      font: `${TEXT_FONT_WEIGHT} ${a.size * zoom}px/${TEXT_LINE_HEIGHT} ${FONT_FAMILY}`, color: a.color,
    });
    const fit = () => {
      ta.style.width = '1px';
      ta.style.height = '1px';
      ta.style.width = ta.scrollWidth + 4 + 'px';
      ta.style.height = ta.scrollHeight + 'px';
    };
    ta.addEventListener('input', fit);
    this.container.append(ta);
    fit();
    ta.focus();
    ta.select();

    ta.addEventListener('keydown', e => {
      e.stopPropagation(); // editor shortcuts must not fire while typing
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        listener.onCommit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        listener.onCancel();
      }
    });
    ta.addEventListener('blur', () => listener.onCommit());
    return ta;
  }
}
