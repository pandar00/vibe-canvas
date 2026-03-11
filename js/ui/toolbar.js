export class Toolbar {
  constructor(app) {
    this.app = app;
    this._init();
  }

  _init() {
    // Tool buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        this.app.toolManager.setTool(tool);
        this._updateActiveButton(tool);
      });
    });

    // Color inputs
    const strokeInput = document.getElementById('strokeColor');
    const fillInput = document.getElementById('fillColor');
    if (strokeInput) {
      strokeInput.value = this.app.strokeColor;
      strokeInput.addEventListener('input', (e) => {
        this.app.strokeColor = e.target.value;
        this._updateSelectedElementColor();
      });
    }
    if (fillInput) {
      fillInput.value = this.app.fillColor;
      fillInput.addEventListener('input', (e) => {
        this.app.fillColor = e.target.value;
        this._updateSelectedElementColor();
      });
    }

    // Stroke width
    const strokeWidthInput = document.getElementById('strokeWidth');
    if (strokeWidthInput) {
      strokeWidthInput.value = this.app.strokeWidth;
      strokeWidthInput.addEventListener('input', (e) => {
        this.app.strokeWidth = parseInt(e.target.value) || 2;
      });
    }

    // Font family
    const fontFamilySelect = document.getElementById('fontFamily');
    if (fontFamilySelect) {
      fontFamilySelect.value = this.app.fontFamily;
      fontFamilySelect.addEventListener('change', (e) => {
        this.app.fontFamily = e.target.value;
        this._updateSelectedElementFont();
      });
    }

    // Font size
    const fontSizeInput = document.getElementById('fontSize');
    if (fontSizeInput) {
      fontSizeInput.value = this.app.fontSize;
      fontSizeInput.addEventListener('input', (e) => {
        this.app.fontSize = parseInt(e.target.value) || 24;
        this._updateSelectedElementFont();
      });
    }

    // Export/Import
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      import('../utils/io.js').then(({ exportToJSON }) => {
        exportToJSON(this.app.layerManager);
      });
    });

    document.getElementById('importBtn')?.addEventListener('click', () => {
      import('../utils/io.js').then(({ importFromJSON }) => {
        importFromJSON(this.app.layerManager);
      });
    });

    // Image upload
    document.getElementById('imageBtn')?.addEventListener('click', () => {
      import('../utils/io.js').then(({ importImage }) => {
        importImage().then(el => {
          if (el) {
            const layer = this.app.layerManager.getActiveLayer();
            layer.addElement(el);
            this.app.selectionManager.select(el);
            this.app.toolManager.setTool('select');
          }
        });
      });
    });

    // Delete
    document.getElementById('deleteBtn')?.addEventListener('click', () => {
      this.app.selectionManager.deleteSelected();
    });

    // Listen for tool changes
    this.app.toolManager.on('toolChanged', (tool) => {
      this._updateActiveButton(tool);
    });

    // Set initial active
    this._updateActiveButton('select');
  }

  _updateActiveButton(activeTool) {
    document.querySelectorAll('[data-tool]').forEach(btn => {
      const isActive = btn.dataset.tool === activeTool;
      btn.classList.toggle('ring-2', isActive);
      btn.classList.toggle('ring-indigo-400', isActive);
      btn.classList.toggle('bg-white/20', isActive);
    });
  }

  _updateSelectedElementColor() {
    for (const el of this.app.selectionManager.selectedElements) {
      if (el.type === 'text') {
        el.textColor = this.app.strokeColor;
      } else {
        el.strokeColor = this.app.strokeColor;
        el.fillColor = this.app.fillColor;
      }
    }
  }

  _updateSelectedElementFont() {
    for (const el of this.app.selectionManager.selectedElements) {
      if (el.type !== 'text') continue;
      el.fontFamily = this.app.fontFamily;
      el.fontSize = this.app.fontSize;
    }
  }
}
