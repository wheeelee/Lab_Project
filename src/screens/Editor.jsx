import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useParams, Link } from 'react-router-dom';

function Editor({ projects }) {
  const { id } = useParams();
  const project = projects.find(p => p.id.toString() === id.toString());
  const MotionLink = motion(Link);
  return (
    <div className="h-screen flex flex-col bg-white text-black"> 
      <header className="h-14 border-b flex items-center bg-slate-800">
      <AnimatePresence>
        <Link title="Назад" to="/">
        <motion.button  className="flex items-center justify-center bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded m-4 w-20 h-10"
        whileHover={{ scale: 1.1}}
        transition={{type:"tween",stiffness:100}}
        whileTap={{ scale: 1 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, y: -20 }}>
        Назад
        </motion.button>
        </Link>
      </AnimatePresence>
        <span className="font-bold py-2 px-4 text-white text-2xl flex-row items-center justify-center">Название проекта: {project.name}</span>
        <AnimatePresence>
        <motion.div className="font-bold py-2 px-4 text-white bg-green-600 rounded hover:bg-green-500 m-4"
        whileHover={{ scale: 1.1}}
        transition={{type:"tween",stiffness:100}}
        whileTap={{ scale: 1 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, y: -20 }}>
          Сохранить
        </motion.div>
      </AnimatePresence>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="relative z-10 w-16 border-r bg-slate-700 flex flex-col items-center gap-4"> {/* Инструменты */} 
          <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          className="w-10 h-10 text-black cursor-pointer m-5"
          strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          </svg>
          <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          className="w-10 h-10 text-black cursor-pointer  m-5"
          strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" strokeWidth="2" />
          </svg>
          <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          className="w-10 h-10 text-black cursor-pointer  m-5"
          strokeWidth="2">
          <path d="M12 3L21 20H3L12 3Z" strokeWidth="2" />
          </svg>
        </aside>
        <main className="flex-1 bg-white p-10">
           {/* <h1>Холст проекта: {project.name}</h1> */}
        </main>
        <aside className="w-64 border-l bg-slate-700"> {/* Свойства */} </aside>
      </div>
    </div>
  );
}

export default Editor;
