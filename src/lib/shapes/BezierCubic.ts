import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class BezierCubic extends Shape {
  constructor(
    public x1 = -100,
    public y1 = 0,
    public cx1 = -50,
    public cy1 = -150,
    public cx2 = 50,
    public cy2 = 150,
    public x2 = 100,
    public y2 = 0
  ) {
    super();
  }

  private getCurvePoints(steps: number) {
    const pts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      const mt = 1 - t;

      const x =
        mt * mt * mt * this.x1 +
        3 * mt * mt * t * this.cx1 +
        3 * mt * t * t * this.cx2 +
        t * t * t * this.x2;

      const y =
        mt * mt * mt * this.y1 +
        3 * mt * mt * t * this.cy1 +
        3 * mt * t * t * this.cy2 +
        t * t * t * this.y2;

      pts.push({ x, y });
    }

    return pts;
  }


  getLocalBounds(): Bounds {
    const pts = this.getCurvePoints(25);

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  getBounds(): Bounds {
    const pts = this.getCurvePoints(25).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);
    const pts = this.getCurvePoints(30);

    const threshold = this.strokeWidth + 2;

    for (let i = 0; i < pts.length - 1; i++) {
      const d = this.distancePointToSegment(
        p.x, p.y,
        pts[i].x, pts[i].y,
        pts[i + 1].x, pts[i + 1].y
      );

      if (d <= threshold) return true;
    }

    return false;
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getCurvePoints(40).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    for (let i = 0; i < pts.length - 1; i++) {
  this.drawLine(r,
    this.transformPointToDevice(pts[i].x, pts[i].y),
    this.transformPointToDevice(pts[i + 1].x, pts[i + 1].y)
  );
}
  }


  private distancePointToSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1);
    }

    const t =
      ((px - x1) * dx + (py - y1) * dy) /
      (dx * dx + dy * dy);

    const clamped = Math.max(0, Math.min(1, t));

    const cx = x1 + clamped * dx;
    const cy = y1 + clamped * dy;

    return Math.hypot(px - cx, py - cy);
  }


  toJSON() {
    return {
      type: "BezierCubic",
      x1: this.x1,
      y1: this.y1,
      cx1: this.cx1,
      cy1: this.cy1,
      cx2: this.cx2,
      cy2: this.cy2,
      x2: this.x2,
      y2: this.y2,
      transform: this.transform,
    };
  }
}