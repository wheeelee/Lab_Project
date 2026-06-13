import { mat3, Mat3 } from "../math/mat3";
import { Transform } from "../math/Transform";
import { Shape } from "../shapes/Shape";

export function pointerToDevice(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { x: 0, y: 0 };
  }
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function cloneTransform(t: Transform) {
  const c = new Transform();
  c.x = t.x;
  c.y = t.y;
  c.rotation = t.rotation;
  c.scaleX = t.scaleX;
  c.scaleY = t.scaleY;
  return c;
}

export function deviceToLocalAtMatrix(
  px: number,
  py: number,
  matrix: ReturnType<Transform["toMatrix"]>
) {
  const inv = mat3.invert(matrix);
  if (!inv) return { x: px, y: py };
  return mat3.transformPoint(inv, px, py);
}

export function captureDeviceToLocal(shape: Shape): Mat3 | null {
  return mat3.invert(shape.getLocalToDeviceMatrix());
}

export function pointerToShapeLocal(
  shape: Shape,
  px: number,
  py: number,
  frozenDeviceToLocal?: Mat3 | null
): { x: number; y: number } {
  const inv = frozenDeviceToLocal ?? captureDeviceToLocal(shape);
  if (!inv) return { x: px, y: py };
  return mat3.transformPoint(inv, px, py);
}

export function localToDeviceAtMatrix(
  lx: number,
  ly: number,
  matrix: ReturnType<Transform["toMatrix"]>
) {
  return mat3.transformPoint(matrix, lx, ly);
}
