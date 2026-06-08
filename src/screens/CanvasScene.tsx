import { useEffect, useRef } from "react";
import { RasterRenderer, LineAlg } from "../lib/raster/RasterRenderer";
import { Shape } from "../lib/shapes/Shape";

interface Props {
  lineAlg: LineAlg;
  shapes: Shape[];
}

export default function CanvasScene({ lineAlg, shapes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg);
    rendererRef.current = renderer;

    let raf = 0;

    const loop = () => {
      renderer.beginFrame(true);

      for (const s of shapes) {
        s.drawRaster(renderer);
      }

      renderer.commit();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [shapes, lineAlg]);

  return <canvas ref={canvasRef} className="w-full h-full block bg-white" />;
}