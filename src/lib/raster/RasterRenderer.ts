export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = "bresenham" | "wu";

export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v | 0));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
  hex = hex.replace(/^#/, "");

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: alpha,
    };
  }

  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: alpha,
    };
  }

  return { r: 0, g: 0, b: 0, a: alpha };
}

export class RasterRenderer {
  private ctx: CanvasRenderingContext2D;
  private alg: LineAlg = "bresenham";

  width = 0;
  height = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;
    this.resize();
  }

  setLineAlgorithm(alg: LineAlg) {
    this.alg = alg;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;

    this.width = this.canvas.clientWidth * dpr;
    this.height = this.canvas.clientHeight * dpr;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  beginFrame(clear = true) {
    if (clear) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  commit() {
  }

  dispose() {
  }


  strokeLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: RGBA,
    width: number
  ) {
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  fillPolygon(points: { x: number; y: number }[], color: RGBA) {
    this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
    this.ctx.beginPath();

    const first = points[0];
    this.ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  strokePolygon(
    points: { x: number; y: number }[],
    color: RGBA,
    width: number
  ) {
    this.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
    this.ctx.lineWidth = width;

    this.ctx.beginPath();

    const first = points[0];
    this.ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.closePath();
    this.ctx.stroke();
  }



  drawStyledLine(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    color: RGBA,
    width: number
  ) {
    this.strokeLine(p1.x, p1.y, p2.x, p2.y, color, width);
  }

  drawStyledPolygon(
    pts: { x: number; y: number }[],
    fill: RGBA,
    stroke: RGBA,
    width: number
  ) {
    this.fillPolygon(pts, fill);
    this.strokePolygon(pts, stroke, width);
  }
}