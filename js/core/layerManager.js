import { Layer } from '../models/layer.js';

export class LayerManager {
  constructor() {
    this.layers = [];
    this.activeLayerId = null;
    this._listeners = {};
    this._initDefault();
  }

  _initDefault() {
    const defaultLayer = new Layer({ name: 'Layer 1' });
    this.layers.push(defaultLayer);
    this.activeLayerId = defaultLayer.id;
  }

  getActiveLayer() {
    return this.layers.find(l => l.id === this.activeLayerId) || this.layers[0];
  }

  setActiveLayer(layerId) {
    if (this.layers.find(l => l.id === layerId)) {
      this.activeLayerId = layerId;
      this._emit('change');
    }
  }

  addLayer(name) {
    const index = this.layers.length + 1;
    const layer = new Layer({ name: name || `Layer ${index}` });
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    this._emit('change');
    return layer;
  }

  deleteLayer(layerId) {
    if (this.layers.length <= 1) return; // Always keep at least one
    this.layers = this.layers.filter(l => l.id !== layerId);
    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layers[0].id;
    }
    this._emit('change');
  }

  renameLayer(layerId, newName) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.name = newName;
      this._emit('change');
    }
  }

  toggleVisibility(layerId) {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this._emit('change');
    }
  }

  drawAll(ctx) {
    for (const layer of this.layers) {
      layer.draw(ctx);
    }
  }

  // Find element across all visible layers (top-most first)
  getElementAt(x, y) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (!layer.visible) continue;
      const element = layer.getElementAt(x, y);
      if (element) return { element, layer };
    }
    return null;
  }

  // Find which layer contains a given element
  findLayerOfElement(elementId) {
    for (const layer of this.layers) {
      if (layer.elements.find(el => el.id === elementId)) {
        return layer;
      }
    }
    return null;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event) {
    (this._listeners[event] || []).forEach(cb => cb());
  }

  toJSON() {
    return {
      layers: this.layers.map(l => l.toJSON()),
      activeLayerId: this.activeLayerId,
    };
  }

  loadFromJSON(data, elementFactory) {
    this.layers = data.layers.map(layerData => {
      const layer = new Layer({ id: layerData.id, name: layerData.name, visible: layerData.visible });
      layer.elements = (layerData.elements || []).map(elData => elementFactory(elData));
      return layer;
    });
    this.activeLayerId = data.activeLayerId || this.layers[0]?.id;
    this._emit('change');
  }
}
