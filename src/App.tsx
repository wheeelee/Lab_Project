import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Editor from './screens/Editor';
import Gallery from './screens/Gallery';

interface Project {
  id: number;
  name: string;
  date: string;
}

function App() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: 'Новый проект', date: new Date().toLocaleDateString('ru-RU') },
  ]);

  const addProject = (name: string) => {
    const newProject: Project = {
      id: Date.now(),
      name: name,
      date: new Date().toLocaleDateString('ru-RU')
    };

    setProjects(prev => [...prev, newProject]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="p-4 border-b border-slate-800">
          <h1 className="text-4xl font-bold text-center">Графический редактор</h1>
        </header>
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