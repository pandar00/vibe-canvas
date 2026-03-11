import { generateId } from '../utils/idGenerator.js';

export class Layer {
  constructor(props = {}) {
    this.id = props.id || generateId();
    this.name = props.name || 'Layer';
    this.elements = [];
    this.visible = props.visible ?? true;
  }

  addElement(element) {
    this.elements.push(element);
  }

  removeElement(elementId) {
    this.elements = this.elements.filter(el => el.id !== elementId);
  }

  getElementAt(x, y) {
    // Search in reverse so top-most elements are found first
    for (let i = this.elements.length - 1; i >= 0; i--) {
      if (this.elements[i].containsPoint(x, y)) {
        return this.elements[i];
      }
    }
    return null;
  }

  draw(ctx) {
    if (!this.visible) return;
    for (const element of this.elements) {
      element.draw(ctx);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      visible: this.visible,
      elements: this.elements.map(el => el.toJSON()),
    };
  }
}
