import { useState } from 'react';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import Gallery from './screens/Gallery.jsx';
import Editor from './screens/Editor.jsx';
import { motion } from "framer-motion";

function App() {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Новый проект', date: new Date().toLocaleDateString('ru-RU') },
  ]);

  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: 'Новый проект',
      date: new Date().toLocaleDateString('ru-RU')
    };

    setProjects(prev => [...prev, newProject]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <h2 className="text-white text-6xl hover:text-blue-400 transition pt-5 flex items-center justify-center">
          Приложение с проектами
        </h2>

        <header className="p-4 border-b border-slate-800 flex gap-10 text-4xl">
          <Link to="/" className="hover:text-blue-400 transition">Gallery</Link>
          <Link to="/editor/1" className="hover:text-blue-400 transition">Editor</Link>
        </header>

        <div className='flex justify-center'>
          
        </div>

        <main className="p-4">
          <Routes>
            <Route path="/" element={<Gallery projects={projects} addProject={addProject} />} />
            <Route path="/editor/:id" element={<Editor projects={projects} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;