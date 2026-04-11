import { useRef, useEffect } from 'react';
import type { LineAlg } from "../lib/raster/RasterRenderer";
import { RasterRenderer } from "../lib/raster/RasterRenderer";

interface CanvasSceneProps {
  // shapes: Shape[];
  // selectedId: string | null;
  // onSelect: (id: string | null) => void;
  // onUpdate: () => void;
  // overlayTick: number;
  lineAlg: LineAlg;
}

const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RasterRenderer>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setLineAlgorithm(lineAlg);
    }
  }, [lineAlg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg);
    rendererRef.current = renderer;

    const ro = new ResizeObserver(() => {
      renderer.resize();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    } else {
      ro.observe(canvas);
    }

    let raf = 0;

    const frame = () => {
      const r = rendererRef.current;
      if (r) {
        r.beginFrame(true);
        const baseSize = 700;
        const scale = Math.min(r.width / baseSize, r.height / baseSize);
        const sceneW = baseSize * scale;
        const sceneH = baseSize * scale;
        const offsetX = Math.floor((r.width - sceneW) / 2);
        const offsetY = Math.floor((r.height - sceneH) / 2);
        const mapPoint = (x: number, y: number) => ({
          x: Math.round(offsetX + x * scale),
          y: Math.round(offsetY + y * scale),
        });
        const mapLineWidth = (w: number) => Math.max(1, w * scale);

        // Нарисовать фигуры (Пока фигур нет, этот код
        // закомментирован)
        // for (const shape of shapes) {
        //   shape.drawRaster(r);
        // }

        // Попробуйте нарисвать красный полигон с черной обводкой
        // или что-нибудь ещё
        const pLine1Start = mapPoint(50, 50);
        const pLine1End = mapPoint(500, 500);
        r.drawLine(pLine1Start.x, pLine1Start.y, pLine1End.x, pLine1End.y, { r: 0, g: 0, b: 0, a: 255 });
        const pts = [
          mapPoint(100, 100),
          mapPoint(600, 100),
          mapPoint(50, 600),
        ];

        const red = { r: 255, g: 0, b: 0, a: 255 };
        const black = { r: 0, g: 0, b: 0, a: 255 };
        const blue = { r: 0, g: 0, b: 255, a: 255 };
        const p2s = mapPoint(50, 50);
        const p2e = mapPoint(500, 100);
        const p3s = mapPoint(50, 70);
        const p3e = mapPoint(500, 200);
        const p4s = mapPoint(50, 90);
        const p4e = mapPoint(500, 400);
        const p5s = mapPoint(50, 110);
        const p5e = mapPoint(500, 600);
        r.drawLine(p2s.x, p2s.y, p2e.x, p2e.y, blue);
        r.drawLine(p3s.x, p3s.y, p3e.x, p3e.y, blue);
        r.drawLine(p4s.x, p4s.y, p4e.x, p4e.y, blue);
        r.drawLine(p5s.x, p5s.y, p5e.x, p5e.y, blue);
        r.strokeLine(
          pLine1Start.x,
          pLine1Start.y,
          pLine1End.x,
          pLine1End.y,
          { r: 0, g: 0, b: 255, a: 255 },
          mapLineWidth(5),
        );
        r.fillPolygon(pts, red);
        const circleCenter = mapPoint(300, 300);
        r.fillCircle(circleCenter.x, circleCenter.y, Math.max(1, Math.round(50 * scale)), blue);
        r.strokePolygon(pts, black, mapLineWidth(0.5));
        
        r.commit();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default CanvasScene;