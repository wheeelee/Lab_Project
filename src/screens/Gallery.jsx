
import {motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function Gallery({ projects }) {
  return (
    <div>
      <AnimatePresence>
        <motion.div className="text-5xl mb-4 pl-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -20 }}>
          Галерея проектов
        </motion.div>
      </AnimatePresence>
      <div className="grid gap-4 justify-center items-center">
        {projects.map(project => (
          <Link 
            key={project.id}
            to={`/editor/${project.id}`} 
            className="block"
          >
            <AnimatePresence>
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 0.95 }}
                whileTap={{ scale: 0.7 }}
                transition={{ type: "tween", duration: 0.3 }}
                className="border rounded p-4 hover:border-blue-400 w-screen flex-row gap-4 justify-center"
              >
    <h3 className="text-xl">{project.name}</h3>
    <p className="text-gray-400">Дата: {project.date}</p>
  </motion.div>
</AnimatePresence>
        </Link>
        ))}
      </div>
    </div>
  );
}

export default Gallery;