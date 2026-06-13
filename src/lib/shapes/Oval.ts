import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class Oval extends Shape {
  constructor(public rx: number, public ry: number) {
    super();
  }

  private getLocalPts(steps = 32) {
    const pts = [];

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;

      pts.push({
        x: this.rx * Math.cos(t),
        y: this.ry * Math.sin(t),
      });
    }

    return pts;
  }

  getLocalBounds(): Bounds {
    return {
      minX: -this.rx,
      minY: -this.ry,
      maxX: this.rx,
      maxY: this.ry,
    };
  }

  getBounds(): Bounds {
    const pts = this.getLocalPts(48).map(p =>
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

    if (this.rx === 0 || this.ry === 0) return false;

    return (
      (p.x * p.x) / (this.rx * this.rx) +
      (p.y * p.y) / (this.ry * this.ry)
    ) <= 1;
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getLocalPts(48).map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    this.drawPolygon(r, pts);
  }

  toJSON() {
    return {
      type: "oval",
      rx: this.rx,
      ry: this.ry,
      ...this.baseToJSON(),
    };
  }
}