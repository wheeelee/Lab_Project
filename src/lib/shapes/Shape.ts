import { Mat3, mat3, Point2D } from "../math/mat3";
import { Transform } from "../math/Transform";
import { Bounds } from "../math/Bounds";
import { RasterRenderer, hexToRGBA } from "../raster/RasterRenderer";

export abstract class Shape {
  id: string = crypto.randomUUID();
  parent: Shape | null = null;
  transform: Transform = new Transform();

  fillStyle = "#000000";
  fillOpacity = 1;
  strokeStyle = "#000000";
  strokeWidth = 1;
  strokeOpacity = 1;

  protected getFillRGBA() {
    return hexToRGBA(this.fillStyle, Math.round(this.fillOpacity * 255));
  }

  protected getStrokeRGBA() {
    return hexToRGBA(this.strokeStyle, Math.round(this.strokeOpacity * 255));
  }

  getLocalMatrix(): Mat3 {
    return this.transform.toMatrix();
  }

  getLocalToDeviceMatrix(): Mat3 {
    let m = this.getLocalMatrix();
    let p = this.parent;
    while (p) {
      m = mat3.multiply(p.getLocalMatrix(), m);
      p = p.parent;
    }
    return m;
  }

  getDeviceToLocalMatrix(): Mat3 {
    const inv = mat3.invert(this.getLocalToDeviceMatrix());
    if (!inv) throw new Error("Matrix not invertible");
    return inv;
  }

  transformPointToDevice(x: number, y: number): Point2D {
    return mat3.transformPoint(this.getLocalToDeviceMatrix(), x, y);
  }

  transformPointToLocal(x: number, y: number): Point2D {
    return mat3.transformPoint(this.getDeviceToLocalMatrix(), x, y);
  }

  protected drawPolygon(r: RasterRenderer, pts: Point2D[]) {
    r.drawStyledPolygon(
      pts,
      this.getFillRGBA(),
      this.getStrokeRGBA(),
      this.strokeWidth
    );
  }

  protected drawLine(r: RasterRenderer, p1: Point2D, p2: Point2D) {
    r.drawStyledLine(p1, p2, this.getStrokeRGBA(), this.strokeWidth);
  }

  abstract drawRaster(r: RasterRenderer): void;
  abstract hitTest(px: number, py: number): boolean;
  abstract getBounds(): Bounds;
  abstract getLocalBounds(): Bounds;
  abstract toJSON(): any;
}