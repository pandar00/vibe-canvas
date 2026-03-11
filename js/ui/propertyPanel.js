export class PropertyPanel {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('propertyPanel');
    this._init();
  }

  _init() {
    this.app.on('selectionChanged', () => this.render());
    this.render();
  }

  render() {
    if (!this.container) return;
    const sel = this.app.selectionManager;
    if (sel.selectedElements.length === 0) {
      this.container.innerHTML = `
        <div class="text-gray-500 text-xs text-center py-4">No element selected</div>
      `;
      return;
    }
    if (sel.selectedElements.length > 1) {
      const gb = sel._getGroupBounds();
      this.container.innerHTML = `
        <div class="space-y-3">
          <div class="text-xs text-gray-400 uppercase tracking-wider font-medium">${sel.selectedElements.length} elements</div>
          <div class="grid grid-cols-2 gap-2">
            <label class="prop-label">X<span class="prop-input bg-transparent border-none text-gray-400">${Math.round(gb.x)}</span></label>
            <label class="prop-label">Y<span class="prop-input bg-transparent border-none text-gray-400">${Math.round(gb.y)}</span></label>
            <label class="prop-label">W<span class="prop-input bg-transparent border-none text-gray-400">${Math.round(gb.width)}</span></label>
            <label class="prop-label">H<span class="prop-input bg-transparent border-none text-gray-400">${Math.round(gb.height)}</span></label>
          </div>
        </div>
      `;
      return;
    }
    const el = sel.selectedElement;

    let html = `
      <div class="space-y-3">
        <div class="text-xs text-gray-400 uppercase tracking-wider font-medium">${el.type}</div>
        <div class="grid grid-cols-2 gap-2">
          <label class="prop-label">X<input type="number" class="prop-input" data-prop="x" value="${Math.round(el.x)}"></label>
          <label class="prop-label">Y<input type="number" class="prop-input" data-prop="y" value="${Math.round(el.y)}"></label>
          <label class="prop-label">W<input type="number" class="prop-input" data-prop="width" value="${Math.round(el.width)}"></label>
          <label class="prop-label">H<input type="number" class="prop-input" data-prop="height" value="${Math.round(el.height)}"></label>
        </div>
    `;

    if (el.type === 'text') {
      html += `
        <label class="prop-label">Text
          <textarea class="prop-input h-16 resize-none" data-prop="text">${this._escapeHtml(el.text)}</textarea>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="prop-label">Font
            <select class="prop-input" data-prop="fontFamily">
              ${['Inter', 'Roboto', 'Outfit', 'Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana']
                .map(f => `<option value="${f}" ${el.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
            </select>
          </label>
          <label class="prop-label">Size
            <input type="number" class="prop-input" data-prop="fontSize" value="${el.fontSize}" min="8" max="200">
          </label>
        </div>
        <label class="prop-label">Color
          <input type="color" class="prop-color" data-prop="textColor" value="${el.textColor}">
        </label>
      `;
    } else {
      html += `
        <div class="grid grid-cols-2 gap-2">
          <label class="prop-label">Stroke
            <input type="color" class="prop-color" data-prop="strokeColor" value="${el.strokeColor}">
          </label>
          <label class="prop-label">Fill
            <input type="color" class="prop-color" data-prop="fillColor" value="${el.fillColor === 'transparent' ? '#000000' : el.fillColor}">
          </label>
        </div>
        <label class="prop-label">Stroke Width
          <input type="number" class="prop-input" data-prop="strokeWidth" value="${el.strokeWidth}" min="1" max="50">
        </label>
      `;
    }

    html += `
        <label class="prop-label">Opacity
          <input type="range" class="w-full accent-indigo-500" data-prop="opacity" value="${el.opacity}" min="0" max="1" step="0.05">
        </label>
      </div>
    `;

    this.container.innerHTML = html;

    // Bind change handlers
    this.container.querySelectorAll('[data-prop]').forEach(input => {
      const handler = (e) => {
        const prop = e.target.dataset.prop;
        let val = e.target.value;

        // Type conversion
        if (['x','y','width','height','fontSize','strokeWidth'].includes(prop)) {
          val = parseFloat(val) || 0;
        } else if (prop === 'opacity') {
          val = parseFloat(val);
        }

        el[prop] = val;

        // Special: update bounds for line/path elements
        if (el._updateBounds) el._updateBounds();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });
  }

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
