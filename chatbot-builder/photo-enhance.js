// Makes an owner's item photo look like a shopping-app photo before it is saved:
// the right way up, centred on a square white canvas with a little space around
// the item, and brightened a little when the photo is dark or flat. All of it
// runs on the owner's phone. It cannot remove a cluttered background (that
// needs AI image editing) and it never changes the item itself.

const SIZE = 1000;       // square size in pixels
const PADDING = 0.06;    // white space around the photo, as a share of the size
const SAMPLE_STEP = 7;   // look at every 7th pixel when measuring light

function readBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Stretches the light range and lifts dark photos, only as much as needed.
function autoLevels(context, x, y, width, height) {
  const picture = context.getImageData(x, y, width, height);
  const px = picture.data;
  const histogram = new Uint32Array(256);
  let total = 0;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4 * SAMPLE_STEP) {
    const light = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    histogram[light] += 1; total += 1; sum += light;
  }
  if (!total) return;
  const mean = sum / total;
  const percentile = (share) => { let running = 0; for (let v = 0; v < 256; v += 1) { running += histogram[v]; if (running >= total * share) return v; } return 255; };
  // Never move the black point far: a dark photo with a big dark background must not turn pure black.
  const low = Math.min(percentile(0.01), 12);
  const high = percentile(0.99);
  const range = Math.max(1, high - low);
  // Flat photos get stretched (at most 1.7x); photos that already use the full range are left alone.
  const stretch = Math.min(1.7, 255 / range);
  const gamma = mean < 95 ? Math.max(0.7, 0.85 - (95 - mean) / 400) : 1; // below 1 brightens
  if (stretch < 1.05 && gamma === 1) return;
  const table = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v += 1) {
    const stretched = Math.min(1, Math.max(0, ((v - low) * stretch) / 255));
    table[v] = Math.round(255 * Math.pow(stretched, gamma));
  }
  for (let i = 0; i < px.length; i += 4) { px[i] = table[px[i]]; px[i + 1] = table[px[i + 1]]; px[i + 2] = table[px[i + 2]]; }
  context.putImageData(picture, x, y);
}

// source: a File/Blob, or { mimeType, data } (base64) as used by the update chat.
// Returns { mimeType: 'image/jpeg', data } (base64). On any problem the original is returned.
export async function enhanceProductPhoto(source) {
  try {
    let blob = source;
    if (source && typeof source.data === 'string') {
      const bytes = Uint8Array.from(atob(source.data), (c) => c.charCodeAt(0));
      blob = new Blob([bytes], { type: source.mimeType || 'image/jpeg' });
    }
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, SIZE, SIZE);
    const room = SIZE * (1 - 2 * PADDING);
    const scale = Math.min(room / bitmap.width, room / bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const x = Math.round((SIZE - width) / 2);
    const y = Math.round((SIZE - height) / 2);
    context.drawImage(bitmap, x, y, width, height);
    bitmap.close?.();
    autoLevels(context, x, y, width, height);
    const out = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!out) throw new Error('no image');
    return { mimeType: 'image/jpeg', data: await readBase64(out) };
  } catch {
    if (source && typeof source.data === 'string') return source;
    return null; // caller falls back to its normal photo preparation
  }
}
