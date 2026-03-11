export class CanvasManager {
  constructor(app) {
    this.app = app;
    this.canvas = app.canvasEl;
    this.ctx = this.canvas.getContext('2d');
    this._animFrame = null;
    this._resizeObserver = null;
  }

  init() {
    this._setupSize();
    this._startRenderLoop();
  }

  _setupSize() {
    const container = this.canvas.parentElement;
    this._resizeObserver = new ResizeObserver(() => {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    });
    this._resizeObserver.observe(container);
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  _startRenderLoop() {
    const render = () => {
      this._draw();
      this._animFrame = requestAnimationFrame(render);
    };
    this._animFrame = requestAnimationFrame(render);
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw canvas grid (subtle)
    this._drawGrid(ctx, w, h);

    // Draw all layers
    this.app.layerManager.drawAll(ctx);

    // Draw selection overlay
    this.app.selectionManager.drawSelection(ctx);

    // Draw text edit cursor if active
    if (this.app._textEditEl) {
      // Handled by the overlay textarea
    }
  }

  _drawGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }
}
