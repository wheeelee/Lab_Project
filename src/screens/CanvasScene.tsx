import { useRef, useEffect } from "react";
import type { LineAlg } from "../lib/raster/RasterRenderer";
import { RasterRenderer } from "../lib/raster/RasterRenderer";
import { Shape } from "../lib/shapes/Shape";

interface CanvasSceneProps {
  lineAlg: LineAlg;
  shapes: Shape[];
}

const CanvasScene = ({ lineAlg, shapes }: CanvasSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setLineAlgorithm(lineAlg);
    }
  }, [lineAlg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg);
    rendererRef.current = renderer;

    const ro = new ResizeObserver(() => {
      renderer.resize();
    });

    ro.observe(containerRef.current ?? canvas);

    let raf = 0;

    const frame = () => {
      const r = rendererRef.current;
      if (!r) return;

      r.beginFrame(true);

      for (const shape of shapes) {
        shape.drawRaster(r);
      }

      r.commit();
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [shapes, lineAlg]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default CanvasScene;