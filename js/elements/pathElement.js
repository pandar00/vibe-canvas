import { Element } from './element.js';

export class PathElement extends Element {
  constructor(props = {}) {
    super('path', props);
    this.points = props.points || [];
    this._updateBounds();
  }

  addPoint(x, y) {
    this.points.push({ x, y });
    this._updateBounds();
  }

  _updateBounds() {
    if (this.points.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  draw(ctx) {
    if (this.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    // Smooth curve through points using quadratic interpolation
    for (let i = 1; i < this.points.length - 1; i++) {
      const midX = (this.points[i].x + this.points[i + 1].x) / 2;
      const midY = (this.points[i].y + this.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, midX, midY);
    }
    // Final segment
    const last = this.points[this.points.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  containsPoint(px, py) {
    const threshold = Math.max(this.strokeWidth, 8);
    for (let i = 1; i < this.points.length; i++) {
      const dist = this._distToSegment(
        px, py,
        this.points[i - 1].x, this.points[i - 1].y,
        this.points[i].x, this.points[i].y
      );
      if (dist <= threshold) return true;
    }
    return false;
  }

  _distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  toJSON() {
    return { ...super.toJSON(), points: [...this.points] };
  }
}
