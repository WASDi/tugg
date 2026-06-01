/** Thin wrapper around DOM creation so entity classes stay declarative. */
export class DOMManager {
  private readonly root: HTMLElement;

  constructor(rootId: string) {
    const el = document.getElementById(rootId);
    if (!el) throw new Error(`Root element #${rootId} not found`);
    this.root = el;
  }

  get gameRoot(): HTMLElement {
    return this.root;
  }

  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    classes: string[] = [],
    styles: Partial<CSSStyleDeclaration> = {},
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    Object.assign(el.style, styles);
    return el;
  }

  createImg(src: string, classes: string[] = []): HTMLImageElement {
    const img = this.createElement('img', classes);
    img.src = src;
    img.draggable = false; // interact.js handles dragging
    return img;
  }

  appendToRoot(el: HTMLElement): void {
    this.root.appendChild(el);
  }
}
