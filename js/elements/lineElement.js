import { Element } from './element.js';

export class LineElement extends Element {
  constructor(props = {}) {
    super('line', props);
    this.x1 = props.x1 || 0;
    this.y1 = props.y1 || 0;
    this.x2 = props.x2 || 0;
    this.y2 = props.y2 || 0;
    this._updateBounds();
  }

  _updateBounds() {
    this.x = Math.min(this.x1, this.x2);
    this.y = Math.min(this.y1, this.y2);
    this.width = Math.abs(this.x2 - this.x1);
    this.height = Math.abs(this.y2 - this.y1);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  containsPoint(px, py) {
    const threshold = Math.max(this.strokeWidth, 8);
    return this._distToSegment(px, py) <= threshold;
  }

  _distToSegment(px, py) {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - this.x1, py - this.y1);
    let t = ((px - this.x1) * dx + (py - this.y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = this.x1 + t * dx;
    const closestY = this.y1 + t * dy;
    return Math.hypot(px - closestX, py - closestY);
  }

  // Override move behavior — lines use absolute endpoints
  moveTo(dx, dy) {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
    this._updateBounds();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      x1: this.x1, y1: this.y1,
      x2: this.x2, y2: this.y2,
    };
  }
}
