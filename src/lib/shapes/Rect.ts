import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class Rect extends Shape {
  constructor(public w: number, public h: number) {
    super();
  }

  private getLocalPts() {
    return [
      { x: -this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: -this.h / 2 },
      { x: this.w / 2, y: this.h / 2 },
      { x: -this.w / 2, y: this.h / 2 },
    ];
  }

  getLocalBounds(): Bounds {
    return {
      minX: -this.w / 2,
      minY: -this.h / 2,
      maxX: this.w / 2,
      maxY: this.h / 2,
    };
  }

  getBounds(): Bounds {
    const pts = this.getLocalPts().map(p =>
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

    return (
      p.x >= -this.w / 2 &&
      p.x <= this.w / 2 &&
      p.y >= -this.h / 2 &&
      p.y <= this.h / 2
    );
  }

  drawRaster(r: RasterRenderer) {
    const pts = this.getLocalPts().map(p =>
      this.transformPointToDevice(p.x, p.y)
    );

    this.drawPolygon(r, pts);
  }

  toJSON() {
    return {
      type: "Rect",
      w: this.w,
      h: this.h,
      transform: this.transform,
    };
  }
}