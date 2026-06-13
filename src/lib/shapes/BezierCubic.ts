import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { mat3 } from "../math/mat3";
import { RasterRenderer } from "../raster/RasterRenderer";
import { Transform } from "../math/Transform";

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

      pts.push({
        x:
          mt ** 3 * this.x1 +
          3 * mt ** 2 * t * this.cx1 +
          3 * mt * t ** 2 * this.cx2 +
          t ** 3 * this.x2,
        y:
          mt ** 3 * this.y1 +
          3 * mt ** 2 * t * this.cy1 +
          3 * mt * t ** 2 * this.cy2 +
          t ** 3 * this.y2,
      });
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

  drawRaster(r: RasterRenderer) {
    const pts = this.getCurvePoints(40).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    for (let i = 0; i < pts.length - 1; i++) {
      this.drawLine(r, pts[i], pts[i + 1]);
    }
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);
    const pts = this.getCurvePoints(30);
    const threshold = this.strokeWidth + 2;

    for (let i = 0; i < pts.length - 1; i++) {
      if (
        this.distancePointToSegment(
          p.x, p.y,
          pts[i].x, pts[i].y,
          pts[i + 1].x, pts[i + 1].y
        ) <= threshold
      ) return true;
    }

    return false;
  }

  private distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);

    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));

    const cx = x1 + clamped * dx;
    const cy = y1 + clamped * dy;

    return Math.hypot(px - cx, py - cy);
  }

  // 🔴 ИСПРАВЛЕНО: корректный pivot recenter
  recenterOrigin() {
    const b = this.getLocalBounds();
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;

    if (Math.abs(cx) < 1e-6 && Math.abs(cy) < 1e-6) return;

    const linear = mat3.multiply(
      mat3.rotate(this.transform.rotation),
      mat3.scale(this.transform.scaleX, this.transform.scaleY)
    );

    const offset = mat3.transformPoint(linear, cx, cy);

    this.x1 -= cx;
    this.y1 -= cy;
    this.cx1 -= cx;
    this.cy1 -= cy;
    this.cx2 -= cx;
    this.cy2 -= cy;
    this.x2 -= cx;
    this.y2 -= cy;

    this.transform.x += offset.x;
    this.transform.y += offset.y;
  }

  // 🔴 ИСПРАВЛЕНО clone
  clone(): BezierCubic {
    const c = new BezierCubic(
      this.x1, this.y1,
      this.cx1, this.cy1,
      this.cx2, this.cy2,
      this.x2, this.y2
    );

    c.transform = new Transform();
    Object.assign(c.transform, {
      x: this.transform.x,
      y: this.transform.y,
      rotation: this.transform.rotation,
      scaleX: this.transform.scaleX,
      scaleY: this.transform.scaleY,
    });

    c.strokeStyle = this.strokeStyle;
    c.strokeWidth = this.strokeWidth;
    c.fillStyle = this.fillStyle;
    c.fillOpacity = this.fillOpacity;

    return c;
  }

  toJSON() {
    return {
      type: "cubic",
      x1: this.x1,
      y1: this.y1,
      cx1: this.cx1,
      cy1: this.cy1,
      cx2: this.cx2,
      cy2: this.cy2,
      x2: this.x2,
      y2: this.y2,
      ...this.baseToJSON(),
    };
  }
}