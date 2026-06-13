import { Shape } from "../shapes/Shape";
import { Rect } from "../shapes/Rect";
import { Oval } from "../shapes/Oval";
import { Triangle } from "../shapes/Triangle";
import { Line } from "../shapes/Line";
import { BezierQuadratic } from "../shapes/BezierQuadratic";
import { BezierCubic } from "../shapes/BezierCubic";
import { PathBezier } from "../shapes/PathBezier";
import { ShapeTool } from "./types";

export function createShape(tool: ShapeTool, x: number, y: number): Shape | null {
  switch (tool) {
    case "rect": {
      const s = new Rect(120, 80);
      s.transform.x = x;
      s.transform.y = y;
      s.fillStyle = "#3b82f6";
      s.fillOpacity = 0.75;
      s.strokeStyle = "#1d4ed8";
      s.strokeWidth = 2;
      return s;
    }
    case "oval": {
      const s = new Oval(70, 50);
      s.transform.x = x;
      s.transform.y = y;
      s.fillStyle = "#fbbf24";
      s.fillOpacity = 0.75;
      s.strokeStyle = "#d97706";
      s.strokeWidth = 2;
      return s;
    }
    case "triangle": {
      const s = new Triangle(0, -50, 50, 40, -50, 40);
      s.transform.x = x;
      s.transform.y = y;
      s.fillStyle = "#10b981";
      s.strokeStyle = "#047857";
      s.strokeWidth = 2;
      return s;
    }
    case "line": {
      const s = new Line(-60, 0, 60, 0);
      s.transform.x = x;
      s.transform.y = y;
      s.strokeStyle = "#f59e0b";
      s.strokeWidth = 3;
      return s;
    }
    case "bezierQuad": {
      const s = new BezierQuadratic(-80, 0, 0, -80, 80, 0);
      s.recenterOrigin();
      s.transform.x = x;
      s.transform.y = y;
      s.strokeStyle = "#8b5cf6";
      s.strokeWidth = 3;
      return s;
    }
    case "bezierCubic": {
      const s = new BezierCubic(-80, 0, -40, 80, 40, -80, 80, 0);
      s.recenterOrigin();
      s.transform.x = x;
      s.transform.y = y;
      s.strokeStyle = "#f97316";
      s.strokeWidth = 3;
      return s;
    }
    case "path": {
      const s = new PathBezier(
        [
          { x: -60, y: 0 },
          { x: -20, y: -50 },
          { x: 20, y: 50 },
          { x: 60, y: 0 },
        ],
        "bezier",
        false
      );
      s.transform.x = x;
      s.transform.y = y;
      s.strokeStyle = "#22c55e";
      s.strokeWidth = 3;
      return s;
    }
    default:
      return null;
  }
}

export function createDemoShapes(): Shape[] {
  const rect = new Rect(150, 100);
  rect.transform.x = 150;
  rect.transform.y = 100;
  rect.transform.rotation = Math.PI / 12;
  rect.fillStyle = "#3b82f6";
  rect.fillOpacity = 0.8;

  const oval = new Oval(120, 80);
  oval.transform.x = 650;
  oval.transform.y = 100;
  oval.fillStyle = "#fbbf24";
  oval.fillOpacity = 0.8;

  const triangle = new Triangle(0, -70, 80, 70, -80, 70);
  triangle.fillStyle = "#10b981";
  triangle.strokeStyle = "#064e3b";
  triangle.strokeWidth = 3;

  const line = new Line(-100, -80, 100, 80);
  line.transform.x = 700;
  line.transform.y = 500;
  line.strokeStyle = "#f59e0b";
  line.strokeWidth = 4;

  const bezier = new BezierQuadratic(-120, 0, 0, -170, 120, 0);
  bezier.transform.x = 430;
  bezier.transform.y = 200;
  bezier.recenterOrigin();
  bezier.strokeStyle = "#3b82f6";
  bezier.strokeWidth = 3;

  const cubic = new BezierCubic(-120, 0, -60, 140, 60, -140, 120, 0);
  cubic.transform.x = 430;
  cubic.transform.y = 380;
  cubic.recenterOrigin();
  cubic.strokeStyle = "#f97335";
  cubic.strokeWidth = 3;

  const path = new PathBezier(
    [
      { x: -100, y: 0 },
      { x: -45, y: -92 },
      { x: 0, y: -8 },
      { x: 45, y: 94 },
      { x: 100, y: 0 },
    ],
    "bezier",
    true
  );
  path.transform.x = 200;
  path.transform.y = 380;
  path.strokeStyle = "#22c55e";
  path.strokeWidth = 3;

  return [rect, oval, triangle, line, bezier, cubic, path];
}
