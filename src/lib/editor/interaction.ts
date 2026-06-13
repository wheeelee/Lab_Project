import { Shape } from "../shapes/Shape";
import { Rect } from "../shapes/Rect";
import { Oval } from "../shapes/Oval";
import { mat3 } from "../math/mat3";
import { PathBezier } from "../shapes/PathBezier";
import {
  pointerToDevice,
  deviceToLocalAtMatrix,
  captureDeviceToLocal,
  pointerToShapeLocal,
} from "./coords";
import { DragSession, HitTarget } from "./types";
import {
  findShapeAt,
  hitTestSelection,
  applyResize,
} from "./selection";
import {
  setControlPointLocal,
  getControlPointLocal,
} from "./controlPoints";

export interface EditorCallbacks {
  onSelectionChange: (id: string | null) => void;
  onShapesChange: () => void;
  getSelectedId: () => string | null;
  getShapes: () => Shape[];
}

export class EditorInteraction {
  private session: DragSession | null = null;
  private hoveredTarget: HitTarget = { kind: "none" };
  private startMatrix: ReturnType<Shape["getLocalToDeviceMatrix"]> | null = null;

  constructor(private cb: EditorCallbacks) {}

  getHoveredTarget() {
    return this.hoveredTarget;
  }

  getSession() {
    return this.session;
  }

  private getSelected(): Shape | null {
    const id = this.cb.getSelectedId();
    if (!id) return null;
    return this.cb.getShapes().find((s) => s.id === id) ?? null;
  }

  onPointerMove(canvas: HTMLCanvasElement, e: PointerEvent) {
    const pt = pointerToDevice(canvas, e.clientX, e.clientY);

    if (this.session) {
      this.applyDrag(pt);
      return;
    }

    const selected = this.getSelected();
    if (selected) {
      this.hoveredTarget = hitTestSelection(selected, pt.x, pt.y);
    } else {
      const hit = findShapeAt(this.cb.getShapes(), pt.x, pt.y);
      this.hoveredTarget = hit
        ? { kind: "shape", shapeId: hit.id }
        : { kind: "none" };
    }

    this.updateCursor(canvas);
  }

  onPointerDown(canvas: HTMLCanvasElement, e: PointerEvent) {
    const pt = pointerToDevice(canvas, e.clientX, e.clientY);
    const shapes = this.cb.getShapes();
    const selected = this.getSelected();

    let target: HitTarget = { kind: "none" };

    if (selected) {
      target = hitTestSelection(selected, pt.x, pt.y);
    }

    if (target.kind === "none") {
      const hit = findShapeAt(shapes, pt.x, pt.y);
      if (hit) {
        target = { kind: "shape", shapeId: hit.id };
        this.cb.onSelectionChange(hit.id);
      } else {
        this.cb.onSelectionChange(null);
        return;
      }
    }

    const shape =
      shapes.find((s) => s.id === (target.kind === "shape" ? target.shapeId : selected?.id)) ??
      selected;
    if (!shape) return;

    canvas.setPointerCapture(e.pointerId);

    const t = shape.transform;
    this.startMatrix = shape.getLocalToDeviceMatrix();
    const startDeviceToLocal = captureDeviceToLocal(shape);

    const session: DragSession = {
      mode: "idle",
      shapeId: shape.id,
      startPointer: pt,
      startTransform: {
        x: t.x,
        y: t.y,
        rotation: t.rotation,
        scaleX: t.scaleX,
        scaleY: t.scaleY,
      },
      startBounds: { ...shape.getLocalBounds() },
      startShapeData: {
        tx: t.x,
        ty: t.y,
        rotation: t.rotation,
        scaleX: t.scaleX,
        scaleY: t.scaleY,
      },
      startDeviceToLocal: startDeviceToLocal ?? undefined,
    };

    if (target.kind === "controlPoint" && e.shiftKey && shape instanceof PathBezier) {
      shape.removePoint(target.index);
      this.cb.onShapesChange();
      return;
    }

    if (
      shape instanceof PathBezier &&
      e.altKey &&
      target.kind === "shape" &&
      startDeviceToLocal
    ) {
      const local = mat3.transformPoint(startDeviceToLocal, pt.x, pt.y);
      shape.addPointLocal(local);
      this.cb.onShapesChange();
      return;
    }

    if (shape instanceof Rect) {
      session.startShapeData.w = shape.w;
      session.startShapeData.h = shape.h;
    } else if (shape instanceof Oval) {
      session.startShapeData.rx = shape.rx;
      session.startShapeData.ry = shape.ry;
    }

    if (target.kind === "resize") {
      session.mode = "resize";
      session.resizeHandle = target.handle;
    } else if (target.kind === "rotate") {
      session.mode = "rotate";
    } else if (target.kind === "controlPoint") {
      session.mode = "editPoint";
      session.controlPointIndex = target.index;
      const cpLocal = getControlPointLocal(shape, target.index);
      if (cpLocal && startDeviceToLocal) {
        session.startPointerLocal = mat3.transformPoint(
          startDeviceToLocal,
          pt.x,
          pt.y
        );
        session.startControlPointLocal = { x: cpLocal.x, y: cpLocal.y };
      }
    } else {
      session.mode = "move";
    }

    this.session = session;
    this.updateCursor(canvas);
  }

  onPointerUp(canvas: HTMLCanvasElement, e: PointerEvent) {
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (this.session) {
      this.session = null;
      this.startMatrix = null;
      this.cb.onShapesChange();
    }
    this.updateCursor(canvas);
  }

  private applyDrag(pt: { x: number; y: number }) {
    const session = this.session;
    if (!session || !this.startMatrix) return;

    const shape = this.cb.getShapes().find((s) => s.id === session.shapeId);
    if (!shape) return;

    const dx = pt.x - session.startPointer.x;
    const dy = pt.y - session.startPointer.y;

    if (session.mode === "move") {
      shape.transform.x = session.startTransform.x + dx;
      shape.transform.y = session.startTransform.y + dy;
      return;
    }

    if (session.mode === "rotate") {
      const cx = session.startTransform.x;
      const cy = session.startTransform.y;
      const a0 = Math.atan2(
        session.startPointer.y - cy,
        session.startPointer.x - cx
      );
      const a1 = Math.atan2(pt.y - cy, pt.x - cx);
      shape.transform.rotation =
        session.startTransform.rotation + (a1 - a0);
      return;
    }

    if (session.mode === "resize" && session.resizeHandle && session.startBounds) {
      shape.transform.x = session.startTransform.x;
      shape.transform.y = session.startTransform.y;
      shape.transform.rotation = session.startTransform.rotation;
      shape.transform.scaleX = session.startTransform.scaleX;
      shape.transform.scaleY = session.startTransform.scaleY;

      const sd = session.startShapeData ?? {};
      if (shape instanceof Rect && sd.w !== undefined && sd.h !== undefined) {
        shape.w = sd.w;
        shape.h = sd.h;
      } else if (shape instanceof Oval && sd.rx !== undefined && sd.ry !== undefined) {
        shape.rx = sd.rx;
        shape.ry = sd.ry;
      }

      const pointerLocal = session.startDeviceToLocal
        ? mat3.transformPoint(session.startDeviceToLocal, pt.x, pt.y)
        : deviceToLocalAtMatrix(pt.x, pt.y, this.startMatrix);

      applyResize(
        shape,
        session.resizeHandle,
        session.startBounds,
        pointerLocal,
        session.startShapeData ?? {}
      );
      return;
    }

    if (
      session.mode === "editPoint" &&
      session.controlPointIndex !== undefined &&
      session.startDeviceToLocal &&
      session.startPointerLocal &&
      session.startControlPointLocal
    ) {
      const currentLocal = pointerToShapeLocal(
        shape,
        pt.x,
        pt.y,
        session.startDeviceToLocal
      );
      const dlx = currentLocal.x - session.startPointerLocal.x;
      const dly = currentLocal.y - session.startPointerLocal.y;
      setControlPointLocal(shape, session.controlPointIndex, {
        x: session.startControlPointLocal.x + dlx,
        y: session.startControlPointLocal.y + dly,
      });
    }
  }

  private updateCursor(canvas: HTMLCanvasElement) {
    if (this.session) {
      canvas.style.cursor = "grabbing";
      return;
    }

    const h = this.hoveredTarget;
    if (h.kind === "rotate") {
      canvas.style.cursor = "grab";
    } else if (h.kind === "resize") {
      const cursors: Record<string, string> = {
        nw: "nwse-resize",
        se: "nwse-resize",
        ne: "nesw-resize",
        sw: "nesw-resize",
        n: "ns-resize",
        s: "ns-resize",
        e: "ew-resize",
        w: "ew-resize",
      };
      canvas.style.cursor = cursors[h.handle] ?? "default";
    } else if (h.kind === "controlPoint") {
      canvas.style.cursor = "crosshair";
    } else if (h.kind === "shape") {
      canvas.style.cursor = "move";
    } else {
      canvas.style.cursor = "default";
    }
  }
}

export function moveLayer(shapes: Shape[], id: string, direction: "up" | "down" | "top" | "bottom") {
  const idx = shapes.findIndex((s) => s.id === id);
  if (idx < 0) return shapes;

  const next = [...shapes];
  const [item] = next.splice(idx, 1);

  if (direction === "up" && idx < shapes.length - 1) {
    next.splice(idx + 1, 0, item);
  } else if (direction === "down" && idx > 0) {
    next.splice(idx - 1, 0, item);
  } else if (direction === "top") {
    next.push(item);
  } else if (direction === "bottom") {
    next.unshift(item);
  } else {
    next.splice(idx, 0, item);
  }

  return next;
}

export function deleteShape(shapes: Shape[], id: string): Shape[] {
  return shapes.filter((s) => s.id !== id);
}
