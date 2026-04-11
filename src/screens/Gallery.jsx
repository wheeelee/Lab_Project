import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function Gallery({ projects, addProject }) {
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
        
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "#3b82f6" }}
          transition={{ type: "tween", stiffness: 100 }}
          whileTap={{ scale: 1 }}
          onClick={addProject}
          className="flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-4"
        >
          Создать проект
        </motion.button>
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