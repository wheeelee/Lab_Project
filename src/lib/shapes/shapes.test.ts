import { describe, it, expect } from "vitest";
import { Triangle } from "./Triangle";
import { BezierQuadratic } from "./BezierQuadratic";
import { BezierCubic } from "./BezierCubic";
import { PathBezier } from "./PathBezier";
import { Rect } from "./Rect";
import { Oval } from "./Oval";
import { Line } from "./Line";
import { shapeFromJSON } from "./shapeFromJSON";

describe("Shapes - Hit Testing", () => {
  it("Triangle: point inside", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    expect(tri.hitTest(0, 0)).toBe(true);
  });

  it("Triangle: point outside", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    expect(tri.hitTest(100, 100)).toBe(false);
  });

  it("Triangle: point on edge", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    expect(tri.hitTest(0, 50)).toBe(true);
  });

  it("QuadraticBezier: hit near curve", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    curve.strokeWidth = 3;
    expect(curve.hitTest(0, -50)).toBe(true);
  });

  it("QuadraticBezier: hit far from curve", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    curve.strokeWidth = 3;
    expect(curve.hitTest(0, 100)).toBe(false);
  });

  it("CubicBezier: hit near curve", () => {
    const curve = new BezierCubic(-100, 0, -50, -150, 50, 150, 100, 0);
    curve.strokeWidth = 3;
    expect(curve.hitTest(0, 0)).toBe(true);
  });

  it("PathBezier (polyline): hit on segment", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );
    path.strokeWidth = 3;
    expect(path.hitTest(25, 0)).toBe(true);
  });

  it("PathBezier (catmull): hit on curve", () => {
    const path = new PathBezier(
      [
        { x: -100, y: 0 },
        { x: -50, y: -50 },
        { x: 0, y: 0 },
        { x: 50, y: -50 },
        { x: 100, y: 0 },
      ],
      "catmull",
      false
    );
    path.strokeWidth = 5;
    expect(path.hitTest(0, -20)).toBe(true);
  });
});

describe("Shapes - Bounds Calculation", () => {
  it("Triangle: bounds calculation", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    const bounds = tri.getLocalBounds();

    expect(bounds.minX).toBeLessThanOrEqual(-50);
    expect(bounds.maxX).toBeGreaterThanOrEqual(50);
    expect(bounds.minY).toBeLessThanOrEqual(-50);
    expect(bounds.maxY).toBeGreaterThanOrEqual(50);
  });

  it("Triangle: transformed bounds", () => {
    const tri = new Triangle(0, 0, 100, 0, 50, 100);
    tri.transform.x = 100;
    tri.transform.y = 100;

    const bounds = tri.getBounds();
    expect(bounds.minX).toBeGreaterThan(0);
    expect(bounds.minY).toBeGreaterThan(0);
  });

  it("QuadraticBezier: bounds contain curve", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    const bounds = curve.getLocalBounds();

    expect(bounds.minX).toBeLessThanOrEqual(-80);
    expect(bounds.maxX).toBeGreaterThanOrEqual(80);
    expect(bounds.minY).toBeLessThanOrEqual(-100);
    expect(bounds.maxY).toBeGreaterThanOrEqual(0);
  });

  it("CubicBezier: bounds contain curve", () => {
    const curve = new BezierCubic(-100, 0, -50, -150, 50, 150, 100, 0);
    const bounds = curve.getLocalBounds();

    expect(bounds.minX).toBeLessThanOrEqual(-100);
    expect(bounds.maxX).toBeGreaterThanOrEqual(100);
  });

  it("PathBezier: bounds from points", () => {
    const path = new PathBezier(
      [
        { x: -100, y: -50 },
        { x: 0, y: -100 },
        { x: 100, y: 50 },
      ],
      "polyline",
      false
    );
    const bounds = path.getLocalBounds();

    expect(bounds.minX).toBeLessThanOrEqual(-100);
    expect(bounds.maxX).toBeGreaterThanOrEqual(100);
    expect(bounds.minY).toBeLessThanOrEqual(-100);
    expect(bounds.maxY).toBeGreaterThanOrEqual(50);
  });
});

describe("Shapes - Curve Behavior", () => {
  it("QuadraticBezier: curve passes through endpoints", () => {
    const curve = new BezierQuadratic(0, 0, 50, 100, 100, 0);

    const pts = (curve as any).getCurvePoints(100);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[100]).toEqual({ x: 100, y: 0 });
  });

  it("CubicBezier: curve passes through endpoints", () => {
    const curve = new BezierCubic(0, 0, 30, 100, 70, -100, 100, 0);

    const pts = (curve as any).getCurvePoints(100);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[100]).toEqual({ x: 100, y: 0 });
  });

  it("PathBezier (polyline): straight line segments", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      "polyline",
      false
    );
    const pts = path.getControlPoints();

    expect(pts.length).toBe(2);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[1]).toEqual({ x: 100, y: 0 });
  });

  it("PathBezier (catmull): smooth interpolation through points", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
      "catmull",
      false
    );
    expect(path.getControlPoints().length).toBe(3);
  });

  it("PathBezier (bezier): quadratic segments", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
      "bezier",
      false
    );
    expect(path.getControlPoints().length).toBe(3);
  });
});

describe("Shapes - Control Point Editing", () => {
  it("QuadraticBezier: control point modification", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    const origCx = curve.cx;

    curve.cx = 50;
    expect(curve.cx).toBe(50);
    expect(curve.cx).not.toBe(origCx);
  });

  it("PathBezier: add point", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );
    const initialCount = path.getControlPoints().length;

    path.addPointLocal({ x: 50, y: 50 });
    expect(path.getControlPoints().length).toBe(initialCount + 1);
  });

  it("PathBezier: remove point", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );
    const initialCount = path.getControlPoints().length;

    path.removePoint(1);
    expect(path.getControlPoints().length).toBe(initialCount - 1);
  });

  it("PathBezier: set control point", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );

    path.setControlPoint(1, { x: 75, y: 75 });
    const pts = path.getControlPoints();
    expect(pts[1]).toEqual({ x: 75, y: 75 });
  });
});

describe("Shapes - Serialization", () => {
  it("Triangle: JSON serialization", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    const json = tri.toJSON();

    expect(json.type).toBe("triangle");
    expect(json.a).toBeDefined();
    expect(json.b).toBeDefined();
    expect(json.c).toBeDefined();
    expect(json).toHaveProperty("transform");
  });

  it("QuadraticBezier: pivot at bounds center after recenterOrigin", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    curve.transform.x = 200;
    curve.transform.y = 150;

    const bBefore = curve.getLocalBounds();
    const deviceCenterBefore = curve.transformPointToDevice(
      (bBefore.minX + bBefore.maxX) / 2,
      (bBefore.minY + bBefore.maxY) / 2
    );

    curve.recenterOrigin();

    const b = curve.getLocalBounds();
    expect(Math.abs((b.minX + b.maxX) / 2)).toBeLessThan(1e-6);
    expect(Math.abs((b.minY + b.maxY) / 2)).toBeLessThan(1e-6);

    const deviceCenterAfter = curve.transformPointToDevice(0, 0);
    expect(deviceCenterAfter.x).toBeCloseTo(deviceCenterBefore.x);
    expect(deviceCenterAfter.y).toBeCloseTo(deviceCenterBefore.y);
  });

  it("QuadraticBezier: JSON serialization", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    const json = curve.toJSON();

    expect(json.type).toBe("quad");
    expect(json.x1).toBe(-80);
    expect(json.y1).toBe(0);
    expect(json.cx).toBe(0);
    expect(json.cy).toBe(-100);
    expect(json.x2).toBe(80);
    expect(json.y2).toBe(0);
  });

  it("CubicBezier: JSON serialization", () => {
    const curve = new BezierCubic(-100, 0, -50, -150, 50, 150, 100, 0);
    const json = curve.toJSON();

    expect(json.type).toBe("cubic");
    expect(json.x1).toBe(-100);
    expect(json.cx1).toBe(-50);
    expect(json.cx2).toBe(50);
    expect(json.x2).toBe(100);
  });

  it("PathBezier: JSON serialization", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
      "bezier",
      true
    );
    const json = path.toJSON();

    expect(json.type).toBe("path");
    expect(json.points).toHaveLength(3);
    expect(json.mode).toBe("bezier");
    expect(json.closed).toBe(true);
  });

  it("Rect: round-trip via shapeFromJSON", () => {
    const rect = new Rect(120, 80);
    rect.transform.x = 50;
    rect.transform.rotation = 0.5;
    rect.fillStyle = "#ff0000";
    rect.strokeWidth = 4;

    const restored = shapeFromJSON(rect.toJSON());
    expect(restored).not.toBeNull();
    expect(restored!.transform.x).toBe(50);
    expect(restored!.transform.rotation).toBe(0.5);
    expect((restored as Rect).w).toBe(120);
    expect(restored!.fillStyle).toBe("#ff0000");
    expect(restored!.strokeWidth).toBe(4);
  });

  it("Triangle: round-trip via shapeFromJSON", () => {
    const tri = new Triangle(0, -50, 50, 50, -50, 50);
    tri.strokeStyle = "#00ff00";

    const restored = shapeFromJSON(tri.toJSON()) as Triangle;
    expect(restored).not.toBeNull();
    expect(restored.strokeStyle).toBe("#00ff00");
    expect(restored.hitTest(0, 0)).toBe(true);
  });

  it("PathBezier: round-trip via shapeFromJSON", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
      ],
      "bezier",
      true
    );

    const restored = shapeFromJSON(path.toJSON()) as PathBezier;
    expect(restored).not.toBeNull();
    expect(restored.points).toHaveLength(3);
    expect(restored.mode).toBe("bezier");
    expect(restored.closed).toBe(true);
  });

  it("shapeFromJSON: unknown type returns null", () => {
    expect(shapeFromJSON({ type: "unknown" })).toBeNull();
  });
});

describe("Shapes - Transform", () => {
  it("Triangle: rotation affects bounds", () => {
    const tri = new Triangle(0, 0, 100, 0, 50, 100);
    tri.transform.rotation = Math.PI / 4;

    const bounds = tri.getBounds();
    expect(bounds.minX).toBeDefined();
    expect(bounds.maxX).toBeDefined();
  });

  it("QuadraticBezier: translation affects bounds", () => {
    const curve = new BezierQuadratic(-80, 0, 0, -100, 80, 0);
    const boundsBeforeTranslate = curve.getBounds();

    curve.transform.x = 100;
    curve.transform.y = 100;

    const boundsAfterTranslate = curve.getBounds();

    expect(boundsAfterTranslate.minX).toBeGreaterThan(
      boundsBeforeTranslate.minX
    );
    expect(boundsAfterTranslate.minY).toBeGreaterThan(
      boundsBeforeTranslate.minY
    );
  });

  it("PathBezier: scale affects boundaries", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );

    path.transform.scaleX = 2;
    path.transform.scaleY = 2;

    const bounds = path.getBounds();
    expect(bounds.maxX).toBeGreaterThan(100);
    expect(bounds.maxY).toBeGreaterThan(100);
  });
});

describe("Shapes - Edge Cases", () => {
  it("Triangle: very small triangle", () => {
    const tri = new Triangle(0, 0, 1, 0, 0.5, 1);
    expect(tri.hitTest(0.5, 0.5)).toBe(true);
  });

  it("QuadraticBezier: degenerate curve (control point on line)", () => {
    const curve = new BezierQuadratic(0, 0, 50, 0, 100, 0);
    const bounds = curve.getLocalBounds();

    expect(bounds.maxY).toBe(0);
    expect(bounds.minY).toBe(0);
  });

  it("PathBezier: single point", () => {
    const path = new PathBezier([{ x: 50, y: 50 }], "polyline", false);
    expect(path.getControlPoints()).toHaveLength(1);
  });

  it("PathBezier: two points", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      false
    );
    expect(path.getControlPoints()).toHaveLength(2);
  });

  it("PathBezier: closed path", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      true
    );
    expect(path.closed).toBe(true);
  });
});

describe("Basic Shapes (Lab5)", () => {
  it("Rect: hit test inside", () => {
    const rect = new Rect(100, 100);
    expect(rect.hitTest(0, 0)).toBe(true);
  });

  it("Rect: hit test outside", () => {
    const rect = new Rect(100, 100);
    expect(rect.hitTest(150, 150)).toBe(false);
  });

  it("Oval: bounds calculation", () => {
    const oval = new Oval(100, 50);
    const bounds = oval.getLocalBounds();

    expect(bounds.minX).toBe(-100);
    expect(bounds.maxX).toBe(100);
    expect(bounds.minY).toBe(-50);
    expect(bounds.maxY).toBe(50);
  });

  it("Line: hit test near line", () => {
    const line = new Line(-100, 0, 100, 0);
    line.strokeWidth = 5;
    expect(line.hitTest(0, 2)).toBe(true);
  });
});
