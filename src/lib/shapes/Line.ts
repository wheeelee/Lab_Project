import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class Line extends Shape {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {
    super();
  }

  getLocalBounds(): Bounds {
    return {
      minX: Math.min(this.x1, this.x2),
      minY: Math.min(this.y1, this.y2),
      maxX: Math.max(this.x1, this.x2),
      maxY: Math.max(this.y1, this.y2),
    };
  }

  getBounds(): Bounds {
    const p1 = this.transformPointToDevice(this.x1, this.y1);
    const p2 = this.transformPointToDevice(this.x2, this.y2);

    return {
      minX: Math.min(p1.x, p2.x),
      minY: Math.min(p1.y, p2.y),
      maxX: Math.max(p1.x, p2.x),
      maxY: Math.max(p1.y, p2.y),
    };
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;

    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;

    let t =
      ((p.x - this.x1) * dx + (p.y - this.y1) * dy) / len2;

    t = Math.max(0, Math.min(1, t));

    const cx = this.x1 + t * dx;
    const cy = this.y1 + t * dy;

    const dist = Math.hypot(p.x - cx, p.y - cy);

    return dist <= this.strokeWidth;
  }

  drawRaster(r: RasterRenderer) {
    const p1 = this.transformPointToDevice(this.x1, this.y1);
    const p2 = this.transformPointToDevice(this.x2, this.y2);

    this.drawLine(r, p1, p2);
  }

  toJSON() {
    return {
      type: "Line",
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      transform: this.transform,
    };
  }
}