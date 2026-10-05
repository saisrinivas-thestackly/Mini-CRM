const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const IMAGE_ACCEPT = ACCEPTED.join(',');

export class ImageError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

function draw(img: HTMLImageElement, maxSize: number, square: boolean, quality: number) {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (square) {
    const side = Math.min(img.width, img.height);
    sx = (img.width - side) / 2;
    sy = (img.height - side) / 2;
    sw = side;
    sh = side;
  }
  const outW = square ? Math.min(maxSize, sw) : Math.round(img.width * scale);
  const outH = square ? outW : Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Your browser could not process that image.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}

export interface ResizeOptions {
  maxSize: number;
  square?: boolean;
  quality?: number;
}

export async function readImage(file: File, { maxSize, square = false, quality = 0.8 }: ResizeOptions) {
  if (!ACCEPTED.includes(file.type)) throw new ImageError('Please choose a PNG, JPEG or WebP image.');
  if (file.size > MAX_FILE_BYTES) throw new ImageError('Images must be smaller than 10 MB.');
  const img = await loadImage(file);
  return draw(img, maxSize, square, quality);
}

export async function makeThumbnail(dataUrl: string, size = 120) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new ImageError('Could not create a thumbnail.'));
    el.src = dataUrl;
  });
  return draw(img, size, true, 0.75);
}
