import { Element } from './element.js';

export class TextElement extends Element {
  constructor(props = {}) {
    super('text', props);
    this.text = props.text || 'Text';
    this.fontFamily = props.fontFamily || 'Inter';
    this.fontSize = props.fontSize || 24;
    this.fontWeight = props.fontWeight || 'normal';
    this.textColor = props.textColor || '#ffffff';
    this.textAlign = props.textAlign || 'left';
    this._updateBounds();
  }

  _updateBounds(ctx) {
    // If we have a context, measure text precisely
    if (ctx) {
      ctx.save();
      ctx.font = this._getFont();
      const metrics = ctx.measureText(this.text);
      this.width = Math.max(metrics.width, 40);
      this.height = this.fontSize * 1.4;
      ctx.restore();
    } else if (!this.width || this.width < 20) {
      // Rough estimate without context
      this.width = Math.max(this.text.length * this.fontSize * 0.6, 40);
      this.height = this.fontSize * 1.4;
    }
  }

  _getFont() {
    return `${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", sans-serif`;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.font = this._getFont();
    ctx.fillStyle = this.textColor;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = 'top';

    // Measure for accurate bounds
    const metrics = ctx.measureText(this.text);
    this.width = Math.max(metrics.width, 40);
    this.height = this.fontSize * 1.4;

    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.4;
    let totalHeight = lines.length * lineHeight;
    this.height = totalHeight;

    for (let i = 0; i < lines.length; i++) {
      let drawX = this.x;
      if (this.textAlign === 'center') drawX = this.x + this.width / 2;
      else if (this.textAlign === 'right') drawX = this.x + this.width;
      ctx.fillText(lines[i], drawX, this.y + i * lineHeight);
    }

    // Measure width as max of all lines
    let maxW = 40;
    for (const line of lines) {
      maxW = Math.max(maxW, ctx.measureText(line).width);
    }
    this.width = maxW;

    ctx.restore();
  }

  containsPoint(px, py) {
    // Generous hit area for text
    const padding = 4;
    return (
      px >= this.x - padding &&
      px <= this.x + this.width + padding &&
      py >= this.y - padding &&
      py <= this.y + this.height + padding
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      text: this.text,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      textColor: this.textColor,
      textAlign: this.textAlign,
    };
  }
}
