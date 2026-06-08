import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class BezierQuadratic extends Shape {
  constructor(
    public x1 = -80,
    public y1 = 0,
    public cx = 0,
    public cy = -100,
    public x2 = 80,
    public y2 = 0
  ) {
    super();
  }

  getLocalBounds(): Bounds {
    const pts = this.getCurvePoints(20);

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  getBounds(): Bounds {
    const pts = this.getCurvePoints(20).map(p =>
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
      this.drawLine(r, pts[i], pts[i + 1]);
    }
  }

  private getCurvePoints(steps: number) {
    const pts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      const x =
        (1 - t) * (1 - t) * this.x1 +
        2 * (1 - t) * t * this.cx +
        t * t * this.x2;

      const y =
        (1 - t) * (1 - t) * this.y1 +
        2 * (1 - t) * t * this.cy +
        t * t * this.y2;

      pts.push({ x, y });
    }

    return pts;
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

  clone(): BezierQuadratic {
    const cloned = new BezierQuadratic(
      this.x1,
      this.y1,
      this.cx,
      this.cy,
      this.x2,
      this.y2
    );
    cloned.transform = { ...this.transform, toMatrix: this.transform.toMatrix.bind(this.transform) };
    cloned.strokeStyle = this.strokeStyle;
    cloned.strokeWidth = this.strokeWidth;
    cloned.fillStyle = this.fillStyle;
    cloned.fillOpacity = this.fillOpacity;
    return cloned;
  }

  toJSON() {
    return {
      type: "BezierQuadratic",
      x1: this.x1,
      y1: this.y1,
      cx: this.cx,
      cy: this.cy,
      x2: this.x2,
      y2: this.y2,
      transform: this.transform,
    };
  }
}