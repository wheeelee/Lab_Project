import { useState } from 'react';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import Gallery from './screens/Gallery.jsx';
import Editor from './screens/Editor.jsx';
import { motion } from "motion/react"

function App() {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Новый проект', date: new Date().toLocaleDateString('ru-RU')},
  ]);
  
  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: 'Новый проект',
      date: new Date().toLocaleDateString('ru-RU')
    };
    
    setProjects([...projects, newProject]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <h2 className="text-blue-600 text-6xl hover:text-blue-400 transition pt-5 flex items-center justify-center">Приложение с проектами</h2>
        <header className="p-4 border-b border-slate-800 flex gap-10 text-4xl">
          <Link title="Галерея" to="/" className="hover:text-blue-400 transition">Gallery</Link>
          <Link title="Редактор" to="/editor" className="hover:text-blue-400 transition">Editor</Link>
        </header>
        
        {/* Кнопка добавления проекта */}
        <div className='flex justify-center'>
        <motion.button
        whileHover={{ scale: 1.1, backgroundColor: "#3b82f6" }}
        transition={{type:"tween",stiffness:100}}
        whileTap={{ scale: 1 }}
          onClick={addProject}
          className="flex items-center justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-4"
        >
          Создать проект
        </motion.button>
        </div>
        <main className="p-4" >
          <Routes>
            {/* Передаем projects в Gallery */}
            <Route path="/" element={<Gallery projects={projects} />} />
            <Route path="/editor/:id" element={<Editor projects={projects} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;