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

  // react to lineAlg changes
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

        // Нарисовать фигуры (Пока фигур нет, этот код
        // закомментирован)
        // for (const shape of shapes) {
        //   shape.drawRaster(r);
        // }

        // Попробуйте нарисвать красный полигон с черной обводкой
        // или что-нибудь ещё
        r.drawLine(50, 50, 500, 500, { r: 0, g: 0, b: 0, a: 255 });
        const pts = [
          { x: 100, y: 100 },
          { x: 600, y: 100 },
          { x: 50, y: 600 },
        ];

        const red = { r: 255, g: 0, b: 0, a: 255 };
        const black = { r: 0, g: 0, b: 0, a: 255 };
        const blue = { r: 0, g: 0, b: 255, a: 255 };
        r.drawLine(50, 50, 500, 100, blue);
        r.drawLine(50, 70, 500, 200, blue);
        r.drawLine(50, 90, 500, 400, blue);
        r.drawLine(50, 110, 500, 600, blue);
        r.strokeLine(50, 50, 500, 500, { r: 0, g: 0, b: 255, a: 255 }, 5);
        r.fillPolygon(pts, red);
        r.fillCircle(300, 300, 50, blue);
        r.strokePolygon(pts, black, 0.5);
        
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