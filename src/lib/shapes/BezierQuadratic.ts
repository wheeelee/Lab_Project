import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { mat3 } from "../math/mat3";
import { RasterRenderer } from "../raster/RasterRenderer";
import { Transform } from "../math/Transform";

type Point = { x: number; y: number };

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

  private getCurvePoints(steps: number): Point[] {
    const pts: Point[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      pts.push({
        x:
          (1 - t) * (1 - t) * this.x1 +
          2 * (1 - t) * t * this.cx +
          t * t * this.x2,
        y:
          (1 - t) * (1 - t) * this.y1 +
          2 * (1 - t) * t * this.cy +
          t * t * this.y2,
      });
    }

    return pts;
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getCurvePoints(40).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    for (let i = 0; i < pts.length - 1; i++) {
      this.drawLine(r, pts[i], pts[i + 1]);
    }
  }

  // -------------------------
  // BOUNDS
  // -------------------------
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

  // -------------------------
  // HIT TEST (ОБЯЗАТЕЛЬНО)
  // -------------------------
  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);
    const pts = this.getCurvePoints(30);
    const threshold = this.strokeWidth + 2;

    for (let i = 0; i < pts.length - 1; i++) {
      if (
        this.distanceToSegment(
          p.x, p.y,
          pts[i].x, pts[i].y,
          pts[i + 1].x, pts[i + 1].y
        ) <= threshold
      ) {
        return true;
      }
    }

    return false;
  }

  private distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1);
    }

    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));

    const cx = x1 + clamped * dx;
    const cy = y1 + clamped * dy;

    return Math.hypot(px - cx, py - cy);
  }

  // -------------------------
  // RECENTER (как у cubic)
  // -------------------------
  recenterOrigin() {
    const b = this.getLocalBounds();
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;

    const linear = mat3.multiply(
      mat3.rotate(this.transform.rotation),
      mat3.scale(this.transform.scaleX, this.transform.scaleY)
    );

    const offset = mat3.transformPoint(linear, cx, cy);

    this.x1 -= cx;
    this.y1 -= cy;
    this.cx -= cx;
    this.cy -= cy;
    this.x2 -= cx;
    this.y2 -= cy;

    this.transform.x += offset.x;
    this.transform.y += offset.y;
  }

  // -------------------------
  // CLONE (нормальный)
  // -------------------------
  clone(): BezierQuadratic {
    const c = new BezierQuadratic(
      this.x1, this.y1,
      this.cx, this.cy,
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

  // -------------------------
  // SERIALIZATION (ОБЯЗАТЕЛЬНО)
  // -------------------------
  toJSON() {
    return {
      type: "quad",
      x1: this.x1,
      y1: this.y1,
      cx: this.cx,
      cy: this.cy,
      x2: this.x2,
      y2: this.y2,
      ...this.baseToJSON(),
    };
  }
}