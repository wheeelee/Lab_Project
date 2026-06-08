import { motion } from "framer-motion";
import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import CanvasScene from "./CanvasScene";

import { Rect } from "../lib/shapes/Rect";
import { Oval } from "../lib/shapes/Oval";
import { Triangle } from "../lib/shapes/Triangle";
import { Line } from "../lib/shapes/Line";
import { BezierCubic } from "../lib/shapes/BezierCubic";
import { BezierQuadratic } from "../lib/shapes/BezierQuadratic";
import { PathBezier } from "../lib/shapes/PathBezier";

const LineAlg = {
  BRESENHAM: "bresenham",
  WU: "wu",
};

function Editor({ projects }) {
  const { id } = useParams();
  const project = projects.find((p) => p.id === Number(id));

  const [alg, setAlg] = useState(LineAlg.BRESENHAM);

  const shapes = useMemo(() => {
    const rect = new Rect(150, 100);
    rect.transform.x = 150;
    rect.transform.y = 100;
    rect.transform.rotation = Math.PI / 12;
    rect.fillStyle = "#3b82f6";
    rect.fillOpacity = 0.8;

    const oval = new Oval(120, 80);
    oval.transform.x = 650;
    oval.transform.y = 100;
    oval.fillStyle = "#fbbf24";
    oval.fillOpacity = 0.8;

    const triangle = new Triangle(0, -70, 80, 70, -80, 70);
    triangle.transform.x = 180;
    triangle.transform.y = 500;
    triangle.fillStyle = "#10b981";
    triangle.strokeStyle = "#064e3b";
    triangle.strokeWidth = 3;

    const line = new Line(-100, -80, 100, 80);
    line.transform.x = 700;
    line.transform.y = 500;
    line.strokeStyle = "#f59e0b";
    line.strokeWidth = 4;

    const bezier = new BezierQuadratic(-120, 0, 0, -170, 120, 0);
    bezier.transform.x = 430;
    bezier.transform.y = 200;
    bezier.strokeStyle = "#3b82f6";
    bezier.strokeWidth = 3;

    const line2 = new Line(-120, 0, 120, 0);
    line2.transform.x = 860;
    line2.transform.y = 400;
    line2.strokeStyle = "#3b82f6";
    line2.strokeWidth = 3;

    const cubic = new BezierCubic(
      -120, 0,
      -60, 140,
      60, -140,
      120, 0
    );
    cubic.transform.x = 430;
    cubic.transform.y = 380;
    cubic.strokeStyle = "#f97335";
    cubic.strokeWidth = 3;

    const path = new PathBezier(
      [
        { x: -100, y: 0 },
        { x: -45, y: -92 },
        { x: 0, y: -8 },
        { x: 45, y: 94 },
        { x: 100, y: 0 },
      ],
      "bezier",
      true
    );
    path.transform.x = 200;
    path.transform.y = 380;
    path.strokeStyle = "#22c55e";
    path.strokeWidth = 3;
    path.fillStyle = "#22c55e33";
    path.fillOpacity = 0.3;

    // ИЗМЕНЕННАЯ ФИГУРА С КАРТИНКИ
    const tripleLobed = new PathBezier(
      [
        { x: -290, y: -10 },    // 1. Старт из левого закругления горизонтальной линии

        { x: -200, y: -80 },   // 5. Control: направляем линию почти вертикально вниз
                { x: -250, y: -80 },   // 5. Control: направляем линию почти вертикально вниз

        { x: 100, y: 150 },   // 8. Control: вытягиваем нижнюю петлю вправо-вверх
        { x: 20, y: -90 },    // 9. Control: создаем верхний «горб» перед уходом вправо
        { x: 180, y: 15 },    // 11. Control: делаем резкий разворот обратно влево
      ],
      "catmull",
      true
    );
    tripleLobed.transform.x = 500;
    tripleLobed.transform.y = 250;
    tripleLobed.strokeStyle = "#ec4899";
    tripleLobed.strokeWidth = 2;
    tripleLobed.fillStyle = "#ec489922";
    tripleLobed.fillOpacity = 0.2;

    return [
      rect,
      oval,
      triangle,
      line,
      bezier,
      line2,
      cubic,
      path,
      tripleLobed,
    ];
  }, []);

  if (!project) {
    return <div className="text-white p-4">Проект не найден</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-800 text-black">
      <header className="h-14 border-b flex items-center bg-slate-800 px-2 sm:px-4">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link
            to="/"
            className="flex items-center justify-center bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded m-1 sm:m-4 w-16 sm:w-20 h-8 sm:h-10"
          >
            Назад
          </Link>
        </motion.div>

        <span className="font-bold px-2 sm:px-4 text-white text-lg sm:text-2xl truncate">
          Название проекта: {project.name}
        </span>

        <div className="flex gap-2 ml-auto mr-4">
          <motion.button
            onClick={() => setAlg(LineAlg.BRESENHAM)}
            className={`px-4 py-2 rounded text-white ${
              alg === LineAlg.BRESENHAM ? "bg-blue-500" : "bg-slate-600"
            }`}
          >
            Bresenham
          </motion.button>

          <motion.button
            onClick={() => setAlg(LineAlg.WU)}
            className={`px-4 py-2 rounded text-white ${
              alg === LineAlg.WU ? "bg-blue-500" : "bg-slate-600"
            }`}
          >
            Wu
          </motion.button>
        </div>

        <motion.div className="font-bold px-4 py-2 text-white bg-green-600 rounded">
          Сохранить
        </motion.div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-white rounded min-w-0">
          <CanvasScene lineAlg={alg} shapes={shapes} />
        </main>
      </div>
    </div>
  );
}

export default Editor;