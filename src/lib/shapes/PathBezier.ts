import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

type PathMode = "polyline" | "bezier";

type Point = { x: number; y: number };

export class PathBezier extends Shape {
  constructor(
    public points: Point[] = [],
    public mode: PathMode = "polyline",
    public closed: boolean = false
  ) {
    super();
  }

  // -----------------------
  // Control points API
  // -----------------------
  getControlPoints(): Point[] {
    return this.points.map(p => ({ ...p }));
  }

  setControlPoint(idx: number, p: Point) {
    if (idx < 0 || idx >= this.points.length) return;
    this.points[idx] = { x: p.x, y: p.y };
  }

  addPointLocal(p: Point, index?: number) {
    if (index === undefined) {
      this.points.push({ ...p });
    } else {
      this.points.splice(index, 0, { ...p });
    }
  }

  removePoint(index: number) {
    if (index < 0 || index >= this.points.length) return;
    this.points.splice(index, 1);
  }

  // -----------------------
  // Catmull-Rom → Bezier (минимальная реализация)
  // -----------------------
  private catmullToBezier(stepsPerSeg = 20): Point[] {
    const pts: Point[] = this.points;
    if (pts.length < 2) return [];

    const result: Point[] = [];

    const get = (i: number) => {
      if (this.closed) {
        return pts[(i + pts.length) % pts.length];
      }
      return pts[Math.max(0, Math.min(pts.length - 1, i))];
    };

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = get(i - 1);
      const p1 = get(i);
      const p2 = get(i + 1);
      const p3 = get(i + 2);

      for (let j = 0; j <= stepsPerSeg; j++) {
        const t = j / stepsPerSeg;
        const t2 = t * t;
        const t3 = t2 * t;

        const x =
          0.5 *
          ((2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

        const y =
          0.5 *
          ((2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

        result.push({ x, y });
      }
    }

    return result;
  }

  // -----------------------
  // Flatten (главный метод аппроксимации)
  // -----------------------
  private flatten(steps = 25): Point[] {
    if (this.points.length === 0) return [];

    if (this.mode === "polyline") {
      return this.points;
    }

    if (this.mode === "bezier") {
      return this.catmullToBezier(steps);
    }

    return this.points;
  }

  // -----------------------
  // Bounds (local)
  // -----------------------
  getLocalBounds(): Bounds {
    const pts = this.flatten(25);

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  // -----------------------
  // Bounds (device)
  // -----------------------
  getBounds(): Bounds {
    const pts = this.flatten(25).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  // -----------------------
  // HitTest (distance to segments)
  // -----------------------
  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);
    const pts = this.flatten(30);

    const threshold = this.strokeWidth + 2;

    for (let i = 0; i < pts.length - 1; i++) {
      const d = this.distancePointToSegment(
        p.x, p.y,
        pts[i].x, pts[i].y,
        pts[i + 1].x, pts[i + 1].y
      );

      if (d <= threshold) return true;
    }

    // closed path closing segment
    if (this.closed && pts.length > 2) {
      const a = pts[pts.length - 1];
      const b = pts[0];

      const d = this.distancePointToSegment(
        p.x, p.y,
        a.x, a.y,
        b.x, b.y
      );

      if (d <= threshold) return true;
    }

    return false;
  }

  // -----------------------
  // Raster rendering
  // -----------------------
  drawRaster(r: RasterRenderer) {
    const pts = this.flatten(40).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    for (let i = 0; i < pts.length - 1; i++) {
      this.drawLine(
        r,
        pts[i],
        pts[i + 1]
      );
    }

    if (this.closed && pts.length > 2) {
      this.drawLine(
        r,
        pts[pts.length - 1],
        pts[0]
      );
    }
  }

  // -----------------------
  // Geometry helper
  // -----------------------
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

  // -----------------------
  // Serialization
  // -----------------------
  toJSON() {
    return {
      type: "PathBezier",
      points: this.points,
      mode: this.mode,
      closed: this.closed,
      transform: this.transform,
    };
  }
}