import { useEffect } from 'react';
import { hashHue } from '../util';

// LUZ AMBIENTAL
// La sala se tiñe con el color de lo que están por ver, como la luz de una
// tele en un cuarto a oscuras. El tono sale del póster cuando se puede leer;
// si no (sin red, o el servidor no permite leer el lienzo), cae a un tono
// estable derivado del título, que siempre es el mismo para cada película.
//
// Solo exponemos el TONO, nunca el color crudo: la saturación y la luz las
// fija el CSS. Así el color del póster no puede arruinar el contraste del
// texto, que es el riesgo clásico de tomar color de una imagen.

// La sala siempre es cálida. El color de la película decide DÓNDE cae
// dentro de la banda magenta→rosa→durazno→oro, no si se sale de ella.
// Sin esto, un póster verde dejaba la sala color pantano.
const WARM_START = 288;
const WARM_RANGE = 112;

function warm(hue: number) {
  return Math.round(WARM_START + (((hue % 360) + 360) % 360) / 360 * WARM_RANGE);
}

const DEFAULT_HUE = warm(318);

export function hueFromTitle(title: string) {
  return warm(hashHue(title));
}

function dominantHue(d: Uint8ClampedArray): number | null {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  if (!n) return null;
  r /= n * 255; g /= n * 255; b /= n * 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), c = max - min;
  if (c < 0.04) return null; // gris: no hay tono que valga la pena
  let h: number;
  if (max === r) h = ((g - b) / c) % 6;
  else if (max === g) h = (b - r) / c + 2;
  else h = (r - g) / c + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

export function setAmbientHue(hue: number) {
  document.documentElement.style.setProperty('--hue', String(hue));
}

/** Tiñe la sala mientras el componente esté montado. */
export function useAmbient(title: string | null | undefined, posterUrl: string | null) {
  useEffect(() => {
    if (!title) { setAmbientHue(DEFAULT_HUE); return; }
    setAmbientHue(hueFromTitle(title));
    if (!posterUrl) return;

    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 10;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 10, 10);
        const hue = dominantHue(ctx.getImageData(0, 0, 10, 10).data);
        if (hue != null && alive) setAmbientHue(warm(hue));
      } catch {
        // Lienzo contaminado: nos quedamos con el tono del título.
      }
    };
    img.src = posterUrl;
    return () => { alive = false; };
  }, [title, posterUrl]);
}
