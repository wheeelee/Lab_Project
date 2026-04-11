import { motion } from "framer-motion";
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import CanvasScene from "./CanvasScene";

const LineAlg = {
  BRESENHAM: "bresenham",
  WU: "wu",
};

function Editor({ projects }) {
  const { id } = useParams();

  const project = projects.find((p) => p.id === Number(id));

  const [alg, setAlg] = useState(LineAlg.BRESENHAM);

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

    <div className="flex gap-1 sm:gap-2 ml-auto mr-2 sm:mr-4">
      <motion.button
        onClick={() => setAlg(LineAlg.BRESENHAM)}
        className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-white text-sm sm:text-base ${
          alg === LineAlg.BRESENHAM ? "bg-blue-500" : "bg-slate-600"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        Bresenham
      </motion.button>

      <motion.button
        onClick={() => setAlg(LineAlg.WU)}
        className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-white text-sm sm:text-base ${
          alg === LineAlg.WU ? "bg-blue-500" : "bg-slate-600"
        }`}
        whileTap={{ scale: 0.95 }}
      >
        Wu
      </motion.button>
    </div>

    <motion.div
      className="font-bold px-2 sm:px-4 py-1 sm:py-2 text-white bg-green-600 rounded hover:bg-green-500 m-1 sm:m-4 text-sm sm:text-base"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Сохранить
    </motion.div>
  </header>

  <div className="flex flex-1 overflow-hidden">
    <aside className="hidden sm:flex w-16 border-r bg-slate-700 flex-col items-center gap-4 rounded" />

    <main className="flex-1 bg-white  rounded min-w-0">
      <div className="w-full h-full">
        <CanvasScene lineAlg={alg} />
      </div>
    </main>

    <aside className="hidden lg:flex w-64 border-l bg-slate-700" />
  </div>
</div>
  );
}

export default Editor;