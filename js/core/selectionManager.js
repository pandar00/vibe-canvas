export class SelectionManager {
  constructor(app) {
    this.app = app;
    this.selectedElements = [];
    this._dragState = null;
    this._handleSize = 8;
  }

  // Get the first selected element (backward compat helper)
  get selectedElement() {
    return this.selectedElements[0] || null;
  }

  hasSelection() {
    return this.selectedElements.length > 0;
  }

  isSelected(element) {
    return this.selectedElements.some(el => el.id === element.id);
  }

  select(element) {
    this.selectedElements = [element];
    this.app.emit('selectionChanged', this.selectedElements);
  }

  // Add element to multi-selection (Ctrl+click)
  toggleSelect(element) {
    const idx = this.selectedElements.findIndex(el => el.id === element.id);
    if (idx >= 0) {
      this.selectedElements.splice(idx, 1);
    } else {
      this.selectedElements.push(element);
    }
    this.app.emit('selectionChanged', this.selectedElements);
  }

  deselect() {
    this.selectedElements = [];
    this.app.emit('selectionChanged', this.selectedElements);
  }

  deleteSelected() {
    if (this.selectedElements.length === 0) return;
    for (const el of this.selectedElements) {
      const layer = this.app.layerManager.findLayerOfElement(el.id);
      if (layer) layer.removeElement(el.id);
    }
    this.deselect();
  }

  // Compute unified bounding box of all selected elements
  _getGroupBounds() {
    if (this.selectedElements.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of this.selectedElements) {
      const b = el.getBounds();
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // Returns which handle (if any) is under cursor
  getHandleAt(mx, my) {
    if (this.selectedElements.length === 0) return null;
    const handles = this._getHandles();
    const hs = this._handleSize;
    for (const [name, hx, hy] of handles) {
      if (Math.abs(mx - hx) <= hs && Math.abs(my - hy) <= hs) {
        return name;
      }
    }
    return null;
  }

  // Check if point is inside any selected element
  isPointInSelection(mx, my) {
    return this.selectedElements.some(el => el.containsPoint(mx, my));
  }

  // Start a resize drag
  startResize(handle, mx, my) {
    if (this.selectedElements.length === 0) return;
    const gb = this._getGroupBounds();
    // Store original bounds for each element
    const originals = this.selectedElements.map(el => {
      const b = el.getBounds();
      return {
        el,
        origX: b.x, origY: b.y, origW: b.width, origH: b.height,
        origX1: el.x1, origY1: el.y1, origX2: el.x2, origY2: el.y2,
        origPoints: el.points ? el.points.map(p => ({ ...p })) : null,
      };
    });
    this._dragState = {
      type: 'resize',
      handle,
      startMx: mx,
      startMy: my,
      origGroupX: gb.x,
      origGroupY: gb.y,
      origGroupW: gb.width,
      origGroupH: gb.height,
      originals,
    };
  }

  // Start a move drag
  startMove(mx, my) {
    if (this.selectedElements.length === 0) return;
    const originals = this.selectedElements.map(el => ({
      el,
      origX: el.x,
      origY: el.y,
      origX1: el.x1,
      origY1: el.y1,
      origX2: el.x2,
      origY2: el.y2,
      origPoints: el.points ? el.points.map(p => ({ ...p })) : null,
    }));
    this._dragState = {
      type: 'move',
      startMx: mx,
      startMy: my,
      originals,
    };
  }

  // Process drag movement
  onDrag(mx, my) {
    if (!this._dragState || this.selectedElements.length === 0) return;
    const ds = this._dragState;
    const dx = mx - ds.startMx;
    const dy = my - ds.startMy;

    if (ds.type === 'move') {
      for (const orig of ds.originals) {
        const el = orig.el;
        if (el.type === 'line') {
          el.x1 = orig.origX1 + dx;
          el.y1 = orig.origY1 + dy;
          el.x2 = orig.origX2 + dx;
          el.y2 = orig.origY2 + dy;
          el._updateBounds();
        } else if (el.type === 'path') {
          for (let i = 0; i < el.points.length; i++) {
            el.points[i].x = orig.origPoints[i].x + dx;
            el.points[i].y = orig.origPoints[i].y + dy;
          }
          el._updateBounds();
        } else {
          el.x = orig.origX + dx;
          el.y = orig.origY + dy;
        }
      }
    } else if (ds.type === 'resize') {
      this._applyGroupResize(ds, dx, dy);
    }
  }

  endDrag() {
    this._dragState = null;
  }

  _applyGroupResize(ds, dx, dy) {
    const handle = ds.handle;
    let newGX = ds.origGroupX;
    let newGY = ds.origGroupY;
    let newGW = ds.origGroupW;
    let newGH = ds.origGroupH;

    if (handle.includes('w')) { newGX = ds.origGroupX + dx; newGW = ds.origGroupW - dx; }
    if (handle.includes('e')) { newGW = ds.origGroupW + dx; }
    if (handle.includes('n')) { newGY = ds.origGroupY + dy; newGH = ds.origGroupH - dy; }
    if (handle.includes('s')) { newGH = ds.origGroupH + dy; }

    const minSize = 10;
    if (newGW < minSize) { newGW = minSize; if (handle.includes('w')) newGX = ds.origGroupX + ds.origGroupW - minSize; }
    if (newGH < minSize) { newGH = minSize; if (handle.includes('n')) newGY = ds.origGroupY + ds.origGroupH - minSize; }

    const scaleX = ds.origGroupW > 0 ? newGW / ds.origGroupW : 1;
    const scaleY = ds.origGroupH > 0 ? newGH / ds.origGroupH : 1;

    for (const orig of ds.originals) {
      const el = orig.el;
      const relX = orig.origX - ds.origGroupX;
      const relY = orig.origY - ds.origGroupY;

      if (el.type === 'line') {
        const relX1 = orig.origX1 - ds.origGroupX;
        const relY1 = orig.origY1 - ds.origGroupY;
        const relX2 = orig.origX2 - ds.origGroupX;
        const relY2 = orig.origY2 - ds.origGroupY;
        el.x1 = newGX + relX1 * scaleX;
        el.y1 = newGY + relY1 * scaleY;
        el.x2 = newGX + relX2 * scaleX;
        el.y2 = newGY + relY2 * scaleY;
        el._updateBounds();
      } else if (el.type === 'path') {
        for (let i = 0; i < el.points.length; i++) {
          const relPX = orig.origPoints[i].x - ds.origGroupX;
          const relPY = orig.origPoints[i].y - ds.origGroupY;
          el.points[i].x = newGX + relPX * scaleX;
          el.points[i].y = newGY + relPY * scaleY;
        }
        el._updateBounds();
      } else {
        el.x = newGX + relX * scaleX;
        el.y = newGY + relY * scaleY;
        el.width = orig.origW * scaleX;
        el.height = orig.origH * scaleY;
      }
    }
  }

  _getHandles() {
    const b = this._getGroupBounds();
    if (!b) return [];
    const x = b.x, y = b.y, w = b.width, h = b.height;
    return [
      ['nw', x, y],
      ['n', x + w / 2, y],
      ['ne', x + w, y],
      ['e', x + w, y + h / 2],
      ['se', x + w, y + h],
      ['s', x + w / 2, y + h],
      ['sw', x, y + h],
      ['w', x, y + h / 2],
    ];
  }

  drawSelection(ctx) {
    if (this.selectedElements.length === 0) return;
    const b = this._getGroupBounds();
    if (!b) return;
    const pad = 4;
    const x = b.x - pad, y = b.y - pad;
    const w = b.width + pad * 2, h = b.height + pad * 2;

    ctx.save();
    ctx.strokeStyle = '#6d9eeb';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Draw handles
    const hs = this._handleSize;
    const handles = this._getHandles();
    for (const [, hx, hy] of handles) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6d9eeb';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, hs / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  getCursorForHandle(handle) {
    const cursors = {
      nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
      se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
    };
    return cursors[handle] || 'default';
  }
}
