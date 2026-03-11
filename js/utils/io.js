import { RectangleElement } from '../elements/rectangleElement.js';
import { LineElement } from '../elements/lineElement.js';
import { PathElement } from '../elements/pathElement.js';
import { ImageElement } from '../elements/imageElement.js';
import { TextElement } from '../elements/textElement.js';

export function elementFromJSON(data) {
  switch (data.type) {
    case 'rectangle': return new RectangleElement(data);
    case 'line': return new LineElement(data);
    case 'path': return new PathElement(data);
    case 'image': return new ImageElement(data);
    case 'text': return new TextElement(data);
    default:
      console.warn('Unknown element type:', data.type);
      return null;
  }
}

export function exportToJSON(layerManager) {
  const data = layerManager.toJSON();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'graphics-studio-project.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(layerManager) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(false);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          layerManager.loadFromJSON(data, elementFromJSON);
          resolve(true);
        } catch (err) {
          console.error('Import failed:', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function importImage() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          const el = new ImageElement({
            x: 50,
            y: 50,
            width: img.naturalWidth,
            height: img.naturalHeight,
            src: evt.target.result,
          });
          // Scale down large images
          const maxDim = 500;
          if (el.width > maxDim || el.height > maxDim) {
            const ratio = Math.min(maxDim / el.width, maxDim / el.height);
            el.width = Math.round(el.width * ratio);
            el.height = Math.round(el.height * ratio);
          }
          resolve(el);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
