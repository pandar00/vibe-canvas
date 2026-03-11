import { CanvasManager } from './core/canvasManager.js';
import { LayerManager } from './core/layerManager.js';
import { SelectionManager } from './core/selectionManager.js';
import { ToolManager } from './core/toolManager.js';
import { Toolbar } from './ui/toolbar.js';
import { LayerPanel } from './ui/layerPanel.js';
import { PropertyPanel } from './ui/propertyPanel.js';

class App {
  constructor() {
    // Default drawing properties
    this.strokeColor = '#ffffff';
    this.fillColor = 'transparent';
    this.strokeWidth = 2;
    this.fontFamily = 'Inter';
    this.fontSize = 24;

    // Event system
    this._listeners = {};

    // Canvas element
    this.canvasEl = document.getElementById('mainCanvas');

    // Core managers
    this.layerManager = new LayerManager();
    this.selectionManager = new SelectionManager(this);
    this.toolManager = new ToolManager(this);
    this.canvasManager = new CanvasManager(this);

    // Text editing state
    this._textEditEl = null;
    this._textOverlay = null;

    // Initialize
    this._init();
  }

  _init() {
    this.canvasManager.init();

    // UI controllers
    this.toolbar = new Toolbar(this);
    this.layerPanel = new LayerPanel(this);
    this.propertyPanel = new PropertyPanel(this);

    // Canvas mouse events
    this.canvasEl.addEventListener('mousedown', (e) => this.toolManager.onMouseDown(e));
    this.canvasEl.addEventListener('mousemove', (e) => this.toolManager.onMouseMove(e));
    this.canvasEl.addEventListener('mouseup', (e) => this.toolManager.onMouseUp(e));

    // Double-click for text editing
    this.canvasEl.addEventListener('dblclick', (e) => {
      const { offsetX: mx, offsetY: my } = e;
      const hit = this.layerManager.getElementAt(mx, my);
      if (hit && hit.element.type === 'text') {
        this.selectionManager.select(hit.element);
        this.startTextEditing(hit.element);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
  }

  startTextEditing(textEl) {
    this.endTextEditing();
    this._textEditEl = textEl;

    const overlay = document.createElement('textarea');
    overlay.className = 'text-edit-overlay';
    overlay.value = textEl.text;
    overlay.style.position = 'absolute';
    overlay.style.left = `${textEl.x + this.canvasEl.offsetLeft}px`;
    overlay.style.top = `${textEl.y + this.canvasEl.offsetTop}px`;
    overlay.style.width = `${Math.max(textEl.width + 20, 120)}px`;
    overlay.style.minHeight = `${Math.max(textEl.height + 10, 40)}px`;
    overlay.style.font = `${textEl.fontWeight} ${textEl.fontSize}px "${textEl.fontFamily}", sans-serif`;
    overlay.style.color = textEl.textColor;
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.border = '1px solid rgba(99,102,241,0.6)';
    overlay.style.borderRadius = '4px';
    overlay.style.padding = '4px';
    overlay.style.outline = 'none';
    overlay.style.resize = 'both';
    overlay.style.zIndex = '100';
    overlay.style.lineHeight = '1.4';

    const canvasContainer = this.canvasEl.parentElement;
    canvasContainer.style.position = 'relative';
    canvasContainer.appendChild(overlay);
    overlay.focus();
    overlay.select();

    this._textOverlay = overlay;

    overlay.addEventListener('blur', () => {
      this.endTextEditing();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.blur();
      }
      e.stopPropagation(); // Prevent keyboard shortcuts while editing
    });
  }

  endTextEditing() {
    if (this._textOverlay && this._textEditEl) {
      this._textEditEl.text = this._textOverlay.value;
      this._textOverlay.remove();
    }
    this._textOverlay = null;
    this._textEditEl = null;
  }

  _onKeyDown(e) {
    // Don't handle shortcuts while editing text
    if (this._textOverlay) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.selectionManager.deleteSelected();
    }

    if (e.key === 'Escape') {
      this.selectionManager.deselect();
    }

    // Tool shortcuts
    const toolKeys = { v: 'select', r: 'rectangle', l: 'line', p: 'pen', t: 'text' };
    if (toolKeys[e.key] && !e.ctrlKey && !e.metaKey) {
      this.toolManager.setTool(toolKeys[e.key]);
    }
  }

  // Simple event system
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
