import { useEffect, useRef } from "react";
import { RasterRenderer, LineAlg } from "../lib/raster/RasterRenderer";
import { Shape } from "../lib/shapes/Shape";
import { EditorInteraction } from "../lib/editor/interaction";
import { drawSelectionOverlay } from "../lib/editor/selection";
import { pointerToDevice } from "../lib/editor/coords";

interface Props {
  lineAlg: LineAlg;
  shapes: Shape[];
  selectedId: string | null;
  interaction: EditorInteraction;
  interactionEnabled?: boolean;
  onCreateShape?: (x: number, y: number) => void;
}

export default function CanvasScene({
  lineAlg,
  shapes,
  selectedId,
  interaction,
  interactionEnabled = true,
  onCreateShape,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shapesRef = useRef(shapes);
  const selectedRef = useRef(selectedId);
  const interactionEnabledRef = useRef(interactionEnabled);
  const onCreateShapeRef = useRef(onCreateShape);

  shapesRef.current = shapes;
  selectedRef.current = selectedId;
  interactionEnabledRef.current = interactionEnabled;
  onCreateShapeRef.current = onCreateShape;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg);

    const ro = new ResizeObserver(() => renderer.resize());
    ro.observe(canvas);

    let raf = 0;

    const loop = () => {
      renderer.beginFrame(true);

      for (const s of shapesRef.current) {
        s.drawRaster(renderer);
      }

      const sel = selectedRef.current
        ? shapesRef.current.find((s) => s.id === selectedRef.current) ?? null
        : null;

      if (sel) {
        drawSelectionOverlay(renderer, sel, interaction.getHoveredTarget());
      }

      renderer.commit();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      if (interactionEnabledRef.current) {
        interaction.onPointerMove(canvas, e);
      }
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      const create = onCreateShapeRef.current;
      if (!interactionEnabledRef.current && create) {
        const pt = pointerToDevice(canvas, e.clientX, e.clientY);
        create(pt.x, pt.y);
        return;
      }
      if (interactionEnabledRef.current) {
        interaction.onPointerDown(canvas, e);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (interactionEnabledRef.current) {
        interaction.onPointerUp(canvas, e);
      }
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      renderer.dispose();
    };
  }, [lineAlg, interaction]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block bg-white touch-none"
    />
  );
}
