import { Element } from './element.js';

export class RectangleElement extends Element {
  constructor(props = {}) {
    super('rectangle', props);
    this.borderRadius = props.borderRadius || 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    if (this.borderRadius > 0) {
      ctx.roundRect(this.x, this.y, this.width, this.height, this.borderRadius);
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
    }
    if (this.fillColor && this.fillColor !== 'transparent') {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    if (this.strokeColor && this.strokeColor !== 'transparent') {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  toJSON() {
    return { ...super.toJSON(), borderRadius: this.borderRadius };
  }
}
