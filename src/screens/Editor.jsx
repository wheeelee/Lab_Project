import { motion } from "framer-motion";
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import CanvasScene from "./CanvasScene";

import { EditorInteraction, moveLayer, deleteShape } from "../lib/editor/interaction";
import { createShape } from "../lib/editor/shapeFactory";
import { getShapeLabel } from "../lib/editor/shapeNames";
import { loadProject, restoreShapes, saveProject } from "../lib/projectStorage";

const LineAlg = {
  BRESENHAM: "bresenham",
  WU: "wu",
};

const TOOLS = [
  { id: "select", label: "Выбор", title: "Выбор и перемещение" },
  { id: "rect", label: "□", title: "Прямоугольник" },
  { id: "oval", label: "○", title: "Овал" },
  { id: "triangle", label: "△", title: "Треугольник" },
  { id: "line", label: "╱", title: "Линия" },
  { id: "bezierQuad", label: "⌒", title: "Квадр. кривая" },
  { id: "bezierCubic", label: "∿", title: "Куб. кривая" },
  { id: "path", label: "✎", title: "Путь" },
];

function Editor({ projects, onProjectSaved }) {
  const { id } = useParams();
  const project = projects.find((p) => p.id === Number(id));

  const [alg, setAlg] = useState(LineAlg.BRESENHAM);
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const shapesRef = useRef(shapes);
  const selectedRef = useRef(selectedId);
  const activeToolRef = useRef(activeTool);
  shapesRef.current = shapes;
  selectedRef.current = selectedId;
  activeToolRef.current = activeTool;

  const bumpShapes = useCallback(() => {
    setShapes((prev) => [...prev]);
  }, []);

  const interaction = useMemo(
    () =>
      new EditorInteraction({
        getShapes: () => shapesRef.current,
        getSelectedId: () => selectedRef.current,
        onSelectionChange: (sid) => setSelectedId(sid),
        onShapesChange: bumpShapes,
      }),
    [bumpShapes]
  );

  const handleCreateShape = useCallback((x, y) => {
    const tool = activeToolRef.current;
    if (tool === "select") return;
    const shape = createShape(tool, x, y);
    if (!shape) return;
    setShapes((prev) => [...prev, shape]);
    setSelectedId(shape.id);
    setActiveTool("select");
  }, []);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setShapes((prev) => deleteShape(prev, selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleLayerMove = useCallback(
    (direction) => {
      if (!selectedId) return;
      setShapes((prev) => moveLayer(prev, selectedId, direction));
    },
    [selectedId]
  );

  useEffect(() => {
    if (!project) return;

    let cancelled = false;
    setLoading(true);

    loadProject(project.id).then((data) => {
      if (cancelled) return;
      if (data) {
        setShapes(restoreShapes(data));
        setAlg(data.lineAlg ?? LineAlg.BRESENHAM);
      } else {
        setShapes([]);
        setAlg(LineAlg.BRESENHAM);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  const handleSave = useCallback(async () => {
    if (!project || saving) return;

    setSaving(true);
    setSaveMessage("");
    try {
      await saveProject(project.id, project.name, alg, shapes, project.createdAt);
      await onProjectSaved?.();
      setSaveMessage("Сохранено");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, [project, alg, shapes, saving, onProjectSaved]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        handleDelete();
      }
      if (e.key === "]" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleLayerMove(e.shiftKey ? "top" : "up");
      }
      if (e.key === "[" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleLayerMove(e.shiftKey ? "bottom" : "down");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDelete, handleLayerMove]);

  if (!project) {
    return <div className="text-white p-4">Проект не найден</div>;
  }

  if (loading) {
    return <div className="text-white p-4">Загрузка проекта...</div>;
  }

  const reversedLayers = [...shapes].reverse();

  return (
    <div className="h-screen flex flex-col bg-slate-800 text-black">
      <header className="h-14 border-b flex items-center bg-slate-800 px-2 sm:px-4 shrink-0">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link
            to="/"
            className="flex items-center justify-center bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded m-1 sm:m-4 w-16 sm:w-20 h-8 sm:h-10"
          >
            Назад
          </Link>
        </motion.div>

        <span className="font-bold px-2 sm:px-4 text-white text-lg sm:text-2xl truncate">
          {project.name}
        </span>

        <div className="flex gap-1 ml-4">
          {TOOLS.map((t) => (
            <motion.button
              key={t.id}
              title={t.title}
              onClick={() => setActiveTool(t.id)}
              className={`px-2 py-1 rounded text-white text-sm min-w-8 ${
                activeTool === t.id ? "bg-blue-500" : "bg-slate-600 hover:bg-slate-500"
              }`}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto mr-2">
          <motion.button
            onClick={() => setAlg(LineAlg.BRESENHAM)}
            className={`px-3 py-1 rounded text-white text-sm ${
              alg === LineAlg.BRESENHAM ? "bg-blue-500" : "bg-slate-600"
            }`}
          >
            Bresenham
          </motion.button>
          <motion.button
            onClick={() => setAlg(LineAlg.WU)}
            className={`px-3 py-1 rounded text-white text-sm ${
              alg === LineAlg.WU ? "bg-blue-500" : "bg-slate-600"
            }`}
          >
            Wu
          </motion.button>
        </div>

        <motion.button
          onClick={handleDelete}
          disabled={!selectedId}
          className={`font-bold px-3 py-1 text-white rounded text-sm mr-2 ${
            selectedId ? "bg-red-600 hover:bg-red-500" : "bg-slate-600 opacity-50"
          }`}
        >
          Удалить
        </motion.button>

        <motion.button
          onClick={handleSave}
          disabled={saving}
          className={`font-bold px-3 py-1 text-white rounded text-sm ${
            saving ? "bg-green-800 opacity-70" : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </motion.button>
        {saveMessage && (
          <span className="text-white text-sm ml-2">{saveMessage}</span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-52 bg-slate-700 text-white flex flex-col shrink-0 border-r border-slate-600">
          <div className="px-3 py-2 font-semibold text-sm border-b border-slate-600">
            Слои
          </div>
          <div className="flex-1 overflow-y-auto">
            {reversedLayers.map((shape, i) => {
              const isSelected = shape.id === selectedId;
              return (
                <button
                  key={shape.id}
                  onClick={() => setSelectedId(shape.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-slate-600/50 truncate ${
                    isSelected
                      ? "bg-blue-600"
                      : "hover:bg-slate-600"
                  }`}
                >
                  <span className="text-slate-400 mr-1">{shapes.length - i}.</span>
                  {getShapeLabel(shape)}
                </button>
              );
            })}
          </div>
          <div className="px-2 py-1 text-[10px] text-slate-400 border-t border-slate-600 leading-tight">
            Кривые: зелёные — якоря, фиолетовые — контрольные.
            Путь: Alt+клик — точка, Shift+клик по точке — удалить.
          </div>
          <div className="p-2 border-t border-slate-600 flex flex-col gap-1">
            <button
              disabled={!selectedId}
              onClick={() => handleLayerMove("up")}
              className="px-2 py-1 text-xs bg-slate-600 rounded disabled:opacity-40 hover:bg-slate-500"
            >
              ↑ Выше
            </button>
            <button
              disabled={!selectedId}
              onClick={() => handleLayerMove("down")}
              className="px-2 py-1 text-xs bg-slate-600 rounded disabled:opacity-40 hover:bg-slate-500"
            >
              ↓ Ниже
            </button>
            <button
              disabled={!selectedId}
              onClick={() => handleLayerMove("top")}
              className="px-2 py-1 text-xs bg-slate-600 rounded disabled:opacity-40 hover:bg-slate-500"
            >
              ⇈ На верх
            </button>
            <button
              disabled={!selectedId}
              onClick={() => handleLayerMove("bottom")}
              className="px-2 py-1 text-xs bg-slate-600 rounded disabled:opacity-40 hover:bg-slate-500"
            >
              ⇊ Вниз
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-white rounded min-w-0 relative">
          {activeTool !== "select" && (
            <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded pointer-events-none">
              Кликните на холст, чтобы создать объект
            </div>
          )}
          <CanvasScene
            lineAlg={alg}
            shapes={shapes}
            selectedId={selectedId}
            interaction={interaction}
            interactionEnabled={activeTool === "select"}
            onCreateShape={handleCreateShape}
          />
        </main>
      </div>
    </div>
  );
}

export default Editor;
