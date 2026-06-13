import { Shape } from "./Shape";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";
import { BezierQuadratic } from "./BezierQuadratic";
import { BezierCubic } from "./BezierCubic";
import { PathBezier } from "./PathBezier";

type TransformData = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

function applyCommon(shape: Shape, data: Record<string, unknown>) {
  if (typeof data.id === "string") shape.id = data.id;
  if (typeof data.fillStyle === "string") shape.fillStyle = data.fillStyle;
  if (typeof data.fillOpacity === "number") shape.fillOpacity = data.fillOpacity;
  if (typeof data.strokeStyle === "string") shape.strokeStyle = data.strokeStyle;
  if (typeof data.strokeWidth === "number") shape.strokeWidth = data.strokeWidth;
  if (typeof data.strokeOpacity === "number") shape.strokeOpacity = data.strokeOpacity;

  const t = data.transform as TransformData | undefined;
  if (t) {
    shape.transform.x = t.x ?? 0;
    shape.transform.y = t.y ?? 0;
    shape.transform.rotation = t.rotation ?? 0;
    shape.transform.scaleX = t.scaleX ?? 1;
    shape.transform.scaleY = t.scaleY ?? 1;
  }
}

export function shapeFromJSON(data: Record<string, unknown>): Shape | null {
  const type = data.type;
  if (typeof type !== "string") return null;

  switch (type) {
    case "rect":
    case "Rect": {
      const shape = new Rect(data.w as number, data.h as number);
      applyCommon(shape, data);
      return shape;
    }
    case "line":
    case "Line": {
      const shape = new Line(
        data.x1 as number,
        data.y1 as number,
        data.x2 as number,
        data.y2 as number
      );
      applyCommon(shape, data);
      return shape;
    }
    case "oval":
    case "Oval": {
      const shape = new Oval(data.rx as number, data.ry as number);
      applyCommon(shape, data);
      return shape;
    }
    case "triangle":
    case "Triangle": {
      return Triangle.fromSaved({
        a: data.a as { x: number; y: number },
        b: data.b as { x: number; y: number },
        c: data.c as { x: number; y: number },
        id: data.id as string | undefined,
        fillStyle: data.fillStyle as string | undefined,
        fillOpacity: data.fillOpacity as number | undefined,
        strokeStyle: data.strokeStyle as string | undefined,
        strokeWidth: data.strokeWidth as number | undefined,
        strokeOpacity: data.strokeOpacity as number | undefined,
        transform: data.transform as TransformData | undefined,
      });
    }
    case "quad":
    case "BezierQuadratic": {
      const shape = new BezierQuadratic(
        data.x1 as number,
        data.y1 as number,
        data.cx as number,
        data.cy as number,
        data.x2 as number,
        data.y2 as number
      );
      applyCommon(shape, data);
      shape.recenterOrigin();
      return shape;
    }
    case "cubic":
    case "BezierCubic": {
      const shape = new BezierCubic(
        data.x1 as number,
        data.y1 as number,
        data.cx1 as number,
        data.cy1 as number,
        data.cx2 as number,
        data.cy2 as number,
        data.x2 as number,
        data.y2 as number
      );
      applyCommon(shape, data);
      shape.recenterOrigin();
      return shape;
    }
    case "path":
    case "PathBezier": {
      const shape = new PathBezier(
        data.points as { x: number; y: number }[],
        data.mode as "polyline" | "bezier" | "catmull",
        data.closed as boolean
      );
      applyCommon(shape, data);
      return shape;
    }
    default:
      return null;
  }
}
