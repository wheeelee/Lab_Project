import { Shape } from "../shapes/Shape";
import { Rect } from "../shapes/Rect";
import { Oval } from "../shapes/Oval";
import { Triangle } from "../shapes/Triangle";
import { Line } from "../shapes/Line";
import { BezierQuadratic } from "../shapes/BezierQuadratic";
import { BezierCubic } from "../shapes/BezierCubic";
import { PathBezier } from "../shapes/PathBezier";

export function getShapeLabel(shape: Shape): string {
  if (shape instanceof Rect) return "Прямоугольник";
  if (shape instanceof Oval) return "Овал";
  if (shape instanceof Triangle) return "Треугольник";
  if (shape instanceof Line) return "Линия";
  if (shape instanceof BezierQuadratic) return "Кривая (квадр.)";
  if (shape instanceof BezierCubic) return "Кривая (куб.)";
  if (shape instanceof PathBezier) return `Путь (${shape.mode})`;
  return "Объект";
}
