import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

type Pt = { x: number; y: number };

export class Triangle extends Shape {
  private a: Pt;
  private b: Pt;
  private c: Pt;

  constructor(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number
  ) {
    super();

    const centerX = (ax + bx + cx) / 3;
    const centerY = (ay + by + cy) / 3;

    this.transform.x = centerX;
    this.transform.y = centerY;

    this.a = { x: ax - centerX, y: ay - centerY };
    this.b = { x: bx - centerX, y: by - centerY };
    this.c = { x: cx - centerX, y: cy - centerY };
  }

  private localPts(): Pt[] {
    return [this.a, this.b, this.c];
  }

  private devicePts(): Pt[] {
    return this.localPts().map(p =>
      this.transformPointToDevice(p.x, p.y)
    );
  }

  getLocalBounds(): Bounds {
    const pts = this.localPts();
    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  getBounds(): Bounds {
    const pts = this.devicePts();
    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);

    const sign = (p1: Pt, p2: Pt, p3: Pt) =>
      (p1.x - p3.x) * (p2.y - p3.y) -
      (p2.x - p3.x) * (p1.y - p3.y);

    const b1 = sign(p, this.a, this.b) < 0;
    const b2 = sign(p, this.b, this.c) < 0;
    const b3 = sign(p, this.c, this.a) < 0;

    return (b1 === b2) && (b2 === b3);
  }

  drawRaster(r: RasterRenderer) {
    this.drawPolygon(r, this.devicePts());
  }

  clone(): Triangle {
    const toAbs = (p: Pt) => ({
      x: p.x + this.transform.x,
      y: p.y + this.transform.y,
    });

    const A = toAbs(this.a);
    const B = toAbs(this.b);
    const C = toAbs(this.c);

    const t = new Triangle(A.x, A.y, B.x, B.y, C.x, C.y);
    t.transform = { ...this.transform, toMatrix: this.transform.toMatrix.bind(this.transform) };
    return t;
  }

  static fromSaved(data: {
    a: Pt;
    b: Pt;
    c: Pt;
    id?: string;
    fillStyle?: string;
    fillOpacity?: number;
    strokeStyle?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    transform?: { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
  }): Triangle {
    const tri = new Triangle(0, 0, 1, 0, 0, 0);
    tri.a = { ...data.a };
    tri.b = { ...data.b };
    tri.c = { ...data.c };
    if (data.id) tri.id = data.id;
    if (data.transform) {
      tri.transform.x = data.transform.x;
      tri.transform.y = data.transform.y;
      tri.transform.rotation = data.transform.rotation;
      tri.transform.scaleX = data.transform.scaleX;
      tri.transform.scaleY = data.transform.scaleY;
    }
    if (data.fillStyle !== undefined) tri.fillStyle = data.fillStyle;
    if (data.fillOpacity !== undefined) tri.fillOpacity = data.fillOpacity;
    if (data.strokeStyle !== undefined) tri.strokeStyle = data.strokeStyle;
    if (data.strokeWidth !== undefined) tri.strokeWidth = data.strokeWidth;
    if (data.strokeOpacity !== undefined) tri.strokeOpacity = data.strokeOpacity;
    return tri;
  }

  toJSON() {
    return {
      type: "triangle",
      a: this.a,
      b: this.b,
      c: this.c,
      ...this.baseToJSON(),
    };
  }
}