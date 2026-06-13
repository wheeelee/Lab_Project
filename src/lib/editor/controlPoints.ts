import { Shape } from "../shapes/Shape";
import { BezierQuadratic } from "../shapes/BezierQuadratic";
import { BezierCubic } from "../shapes/BezierCubic";
import { PathBezier } from "../shapes/PathBezier";
import { Line } from "../shapes/Line";

export interface ControlPointInfo {
  index: number;
  local: { x: number; y: number };
  role: "anchor" | "control";
}

export function getEditableControlPoints(shape: Shape): ControlPointInfo[] {
  if (shape instanceof PathBezier) {
    return shape.getControlPoints().map((p, i) => ({
      index: i,
      local: { x: p.x, y: p.y },
      role: "anchor" as const,
    }));
  }

  if (shape instanceof BezierQuadratic) {
    return [
      { index: 0, local: { x: shape.x1, y: shape.y1 }, role: "anchor" },
      { index: 1, local: { x: shape.cx, y: shape.cy }, role: "control" },
      { index: 2, local: { x: shape.x2, y: shape.y2 }, role: "anchor" },
    ];
  }

  if (shape instanceof BezierCubic) {
    return [
      { index: 0, local: { x: shape.x1, y: shape.y1 }, role: "anchor" },
      { index: 1, local: { x: shape.cx1, y: shape.cy1 }, role: "control" },
      { index: 2, local: { x: shape.cx2, y: shape.cy2 }, role: "control" },
      { index: 3, local: { x: shape.x2, y: shape.y2 }, role: "anchor" },
    ];
  }

  if (shape instanceof Line) {
    return [
      { index: 0, local: { x: shape.x1, y: shape.y1 }, role: "anchor" },
      { index: 1, local: { x: shape.x2, y: shape.y2 }, role: "anchor" },
    ];
  }

  return [];
}

export function setControlPointLocal(
  shape: Shape,
  index: number,
  local: { x: number; y: number }
) {
  if (shape instanceof PathBezier) {
    shape.setControlPoint(index, local);
    return;
  }

  if (shape instanceof BezierQuadratic) {
    if (index === 0) {
      shape.x1 = local.x;
      shape.y1 = local.y;
    } else if (index === 1) {
      shape.cx = local.x;
      shape.cy = local.y;
    } else if (index === 2) {
      shape.x2 = local.x;
      shape.y2 = local.y;
    }
    return;
  }

  if (shape instanceof BezierCubic) {
    switch (index) {
      case 0:
        shape.x1 = local.x;
        shape.y1 = local.y;
        break;
      case 1:
        shape.cx1 = local.x;
        shape.cy1 = local.y;
        break;
      case 2:
        shape.cx2 = local.x;
        shape.cy2 = local.y;
        break;
      case 3:
        shape.x2 = local.x;
        shape.y2 = local.y;
        break;
    }
    return;
  }

  if (shape instanceof Line) {
    if (index === 0) {
      shape.x1 = local.x;
      shape.y1 = local.y;
    } else if (index === 1) {
      shape.x2 = local.x;
      shape.y2 = local.y;
    }
  }
}

export function hasEditableControlPoints(shape: Shape): boolean {
  return getEditableControlPoints(shape).length > 0;
}

export function getControlPointLocal(
  shape: Shape,
  index: number
): { x: number; y: number } | null {
  const cp = getEditableControlPoints(shape).find((c) => c.index === index);
  return cp ? { x: cp.local.x, y: cp.local.y } : null;
}
