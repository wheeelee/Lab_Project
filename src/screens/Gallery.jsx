import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Gallery({ projects, addProject }) {
  const [name, setName] = useState("");

  return (
    <div>
      <div className="flex justify-between items-center pr-8">
        <motion.div
          className="text-5xl mb-4 pl-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Галерея проектов
        </motion.div>

        <div className="flex gap-2 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название проекта"
            className="border px-2 py-1 rounded"
          />

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#3b82f6" }}
            whileTap={{ scale: 1 }}
            onClick={() => {
              if (!name.trim()) return;
              addProject(name.trim());
              setName("");
            }}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
          >
            Создать проект
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 justify-center items-left">
        <AnimatePresence>
          {projects.map(project => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 0.95 }}
              whileTap={{ scale: 0.7 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="border rounded p-4 hover:border-blue-400 w-screen flex-row gap-4 justify-left"
            >
              <Link to={`/editor/${project.id}`} className="block">
                <h3 className="text-xl">{project.name}</h3>
                <p className="text-gray-400">Дата: {project.date}</p>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Gallery;