import { generateId } from '../utils/idGenerator.js';

export class Element {
  constructor(type, props = {}) {
    this.id = props.id || generateId();
    this.type = type;
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.width = props.width || 0;
    this.height = props.height || 0;
    this.rotation = props.rotation || 0;
    this.strokeColor = props.strokeColor || '#ffffff';
    this.fillColor = props.fillColor || 'transparent';
    this.strokeWidth = props.strokeWidth || 2;
    this.opacity = props.opacity ?? 1;
  }

  draw(ctx) {
    // Override in subclasses
  }

  containsPoint(px, py) {
    const b = this.getBounds();
    return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      strokeColor: this.strokeColor,
      fillColor: this.fillColor,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity,
    };
  }
}
