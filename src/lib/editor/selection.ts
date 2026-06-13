import { Shape } from "../shapes/Shape";
import { Rect } from "../shapes/Rect";
import { Oval } from "../shapes/Oval";
import { Line } from "../shapes/Line";
import { BezierQuadratic } from "../shapes/BezierQuadratic";
import { BezierCubic } from "../shapes/BezierCubic";
import { RasterRenderer, hexToRGBA } from "../raster/RasterRenderer";
import { Bounds } from "../math/Bounds";
import { ResizeHandle, HitTarget } from "./types";
import { getEditableControlPoints } from "./controlPoints";

export const HANDLE_RADIUS = 8;
export const ROTATE_OFFSET = 36;

const HANDLE_POSITIONS: ResizeHandle[] = [
  "nw", "n", "ne", "e", "se", "s", "sw", "w",
];

export function findShapeAt(
  shapes: Shape[],
  px: number,
  py: number
): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].hitTest(px, py)) return shapes[i];
  }
  return null;
}

function getHandleLocalPos(bounds: Bounds, handle: ResizeHandle) {
  const { minX, minY, maxX, maxY } = bounds;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const map: Record<ResizeHandle, { x: number; y: number }> = {
    nw: { x: minX, y: minY },
    n: { x: midX, y: minY },
    ne: { x: maxX, y: minY },
    e: { x: maxX, y: midY },
    se: { x: maxX, y: maxY },
    s: { x: midX, y: maxY },
    sw: { x: minX, y: maxY },
    w: { x: minX, y: midY },
  };
  return map[handle];
}

export function getRotateHandleLocal(bounds: Bounds) {
  const midX = (bounds.minX + bounds.maxX) / 2;
  return { x: midX, y: bounds.minY - ROTATE_OFFSET };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

export function hitTestSelection(
  shape: Shape,
  px: number,
  py: number
): HitTarget {
  const bounds = shape.getLocalBounds();
  const cps = getEditableControlPoints(shape);

  for (const cp of cps) {
    const d = shape.transformPointToDevice(cp.local.x, cp.local.y);
    if (dist(px, py, d.x, d.y) <= HANDLE_RADIUS + 4) {
      return { kind: "controlPoint", index: cp.index };
    }
  }

  const rotLocal = getRotateHandleLocal(bounds);
  const rot = shape.transformPointToDevice(rotLocal.x, rotLocal.y);
  if (dist(px, py, rot.x, rot.y) <= HANDLE_RADIUS + 4) {
    return { kind: "rotate" };
  }

  for (const handle of HANDLE_POSITIONS) {
    const lp = getHandleLocalPos(bounds, handle);
    const d = shape.transformPointToDevice(lp.x, lp.y);
    if (dist(px, py, d.x, d.y) <= HANDLE_RADIUS + 4) {
      return { kind: "resize", handle };
    }
  }

  if (shape.hitTest(px, py)) {
    return { kind: "shape", shapeId: shape.id };
  }

  return { kind: "none" };
}

export function drawSelectionOverlay(
  r: RasterRenderer,
  shape: Shape,
  hoveredTarget: HitTarget | null
) {
  const bounds = shape.getLocalBounds();
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.minY },
  ].map((p) => shape.transformPointToDevice(p.x, p.y));

  const selColor = hexToRGBA("#2563eb", 220);
  const handleFill = hexToRGBA("#ffffff", 255);
  const handleStroke = hexToRGBA("#2563eb", 255);
  const handleHover = hexToRGBA("#1d4ed8", 255);
  const cpAnchor = hexToRGBA("#22c55e", 255);
  const cpControl = hexToRGBA("#a855f7", 255);

  r.strokePolyline(corners, selColor, 1.5, true);

  const rotLocal = getRotateHandleLocal(bounds);
  const rotDev = shape.transformPointToDevice(rotLocal.x, rotLocal.y);
  const topMid = shape.transformPointToDevice(
    (bounds.minX + bounds.maxX) / 2,
    bounds.minY
  );
  r.strokeLine(topMid.x, topMid.y, rotDev.x, rotDev.y, selColor, 1);

  const rotHovered = hoveredTarget?.kind === "rotate";
  r.fillCircle(rotDev.x, rotDev.y, HANDLE_RADIUS, rotHovered ? handleHover : hexToRGBA("#f59e0b", 255));
  r.strokeCircle(rotDev.x, rotDev.y, HANDLE_RADIUS, handleStroke, 1.5);

  for (const handle of HANDLE_POSITIONS) {
    const lp = getHandleLocalPos(bounds, handle);
    const d = shape.transformPointToDevice(lp.x, lp.y);
    const hovered =
      hoveredTarget?.kind === "resize" && hoveredTarget.handle === handle;
    r.fillCircle(d.x, d.y, HANDLE_RADIUS, hovered ? handleHover : handleFill);
    r.strokeCircle(d.x, d.y, HANDLE_RADIUS, handleStroke, 1.5);
  }

  const cps = getEditableControlPoints(shape);
  for (const cp of cps) {
    const d = shape.transformPointToDevice(cp.local.x, cp.local.y);
    const hovered =
      hoveredTarget?.kind === "controlPoint" &&
      hoveredTarget.index === cp.index;
    const color =
      cp.role === "control"
        ? hovered
          ? handleHover
          : cpControl
        : hovered
          ? handleHover
          : cpAnchor;
    r.fillCircle(d.x, d.y, HANDLE_RADIUS - 1, color);
    r.strokeCircle(d.x, d.y, HANDLE_RADIUS - 1, handleStroke, 1.5);

    if (cp.role === "control") {
      const guideColor = hexToRGBA("#a855f7", 120);
      if (shape instanceof BezierQuadratic && cp.index === 1) {
        for (const anchor of cps.filter((c) => c.role === "anchor")) {
          const a = shape.transformPointToDevice(anchor.local.x, anchor.local.y);
          r.strokeLine(a.x, a.y, d.x, d.y, guideColor, 1);
        }
      } else if (shape instanceof BezierCubic) {
        const anchorIdx = cp.index === 1 ? 0 : 3;
        const anchor = cps.find((c) => c.index === anchorIdx);
        if (anchor) {
          const a = shape.transformPointToDevice(anchor.local.x, anchor.local.y);
          r.strokeLine(a.x, a.y, d.x, d.y, guideColor, 1);
        }
      }
    }
  }
}

export const MIN_SIZE = 12;

export function applyResize(
  shape: Shape,
  handle: ResizeHandle,
  startBounds: Bounds,
  pointerLocal: { x: number; y: number },
  startShapeData: Record<string, number>
) {
  let { minX, minY, maxX, maxY } = startBounds;
  const lx = pointerLocal.x;
  const ly = pointerLocal.y;

  let newMinX = minX;
  let newMinY = minY;
  let newMaxX = maxX;
  let newMaxY = maxY;

  if (handle.includes("w")) newMinX = lx;
  if (handle.includes("e")) newMaxX = lx;
  if (handle.includes("n")) newMinY = ly;
  if (handle.includes("s")) newMaxY = ly;

  if (newMaxX - newMinX < MIN_SIZE) {
    if (handle.includes("w")) newMinX = newMaxX - MIN_SIZE;
    else newMaxX = newMinX + MIN_SIZE;
  }
  if (newMaxY - newMinY < MIN_SIZE) {
    if (handle.includes("n")) newMinY = newMaxY - MIN_SIZE;
    else newMaxY = newMinY + MIN_SIZE;
  }

  const oldCx = (minX + maxX) / 2;
  const oldCy = (minY + maxY) / 2;
  const newCx = (newMinX + newMaxX) / 2;
  const newCy = (newMinY + newMaxY) / 2;

  const newW = newMaxX - newMinX;
  const newH = newMaxY - newMinY;
  const oldW = maxX - minX;
  const oldH = maxY - minY;

  if (shape instanceof Line) {
    // Для линии: масштабируем точки и НЕ трогаем transform
    const sx = oldW > 0 ? newW / oldW : 1;
    const sy = oldH > 0 ? newH / oldH : 1;
    
    // Восстанавливаем начальные точки
    if (startShapeData.x1 !== undefined) shape.x1 = startShapeData.x1;
    if (startShapeData.y1 !== undefined) shape.y1 = startShapeData.y1;
    if (startShapeData.x2 !== undefined) shape.x2 = startShapeData.x2;
    if (startShapeData.y2 !== undefined) shape.y2 = startShapeData.y2;
    
    // Масштабируем относительно СТАРОГО центра
    shape.x1 = oldCx + (shape.x1 - oldCx) * sx;
    shape.y1 = oldCy + (shape.y1 - oldCy) * sy;
    shape.x2 = oldCx + (shape.x2 - oldCx) * sx;
    shape.y2 = oldCy + (shape.y2 - oldCy) * sy;
    
    // Корректируем transform с учётом смещения центра
    const deltaLocalX = newCx - oldCx;
    const deltaLocalY = newCy - oldCy;
    
    // Поворачиваем смещение в device space
    const rot = startShapeData.rotation ?? shape.transform.rotation;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const deltaDeviceX = deltaLocalX * cos - deltaLocalY * sin;
    const deltaDeviceY = deltaLocalX * sin + deltaLocalY * cos;
    
    shape.transform.x = (startShapeData.tx ?? shape.transform.x) + deltaDeviceX;
    shape.transform.y = (startShapeData.ty ?? shape.transform.y) + deltaDeviceY;
    
    // Не трогаем rotation и scale
    return;
  }

  if (shape instanceof Rect) {
    shape.w = newW;
    shape.h = newH;

    const rot = startShapeData.rotation ?? shape.transform.rotation;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const deltaLocal = { x: newCx - oldCx, y: newCy - oldCy };
    const deltaDevice = {
      x: deltaLocal.x * cos - deltaLocal.y * sin,
      y: deltaLocal.x * sin + deltaLocal.y * cos
    };

    shape.transform.x = (startShapeData.tx ?? shape.transform.x) + deltaDevice.x;
    shape.transform.y = (startShapeData.ty ?? shape.transform.y) + deltaDevice.y;
  } else if (shape instanceof Oval) {
    shape.rx = newW / 2;
    shape.ry = newH / 2;

    const rot = startShapeData.rotation ?? shape.transform.rotation;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const deltaLocal = { x: newCx - oldCx, y: newCy - oldCy };
    const deltaDevice = {
      x: deltaLocal.x * cos - deltaLocal.y * sin,
      y: deltaLocal.x * sin + deltaLocal.y * cos
    };

    shape.transform.x = (startShapeData.tx ?? shape.transform.x) + deltaDevice.x;
    shape.transform.y = (startShapeData.ty ?? shape.transform.y) + deltaDevice.y;
  } else {
    // Для кривых: применяем scale к transform
    const sx = oldW > 0 ? newW / oldW : 1;
    const sy = oldH > 0 ? newH / oldH : 1;
    
    shape.transform.scaleX = (startShapeData.scaleX ?? 1) * sx;
    shape.transform.scaleY = (startShapeData.scaleY ?? 1) * sy;
  }
}