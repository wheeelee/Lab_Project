export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = 'bresenham' | 'wu';


export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v | 0));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
    hex = hex.replace(/^#/, '');
    if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b, a: alpha };
    } else if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b, a: alpha };
    } else {
        throw new Error('Invalid hex color');
    }
}

export class RasterRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private buf!: Uint8ClampedArray;
  private canvas: HTMLCanvasElement;
  private _onWindowResize: () => void;
  private lineAlg: LineAlg = 'bresenham';

  width = 0;
  height = 0;
  dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2D context');
    }
    this.ctx = ctx;
    this._onWindowResize = () => this.resize();
    window.addEventListener('resize', this._onWindowResize);
    this.resize();
  }

  dispose(): void {
    window.removeEventListener('resize', this._onWindowResize);
  }


  setLineAlgorithm(a: LineAlg): void {
    this.lineAlg = a;
  }

  getLineAlgorithm(): LineAlg {
    return this.lineAlg;
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA): void {
    if (this.lineAlg === 'wu') {
      this.drawLineWu(x0, y0, x1, y1, color);
    } else {
      this.drawLineBrassenham(x0, y0, x1, y1, color);
    }
  }


  private idx(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  setPixel(x: number, y: number, color: RGBA): void {
  if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;

  const i = this.idx(x, y);
  this.buf[i] = color.r;
  this.buf[i + 1] = color.g;
  this.buf[i + 2] = color.b;
  this.buf[i + 3] = color.a;
}

  private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1): void {
    const idx = this.idx(x, y);
    const dstR = this.buf[idx];
    const dstG = this.buf[idx + 1];
    const dstB = this.buf[idx + 2];
    const dstA = this.buf[idx + 3] / 255;
    const srcA = (color.a / 255) * alphaFactor;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0) {
      this.buf[idx] = 0;
      this.buf[idx + 1] = 0;
      this.buf[idx + 2] = 0;
      this.buf[idx + 3] = 0;
    } else {
      this.buf[idx] = clampByte(Math.round((color.r * srcA + dstR * dstA * (1 - srcA)) / outA));
      this.buf[idx + 1] = clampByte(Math.round((color.g * srcA + dstG * dstA * (1 - srcA)) / outA));
      this.buf[idx + 2] = clampByte(Math.round((color.b * srcA + dstB * dstA * (1 - srcA)) / outA));
      this.buf[idx + 3] = clampByte(Math.round(outA * 255));
    }
  }
  resize(): void {
  const dpr = window.devicePixelRatio || 1;

  const rect = this.canvas.getBoundingClientRect();
  const width = Math.floor(rect.width * dpr);
  const height = Math.floor(rect.height * dpr);

  if (this.width === width && this.height === height && this.dpr === dpr) {
    return;
  }

  this.width = width;
  this.height = height;
  this.dpr = dpr;

  this.canvas.width = width;
  this.canvas.height = height;

  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.scale(dpr, dpr);

  this.buf = new Uint8ClampedArray(width * height * 4);
  this.imageData = this.ctx.createImageData(width, height);
}

  beginFrame(clear = true): void {
  if (clear) {
    this.buf.fill(0);
  }
}

  commit(): void {
  if (!this.imageData) {
    this.imageData = this.ctx.createImageData(this.width, this.height);
  }

  this.imageData.data.set(this.buf);
  this.ctx.putImageData(this.imageData, 0, 0);
}
  drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA): void {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);

  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;

  let err = dx - dy;

  while (true) {
    this.setPixel(x0, y0, color);

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

  drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA): void {
  const ipart = (x: number) => Math.floor(x);
  const round = (x: number) => Math.round(x);
  const fpart = (x: number) => x - Math.floor(x);
  const rfpart = (x: number) => 1 - fpart(x);

  let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

  if (steep) {
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
  }

  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }

  const dx = x1 - x0;
  const dy = y1 - y0;
  const gradient = dx === 0 ? 0 : dy / dx;


  let xEnd = round(x0);
  let yEnd = y0 + gradient * (xEnd - x0);
  let xGap = rfpart(x0 + 0.5);
  let xPixel1 = xEnd;
  let yPixel1 = ipart(yEnd);

  const plot = (x: number, y: number, alpha: number) => {
    if (steep) this.blendPixel(y, x, color, alpha);
    else this.blendPixel(x, y, color, alpha);
  };


  plot(xPixel1, yPixel1, rfpart(yEnd) * xGap);
  plot(xPixel1, yPixel1 + 1, fpart(yEnd) * xGap);

  let intery = yEnd + gradient;

  
  for (let x = xEnd + 1; x < round(x1); x++) {
    let y = ipart(intery);
    plot(x, y, rfpart(intery));
    plot(x, y + 1, fpart(intery));
    intery += gradient;
  }

  let xEnd2 = round(x1);
  let yEnd2 = y1 + gradient * (xEnd2 - x1);
  let xGap2 = fpart(x1 + 0.5);
  let xPixel2 = xEnd2;
  let yPixel2 = ipart(yEnd2);

  plot(xPixel2, yPixel2, rfpart(yEnd2) * xGap2);
  plot(xPixel2, yPixel2 + 1, fpart(yEnd2) * xGap2);
}

  private drawHSpan(y: number, x0: number, x1: number, color: RGBA): void {
  if (y < 0 || y >= this.height) return;

  const start = Math.max(0, Math.min(x0, x1));
  const end = Math.min(this.width - 1, Math.max(x0, x1));

  for (let x = start; x <= end; x++) {
    this.setPixel(x, y, color);
  }
}

  fillPolygon(points: { x: number; y: number }[], color: RGBA): void {
  if (points.length < 3) return;
  let minY = Math.min(...points.map(p => p.y));
  let maxY = Math.max(...points.map(p => p.y));

  for (let y = Math.floor(minY); y <= Math.floor(maxY); y++) {
    const intersections: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
        const x =
          p1.x +
          ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y);
        intersections.push(x);
      }
    }

    intersections.sort((a, b) => a - b);

    for (let i = 0; i < intersections.length; i += 2) {
      const xStart = Math.floor(intersections[i]);
      const xEnd = Math.floor(intersections[i + 1]);

      this.drawHSpan(y, xStart, xEnd, color);
    }
  }
}

  fillCircle(cx: number, cy: number, radius: number, color: RGBA): void {
  const r2 = radius * radius;

  for (let y = -radius; y <= radius; y++) {
    const dy = y * y;
    const dx = Math.floor(Math.sqrt(r2 - dy));

    const yy = cy + y;
    const xStart = cx - dx;
    const xEnd = cx + dx;

    this.drawHSpan(yy, xStart, xEnd, color);
  }
}

  strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1): void {
    let vx = x1 - x0;
    let vy = y1 - y0;
    const len = Math.sqrt(vx * vx + vy * vy);
    let nx = -vy / len;
    let ny = vx / len;
    let p1 = { x: x0 + nx * width / 2, y: y0 + ny * width / 2 };
    let p2 = { x: x0 - nx * width / 2, y: y0 - ny * width / 2 };
    let p3 = { x: x1 - nx * width / 2, y: y1 - ny * width / 2 };
    let p4 = { x: x1 + nx * width / 2, y: y1 + ny * width / 2 };
    this.fillPolygon([p1, p2, p3, p4], color);
  }

  strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1): void {
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i];
      const p1 = points[(i + 1) % points.length];
      this.strokeLine(p0.x, p0.y, p1.x, p1.y, color, width);
    }
  }
}