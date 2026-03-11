export class LayerPanel {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('layerList');
    this.addBtn = document.getElementById('addLayerBtn');
    this._init();
  }

  _init() {
    this.addBtn?.addEventListener('click', () => {
      this.app.layerManager.addLayer();
    });

    this.app.layerManager.on('change', () => this.render());
    this.app.on('selectionChanged', () => this.render());
    this.render();
  }

  render() {
    if (!this.container) return;
    const lm = this.app.layerManager;
    this.container.innerHTML = '';

    // Render layers in reverse order (top-most layer first in UI)
    const reversed = [...lm.layers].reverse();
    for (const layer of reversed) {
      const isActive = layer.id === lm.activeLayerId;
      const div = document.createElement('div');
      div.className = `layer-item group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
        ${isActive ? 'bg-indigo-500/20 border border-indigo-500/40' : 'bg-white/5 border border-transparent hover:bg-white/10'}`;

      div.innerHTML = `
        <button class="visibility-btn flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs transition-colors
          ${layer.visible ? 'text-indigo-300 hover:text-indigo-200' : 'text-gray-600 hover:text-gray-400'}"
          title="${layer.visible ? 'Hide layer' : 'Show layer'}">
          ${layer.visible ? this._eyeIcon() : this._eyeOffIcon()}
        </button>
        <span class="layer-name flex-1 text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}">${this._escapeHtml(layer.name)}</span>
        <span class="text-[10px] text-gray-500 flex-shrink-0">${layer.elements.length}</span>
        ${lm.layers.length > 1 ? `
          <button class="delete-layer-btn opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Delete layer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        ` : ''}
      `;

      // Click to set active
      div.addEventListener('click', (e) => {
        if (e.target.closest('.visibility-btn') || e.target.closest('.delete-layer-btn')) return;
        lm.setActiveLayer(layer.id);
      });

      // Double-click to rename
      const nameSpan = div.querySelector('.layer-name');
      nameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this._startRename(nameSpan, layer);
      });

      // Visibility toggle
      div.querySelector('.visibility-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        lm.toggleVisibility(layer.id);
      });

      // Delete
      div.querySelector('.delete-layer-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        lm.deleteLayer(layer.id);
      });

      this.container.appendChild(div);
    }
  }

  _startRename(span, layer) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = layer.name;
    input.className = 'bg-black/40 text-white text-sm px-1 py-0 rounded outline-none border border-indigo-500/50 w-full';
    span.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      const newName = input.value.trim() || layer.name;
      this.app.layerManager.renameLayer(layer.id, newName);
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commit(); input.blur(); }
      if (e.key === 'Escape') { input.value = layer.name; input.blur(); }
    });
  }

  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _eyeIcon() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  _eyeOffIcon() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  }
}
