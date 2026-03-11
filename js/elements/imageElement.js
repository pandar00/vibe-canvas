import { Element } from './element.js';

export class ImageElement extends Element {
  constructor(props = {}) {
    super('image', props);
    this.src = props.src || ''; // base64 data URL
    this._img = null;
    this._loaded = false;
    if (this.src) {
      this._loadImage();
    }
  }

  _loadImage() {
    this._img = new Image();
    this._img.onload = () => {
      this._loaded = true;
      if (!this.width) this.width = this._img.naturalWidth;
      if (!this.height) this.height = this._img.naturalHeight;
    };
    this._img.src = this.src;
  }

  setImage(dataUrl, naturalWidth, naturalHeight) {
    this.src = dataUrl;
    this.width = naturalWidth;
    this.height = naturalHeight;
    this._loadImage();
  }

  draw(ctx) {
    if (!this._loaded || !this._img) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this._img, this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  toJSON() {
    return { ...super.toJSON(), src: this.src };
  }
}
