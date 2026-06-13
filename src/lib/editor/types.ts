export type InteractionMode =
  | "idle"
  | "move"
  | "resize"
  | "rotate"
  | "editPoint";

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export type HitTarget =
  | { kind: "shape"; shapeId: string }
  | { kind: "resize"; handle: ResizeHandle }
  | { kind: "rotate" }
  | { kind: "controlPoint"; index: number }
  | { kind: "none" };

import { Mat3 } from "../math/mat3";

export interface DragSession {
  mode: InteractionMode;
  shapeId: string;
  startPointer: { x: number; y: number };
  startTransform: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  /** Frozen device→local matrix captured at pointerdown (transform must not change during drag). */
  startDeviceToLocal?: Mat3;
  resizeHandle?: ResizeHandle;
  controlPointIndex?: number;
  /** Pointer position in shape local space at drag start. */
  startPointerLocal?: { x: number; y: number };
  /** Control point position in shape local space at drag start. */
  startControlPointLocal?: { x: number; y: number };
  startBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  startShapeData?: Record<string, number>;
}

export type ShapeTool =
  | "select"
  | "rect"
  | "oval"
  | "triangle"
  | "line"
  | "bezierQuad"
  | "bezierCubic"
  | "path";
