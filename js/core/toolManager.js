import { RectangleElement } from '../elements/rectangleElement.js';
import { LineElement } from '../elements/lineElement.js';
import { PathElement } from '../elements/pathElement.js';
import { TextElement } from '../elements/textElement.js';

export class ToolManager {
  constructor(app) {
    this.app = app;
    this.currentTool = 'select';
    this._drawState = null;
    this._listeners = {};
  }

  setTool(tool) {
    this.currentTool = tool;
    this._drawState = null;
    this.app.selectionManager.deselect();
    this._emit('toolChanged', tool);
    this._updateCursor();
  }

  _updateCursor() {
    const canvas = this.app.canvasEl;
    const cursors = {
      select: 'default',
      rectangle: 'crosshair',
      line: 'crosshair',
      pen: 'crosshair',
      text: 'text',
      image: 'default',
    };
    canvas.style.cursor = cursors[this.currentTool] || 'default';
  }

  onMouseDown(e) {
    const { offsetX: mx, offsetY: my } = e;
    const layer = this.app.layerManager.getActiveLayer();

    switch (this.currentTool) {
      case 'select':
        this._handleSelectDown(mx, my, e);
        break;
      case 'rectangle':
        this._drawState = { startX: mx, startY: my, element: null };
        break;
      case 'line':
        this._drawState = { startX: mx, startY: my, element: null };
        break;
      case 'pen':
        const path = new PathElement({
          strokeColor: this.app.strokeColor,
          strokeWidth: this.app.strokeWidth,
        });
        path.addPoint(mx, my);
        layer.addElement(path);
        this._drawState = { element: path };
        break;
      case 'text':
        this._createTextElement(mx, my, layer);
        break;
    }
  }

  onMouseMove(e) {
    const { offsetX: mx, offsetY: my } = e;

    if (this.currentTool === 'select') {
      this._handleSelectMove(mx, my, e);
      return;
    }

    if (!this._drawState) return;
    const layer = this.app.layerManager.getActiveLayer();

    switch (this.currentTool) {
      case 'rectangle':
        this._handleRectangleMove(mx, my, layer);
        break;
      case 'line':
        this._handleLineMove(mx, my, layer);
        break;
      case 'pen':
        if (this._drawState.element) {
          this._drawState.element.addPoint(mx, my);
        }
        break;
    }
  }

  onMouseUp(e) {
    if (this.currentTool === 'select') {
      this.app.selectionManager.endDrag();
      return;
    }

    if (this._drawState?.element) {
      // Select the newly created element
      this.app.selectionManager.select(this._drawState.element);
      this.setTool('select');
    }
    this._drawState = null;
  }

  _handleSelectDown(mx, my, e) {
    const sel = this.app.selectionManager;
    const ctrlKey = e.ctrlKey || e.metaKey;

    // Check if clicking a handle
    const handle = sel.getHandleAt(mx, my);
    if (handle) {
      sel.startResize(handle, mx, my);
      return;
    }

    // Check if clicking on a currently selected element (for move)
    if (sel.hasSelection() && sel.isPointInSelection(mx, my)) {
      sel.startMove(mx, my);
      return;
    }

    // Try to find element under cursor
    const hit = this.app.layerManager.getElementAt(mx, my);
    if (hit) {
      if (ctrlKey) {
        // Ctrl+click: toggle element in/out of multi-selection
        sel.toggleSelect(hit.element);
      } else {
        sel.select(hit.element);
      }
      if (sel.hasSelection()) {
        sel.startMove(mx, my);
      }
    } else {
      if (!ctrlKey) {
        sel.deselect();
      }
    }
  }

  _handleSelectMove(mx, my, e) {
    const sel = this.app.selectionManager;

    if (sel._dragState) {
      sel.onDrag(mx, my);
      return;
    }

    // Update cursor based on handle hover
    const handle = sel.getHandleAt(mx, my);
    if (handle) {
      this.app.canvasEl.style.cursor = sel.getCursorForHandle(handle);
    } else if (sel.hasSelection() && sel.isPointInSelection(mx, my)) {
      this.app.canvasEl.style.cursor = 'move';
    } else {
      this.app.canvasEl.style.cursor = 'default';
    }
  }

  _handleRectangleMove(mx, my, layer) {
    const ds = this._drawState;
    if (!ds.element) {
      ds.element = new RectangleElement({
        x: ds.startX,
        y: ds.startY,
        width: 0,
        height: 0,
        strokeColor: this.app.strokeColor,
        fillColor: this.app.fillColor,
        strokeWidth: this.app.strokeWidth,
      });
      layer.addElement(ds.element);
    }
    // Support drawing in any direction
    const x = Math.min(mx, ds.startX);
    const y = Math.min(my, ds.startY);
    ds.element.x = x;
    ds.element.y = y;
    ds.element.width = Math.abs(mx - ds.startX);
    ds.element.height = Math.abs(my - ds.startY);
  }

  _handleLineMove(mx, my, layer) {
    const ds = this._drawState;
    if (!ds.element) {
      ds.element = new LineElement({
        x1: ds.startX, y1: ds.startY,
        x2: mx, y2: my,
        strokeColor: this.app.strokeColor,
        strokeWidth: this.app.strokeWidth,
      });
      layer.addElement(ds.element);
    } else {
      ds.element.x2 = mx;
      ds.element.y2 = my;
      ds.element._updateBounds();
    }
  }

  _createTextElement(mx, my, layer) {
    const textEl = new TextElement({
      x: mx,
      y: my,
      textColor: this.app.strokeColor,
      fontFamily: this.app.fontFamily,
      fontSize: this.app.fontSize,
    });
    layer.addElement(textEl);
    this.app.selectionManager.select(textEl);

    // Trigger inline editing
    this.app.startTextEditing(textEl);
    this.setTool('select');
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }
}
