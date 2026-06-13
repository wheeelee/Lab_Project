import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

type PathMode = "polyline" | "bezier" | "catmull";
type Point = { x: number; y: number };

export class PathBezier extends Shape {
  constructor(
    public points: Point[] = [],
    public mode: PathMode = "polyline",
    public closed: boolean = false
  ) {
    super();
  }

  // ----------------------------------------------------
  // Catmull-Rom → Cubic Bezier (локальные координаты)
  // ----------------------------------------------------
  private catmullToBeziers(): Point[][] {
    const pts = this.points;
    if (pts.length < 2) return [];

    const n = pts.length;
    const get = (i: number) => pts[(i + n) % n];
    const count = this.closed ? n : n - 1;

    const segments: Point[][] = [];

    for (let i = 0; i < count; i++) {
      const p0 = this.closed ? get(i - 1) : (i === 0 ? pts[0] : pts[i - 1]);
      const p1 = pts[i];
      const p2 = this.closed ? get(i + 1) : (i + 1 < n ? pts[i + 1] : pts[n - 1]);
      const p3 = this.closed ? get(i + 2) : (i + 2 < n ? pts[i + 2] : pts[n - 1]);

      const t = 0.5 / 6;

      const cp1 = {
        x: p1.x + (p2.x - p0.x) * t * 0.5,
        y: p1.y + (p2.y - p0.y) * t * 0.5,
      };

      const cp2 = {
        x: p2.x - (p3.x - p1.x) * t * 0.5,
        y: p2.y - (p3.y - p1.y) * t * 0.5,
      };

      segments.push([p1, cp1, cp2, p2]);
    }

    return segments;
  }

  // ----------------------------------------------------
  // Аппроксимация кубика в device координатах
  // ----------------------------------------------------
  private cubicToPoints(
    P0: Point,
    P1: Point,
    P2: Point,
    P3: Point,
    segments: number
  ): Point[] {
    const pts: Point[] = [];

    const d0 = this.transformPointToDevice(P0.x, P0.y);
    const d1 = this.transformPointToDevice(P1.x, P1.y);
    const d2 = this.transformPointToDevice(P2.x, P2.y);
    const d3 = this.transformPointToDevice(P3.x, P3.y);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;

      const x =
        mt * mt * mt * d0.x +
        3 * mt * mt * t * d1.x +
        3 * mt * t * t * d2.x +
        t * t * t * d3.x;

      const y =
        mt * mt * mt * d0.y +
        3 * mt * mt * t * d1.y +
        3 * mt * t * t * d2.y +
        t * t * t * d3.y;

      pts.push({ x, y });
    }

    return pts;
  }

  // ----------------------------------------------------
  // ЕДИНЫЙ flatten pipeline (как в эталоне)
  // ----------------------------------------------------
  private getFlattenedDevice(segmentsPerCurve = 32): Point[] {
    const result: Point[] = [];

    if (this.mode === "polyline") {
      for (const p of this.points) {
        result.push(this.transformPointToDevice(p.x, p.y));
      }
      if (this.closed && this.points.length > 0) {
        result.push(this.transformPointToDevice(this.points[0].x, this.points[0].y));
      }
      return result;
    }

    let segments: Point[][] = [];

    if (this.mode === "catmull") {
      segments = this.catmullToBeziers();
    }

    if (this.mode === "bezier") {
      const pts = this.points;
      const n = pts.length;

      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = i + 2 < n ? pts[i + 2] : pts[i + 1];

        const t = 0.5;

        const cp1 = {
          x: p1.x + (p2.x - p0.x) * t * 0.5,
          y: p1.y + (p2.y - p0.y) * t * 0.5,
        };

        const cp2 = {
          x: p2.x - (p3.x - p1.x) * t * 0.5,
          y: p2.y - (p3.y - p1.y) * t * 0.5,
        };

        segments.push([p1, cp1, cp2, p2]);
      }
    }

    for (const [P0, P1, P2, P3] of segments) {
      const segPts = this.cubicToPoints(P0, P1, P2, P3, segmentsPerCurve);
      if (result.length > 0) result.pop();
      result.push(...segPts);
    }

    return result;
  }

  // ----------------------------------------------------
  // DRAW
  // ----------------------------------------------------
  drawRaster(r: RasterRenderer) {
    const pts = this.getFlattenedDevice();
    if (pts.length < 2) return;

    for (let i = 0; i < pts.length - 1; i++) {
      this.drawLine(r, pts[i], pts[i + 1]);
    }

    if (this.closed && pts.length > 2) {
      this.drawLine(r, pts[pts.length - 1], pts[0]);
    }
  }

  // ----------------------------------------------------
  // HIT TEST
  // ----------------------------------------------------
  hitTest(px: number, py: number): boolean {
    const pts = this.getFlattenedDevice();
    const threshold = this.strokeWidth + 2;

    for (let i = 0; i < pts.length - 1; i++) {
      if (this.distToSegment({ x: px, y: py }, pts[i], pts[i + 1]) <= threshold) {
        return true;
      }
    }

    return false;
  }

  private distToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const x = a.x + t * dx;
    const y = a.y + t * dy;

    return Math.hypot(p.x - x, p.y - y);
  }

  // ----------------------------------------------------
  // BOUNDS
  // ----------------------------------------------------
  getLocalBounds(): Bounds {
    if (this.points.length === 0)
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    return {
      minX: Math.min(...this.points.map(p => p.x)),
      minY: Math.min(...this.points.map(p => p.y)),
      maxX: Math.max(...this.points.map(p => p.x)),
      maxY: Math.max(...this.points.map(p => p.y)),
    };
  }

  getBounds(): Bounds {
    const pts = this.getFlattenedDevice();
    if (pts.length === 0)
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  // ----------------------------------------------------
  // CONTROL POINT EDITING
  // ----------------------------------------------------
  getControlPoints(): Point[] {
    return this.points.map((p) => ({ x: p.x, y: p.y }));
  }

  setControlPoint(index: number, pt: Point) {
    if (index < 0 || index >= this.points.length) return;
    this.points[index] = { x: pt.x, y: pt.y };
  }

  addPointLocal(pt: Point, index?: number) {
    if (index === undefined || index >= this.points.length) {
      this.points.push({ x: pt.x, y: pt.y });
    } else {
      this.points.splice(index, 0, { x: pt.x, y: pt.y });
    }
  }

  removePoint(index: number) {
    if (index < 0 || index >= this.points.length || this.points.length <= 1) return;
    this.points.splice(index, 1);
  }

  // ----------------------------------------------------
  // SERIALIZATION
  // ----------------------------------------------------
  toJSON() {
    return {
      type: "path",
      points: this.points,
      mode: this.mode,
      closed: this.closed,
      ...this.baseToJSON(),
    };
  }
}