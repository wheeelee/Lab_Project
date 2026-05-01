import { Shape } from "./Shape";
import { Bounds } from "../math/Bounds";
import { RasterRenderer } from "../raster/RasterRenderer";

export class Triangle extends Shape {
  constructor(
    public ax = 0, public ay = -50,
    public bx = 50, public by = 50,
    public cx = -50, public cy = 50
  ) {
    super();
  }

  private getPts() {
    return [
      this.transformPointToDevice(this.ax, this.ay),
      this.transformPointToDevice(this.bx, this.by),
      this.transformPointToDevice(this.cx, this.cy),
    ];
  }

  getLocalBounds(): Bounds {
    return {
      minX: Math.min(this.ax, this.bx, this.cx),
      minY: Math.min(this.ay, this.by, this.cy),
      maxX: Math.max(this.ax, this.bx, this.cx),
      maxY: Math.max(this.ay, this.by, this.cy),
    };
  }

  getBounds(): Bounds {
    const pts = this.getPts();
    return {
      minX: Math.min(...pts.map(p => p.x)),
      minY: Math.min(...pts.map(p => p.y)),
      maxX: Math.max(...pts.map(p => p.x)),
      maxY: Math.max(...pts.map(p => p.y)),
    };
  }

  hitTest(px: number, py: number): boolean {
    const p = this.transformPointToLocal(px, py);
    const area = (x1:number,y1:number,x2:number,y2:number,x3:number,y3:number)=>
      Math.abs((x2-x1)*(y3-y1)-(x3-x1)*(y2-y1));

    const A = area(this.ax,this.ay,this.bx,this.by,this.cx,this.cy);
    const A1 = area(p.x,p.y,this.bx,this.by,this.cx,this.cy);
    const A2 = area(this.ax,this.ay,p.x,p.y,this.cx,this.cy);
    const A3 = area(this.ax,this.ay,this.bx,this.by,p.x,p.y);

    return Math.abs(A - (A1 + A2 + A3)) < 0.5;
  }

  drawRaster(r: RasterRenderer) {
    this.drawPolygon(r, this.getPts());
  }

  toJSON() {
    return { type: "Triangle", ax: this.ax, ay: this.ay, bx: this.bx, by: this.by, cx: this.cx, cy: this.cy, transform: this.transform };
  }
}